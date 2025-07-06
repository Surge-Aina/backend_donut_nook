const mongoose = require('mongoose');

const aboutSchema = new mongoose.Schema({
  content: { type: String, required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('About', aboutSchema, 'about');

