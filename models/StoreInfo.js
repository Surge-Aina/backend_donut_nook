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

// Export the main StoreInfo model using the reuse pattern to avoid OverwriteModelError
module.exports = mongoose.models.StoreInfo || mongoose.model('StoreInfo', storeInfoSchema);

// The following schema is kept for reference, but NOT exported as a model

const StoreInfoSchema = new mongoose.Schema({
  storeName: {
    type: String,
    default: 'The Donut Nook',
    trim: true
  },
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    country: { type: String, default: 'USA', trim: true }
  },
  contact: {
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
    socialMedia: {
      facebook: { type: String, trim: true },
      instagram: { type: String, trim: true },
      twitter: { type: String, trim: true }
    }
  },
  timings: [{
    day: {
      type: String,
      required: true,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    },
    open: { type: String, required: true },
    close: { type: String, required: true },
    isClosed: { type: Boolean, default: false },
    splitHours: [{
      open: String,
      close: String
    }]
  }],
  holidayBanners: [{
    title: { type: String, required: true },
    message: { type: String, required: true },
    imageUrl: { type: String },
    isActive: { type: Boolean, default: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    specialHours: [{
      date: { type: Date, required: true },
      open: String,
      close: String,
      isClosed: { type: Boolean, default: false }
    }]
  }],
  isOpen: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Set default timings when a new StoreInfo document is created
StoreInfoSchema.pre('save', function(next) {
  if (this.isNew && (!this.timings || this.timings.length === 0)) {
    this.timings = [
      { day: 'monday', open: '08:00', close: '20:00', isClosed: false },
      { day: 'tuesday', open: '08:00', close: '20:00', isClosed: false },
      { day: 'wednesday', open: '08:00', close: '20:00', isClosed: false },
      { day: 'thursday', open: '08:00', close: '20:00', isClosed: false },
      { day: 'friday', open: '08:00', close: '22:00', isClosed: false },
      { day: 'saturday', open: '09:00', close: '22:00', isClosed: false },
      { day: 'sunday', open: '09:00', close: '18:00', isClosed: false }
    ];
  }
  next();
});

// Do NOT export StoreInfoSchema as a model again to avoid overwrite errors
