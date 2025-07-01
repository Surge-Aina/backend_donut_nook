const mongoose = require('mongoose');

const storeInfoSchema = new mongoose.Schema({
  location: String,
  phone: String,
  hours: {
    mon: String,
    tue: String,
    wed: String,
    thu: String,
    fri: String,
    sat: String,
    sun: String
  },
  apple_maps: String,
  google_maps: String,
  holidayNotices: [
    {
      type: { type: String, enum: ['open', 'closed'] },
      message: String,
      effectiveDate: Date,
      showFrom: Date
    }
  ],
  lastEditedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('StoreInfo', storeInfoSchema);
