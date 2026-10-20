const express = require('express');
const Request = require('../models/Request');
const Donation = require('../models/Donation');
const { notify } = require('../utils/notify');
const { verifyToken, allowRoles } = require('../middleware/auth');
const router = express.Router();

// CREATE: receiver requests a donation
router.post('/', verifyToken, allowRoles('receiver'), async (req, res) => {
  try {
    const donation = await Donation.findById(req.body.donation);
    if (!donation || donation.status !== 'available')
      return res.status(400).json({ message: 'Donation not available' });
    const request = await Request.create({
      donation: donation._id,
      receiver: req.user.id,
      message: req.body.message
    });
    donation.status = 'requested';
    await donation.save();
    await notify(donation.donor, `New request for "${donation.title}"`, 'request');
    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// READ: receiver's own requests
router.get('/mine', verifyToken, allowRoles('receiver'), async (req, res) => {
  const requests = await Request.find({ receiver: req.user.id })
    .populate('donation').sort({ createdAt: -1 });
  res.json(requests);
});

// READ: requests for the donor's donations
router.get('/incoming', verifyToken, allowRoles('donor'), async (req, res) => {
  const myDonations = await Donation.find({ donor: req.user.id }).select('_id');
  const requests = await Request.find({ donation: { $in: myDonations } })
    .populate('donation').populate('receiver', 'name phone address')
    .sort({ createdAt: -1 });
  res.json(requests);
});

// UPDATE: donor approves or rejects
router.put('/:id/:action', verifyToken, allowRoles('donor'), async (req, res) => {
  try {
    const { id, action } = req.params;
    if (!['approve', 'reject'].includes(action))
      return res.status(400).json({ message: 'Invalid action' });
    const request = await Request.findById(id).populate('donation');
    if (!request) return res.status(404).json({ message: 'Not found' });
    if (String(request.donation.donor) !== req.user.id)
      return res.status(403).json({ message: 'Not your donation' });
    request.status = action === 'approve' ? 'approved' : 'rejected';
    await request.save();
    await notify(request.receiver, `Your request for "${request.donation.title}" was ${request.status}`, 'request');
    if (action === 'reject') {
      request.donation.status = 'available';
      await request.donation.save();
    }
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE: receiver cancels a pending request
router.delete('/:id', verifyToken, allowRoles('receiver'), async (req, res) => {
  try {
    const request = await Request.findOne({ _id: req.params.id, receiver: req.user.id, status: 'pending' });
    if (!request) return res.status(404).json({ message: 'Not found or cannot cancel' });
    await Donation.findByIdAndUpdate(request.donation, { status: 'available' });
    const don = await Donation.findByIdAndUpdate(request.donation, { status: 'available' });
    if (don) await notify(don.donor, `A request for "${don.title}" was cancelled`, 'request');
    await request.deleteOne();
    res.json({ message: 'Request cancelled' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;