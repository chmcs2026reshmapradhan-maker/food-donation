const express = require('express');
const Donation = require('../models/Donation');
const User = require('../models/user');
const { notifyMany } = require('../utils/notify');
const { verifyToken, allowRoles } = require('../middleware/auth');
const router = express.Router();

// CREATE (donor only)
router.post('/', verifyToken, allowRoles('donor'), async (req, res) => {
  try {
    const donation = await Donation.create({ ...req.body, donor: req.user.id });
    res.status(201).json(donation);
    if (donation.isUrgent) {
      const users = await User.find({ role: { $in: ['receiver', 'agent'] } }).select('_id');
      await notifyMany(users.map((u) => u._id), `🔥 Urgent food available: ${donation.title}`, 'urgent');
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// READ all available (urgent first, hide expired)
router.get('/', verifyToken, async (req, res) => {
  try {
    const donations = await Donation.find({
      status: 'available',
      expiryTime: { $gt: new Date() }
    }).populate('donor', 'name phone').sort({ isUrgent: -1, expiryTime: 1 });
    res.json(donations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// READ my donations (donor)
router.get('/mine', verifyToken, allowRoles('donor'), async (req, res) => {
  const donations = await Donation.find({ donor: req.user.id }).sort({ createdAt: -1 });
  res.json(donations);
});

// READ one
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id).populate('donor', 'name phone');
    if (!donation) return res.status(404).json({ message: 'Not found' });
    res.json(donation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE (only the donor who owns it)
router.put('/:id', verifyToken, allowRoles('donor'), async (req, res) => {
  try {
    const donation = await Donation.findOneAndUpdate(
      { _id: req.params.id, donor: req.user.id },
      req.body,
      { new: true }
    );
    if (!donation) return res.status(404).json({ message: 'Not found or not yours' });
    res.json(donation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE (only the donor who owns it)
router.delete('/:id', verifyToken, allowRoles('donor'), async (req, res) => {
  try {
    const donation = await Donation.findOneAndDelete({ _id: req.params.id, donor: req.user.id });
    if (!donation) return res.status(404).json({ message: 'Not found or not yours' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;