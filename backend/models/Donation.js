const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  category: { type: String, required: true },
  quantity: { type: Number, required: true },
  preparationTime: Date,
  expiryTime: { type: Date, required: true },
  pickupLocation: { type: String, required: true },
  description: String,
  isUrgent: { type: Boolean, default: false },
  status: { type: String, enum: ['available', 'requested', 'collected', 'delivered', 'expired'], default: 'available' }
}, { timestamps: true });

module.exports = mongoose.model('Donation', donationSchema);