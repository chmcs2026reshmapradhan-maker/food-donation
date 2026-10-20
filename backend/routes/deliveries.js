const express = require('express');
const Delivery = require('../models/Delivery');
const { STAGES } = require('../models/Delivery');
const Request = require('../models/Request');
const Donation = require('../models/Donation');
const User = require('../models/user');
const { notify, notifyMany } = require('../utils/notify');

// tell donor + receiver about a delivery update
async function announce(deliveryId, text) {
  const d = await Delivery.findById(deliveryId)
    .populate('donation', 'donor title').populate('request', 'receiver');
  if (d) await notifyMany([d.donation.donor, d.request.receiver], `"${d.donation.title}": ${text}`, 'delivery');
}
const { verifyToken, allowRoles } = require('../middleware/auth');
const router = express.Router();

// READ: agents with no active delivery (donor/admin)
router.get('/agents/available', verifyToken, allowRoles('donor', 'admin'), async (req, res) => {
  const busy = await Delivery.find({ status: { $ne: 'delivered' } }).distinct('agent');
  const agents = await User.find({ role: 'agent', _id: { $nin: busy } }).select('name phone address');
  res.json(agents);
});

// CREATE: assign an agent to an approved request (donor/admin)
router.post('/', verifyToken, allowRoles('donor', 'admin'), async (req, res) => {
  try {
    const { requestId, agentId } = req.body;
    const request = await Request.findById(requestId).populate('donation');
    if (!request || request.status !== 'approved')
      return res.status(400).json({ message: 'Request not approved' });
    if (req.user.role === 'donor' && String(request.donation.donor) !== req.user.id)
      return res.status(403).json({ message: 'Not your donation' });
    const agent = await User.findOne({ _id: agentId, role: 'agent' });
    if (!agent) return res.status(400).json({ message: 'Invalid agent' });
    const otp = String(Math.floor(1000 + Math.random() * 9000));
    const delivery = await Delivery.create({
      request: request._id,
      donation: request.donation._id,
      agent: agent._id,
      otp,
      history: [{ status: 'assigned' }]
    });
    await notify(agent._id, `New delivery assigned: "${request.donation.title}"`, 'delivery');
    await notify(request.receiver, `A delivery agent was assigned for "${request.donation.title}"`, 'delivery');
    res.status(201).json({ ...delivery.toObject(), otp: undefined });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// READ: agent's deliveries
router.get('/mine', verifyToken, allowRoles('agent'), async (req, res) => {
  const deliveries = await Delivery.find({ agent: req.user.id })
    .select('-otp').populate('donation').sort({ createdAt: -1 });
  res.json(deliveries);
});

// READ: receiver's deliveries (OTP visible only here)
router.get('/receiver', verifyToken, allowRoles('receiver'), async (req, res) => {
  const myRequests = await Request.find({ receiver: req.user.id }).select('_id');
  const deliveries = await Delivery.find({ request: { $in: myRequests } })
    .populate('donation').populate('agent', 'name phone').sort({ createdAt: -1 });
  res.json(deliveries);
});

// UPDATE: agent moves to the next stage (not "delivered")
router.put('/:id/next', verifyToken, allowRoles('agent'), async (req, res) => {
  try {
    const delivery = await Delivery.findOne({ _id: req.params.id, agent: req.user.id });
    if (!delivery) return res.status(404).json({ message: 'Not found' });
    const i = STAGES.indexOf(delivery.status);
    if (i >= STAGES.indexOf('arrived_at_receiver'))
      return res.status(400).json({ message: 'Use OTP to complete delivery' });
    delivery.status = STAGES[i + 1];
    delivery.history.push({ status: delivery.status });
    await delivery.save();
    await announce(delivery._id, delivery.status.replace(/_/g, ' '));
    if (delivery.status === 'collected')
      await Donation.findByIdAndUpdate(delivery.donation, { status: 'collected' });
    res.json({ ...delivery.toObject(), otp: undefined });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE: agent enters receiver's OTP to complete
router.post('/:id/verify-otp', verifyToken, allowRoles('agent'), async (req, res) => {
  try {
    const delivery = await Delivery.findOne({ _id: req.params.id, agent: req.user.id });
    if (!delivery) return res.status(404).json({ message: 'Not found' });
    if (delivery.otpUsed || delivery.status === 'delivered')
      return res.status(400).json({ message: 'Already completed' });
    if (delivery.status !== 'arrived_at_receiver')
      return res.status(400).json({ message: 'Reach the receiver first' });
    if (delivery.otp !== String(req.body.otp))
      return res.status(400).json({ message: 'Wrong OTP' });
    delivery.otpUsed = true;
    delivery.status = 'delivered';
    delivery.history.push({ status: 'delivered' });
    await delivery.save();
    await announce(delivery._id, 'delivered successfully');
    await Donation.findByIdAndUpdate(delivery.donation, { status: 'delivered' });
    res.json({ message: 'Delivered successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;