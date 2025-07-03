const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: String, required: true }, // format: YYYY-MM-DD
  bannerStart: { type: String, required: true },
  autoMessage: { type: Boolean, default: true }
});

module.exports = mongoose.model('Holiday', holidaySchema);