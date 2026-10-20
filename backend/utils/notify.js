const Notification = require('../models/Notification');

exports.notify = async (userId, message, type = 'info') => {
  try {
    await Notification.create({ user: userId, message, type });
  } catch (err) {
    console.log('Notify error:', err.message);
  }
};

exports.notifyMany = async (userIds, message, type = 'info') => {
  try {
    if (userIds.length)
      await Notification.insertMany(userIds.map((u) => ({ user: u, message, type })));
  } catch (err) {
    console.log('Notify error:', err.message);
  }
};