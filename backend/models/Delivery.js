const mongoose = require('mongoose');

const STAGES = ['assigned', 'going_to_pickup', 'arrived_at_pickup', 'collected', 'out_for_delivery', 'arrived_at_receiver', 'delivered'];

const deliverySchema = new mongoose.Schema({
  request: { type: mongoose.Schema.Types.ObjectId, ref: 'Request', required: true, unique: true },
  donation: { type: mongoose.Schema.Types.ObjectId, ref: 'Donation', required: true },
  agent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: STAGES, default: 'assigned' },
  otp: { type: String, required: true },
  otpUsed: { type: Boolean, default: false },
  history: [{ status: String, at: { type: Date, default: Date.now } }]
}, { timestamps: true });

module.exports = mongoose.model('Delivery', deliverySchema);
module.exports.STAGES = STAGES;