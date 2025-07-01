const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  menuItemId: { type: Number, required: true },
  amount: { type: Number, required: true },
  timestamp: { type: Date, required: true }
}, { _id: false });

const customerSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String },
  phone: { type: String },
  dob: { type: Date },
  totalSpent: { type: Number, default: 0 },
  loyaltyPoints: { type: Number, default: 0 },
  purchaseHistory: { type: [purchaseSchema], default: [] },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Customer', customerSchema);
