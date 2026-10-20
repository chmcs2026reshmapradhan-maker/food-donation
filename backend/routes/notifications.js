const express = require('express');
const Notification = require('../models/Notification');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

// READ: my latest notifications + unread count
router.get('/', verifyToken, async (req, res) => {
  const items = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(30);
  const unread = await Notification.countDocuments({ user: req.user.id, read: false });
  res.json({ items, unread });
});

// UPDATE: mark all as read
router.put('/read-all', verifyToken, async (req, res) => {
  await Notification.updateMany({ user: req.user.id, read: false }, { read: true });
  res.json({ message: 'All marked as read' });
});

module.exports = router;