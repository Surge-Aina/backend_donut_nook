const mongoose = require('mongoose');

// Address Schema
const AddressSchema = new mongoose.Schema({
  street: { 
    type: String, 
    required: [true, 'Street address is required'],
    trim: true 
  },
  city: { 
    type: String, 
    required: [true, 'City is required'],
    trim: true 
  },
  state: { 
    type: String, 
    required: [true, 'State is required'],
    trim: true,
    maxlength: 2,
    uppercase: true
  },
  zipCode: { 
    type: String, 
    required: [true, 'ZIP code is required'],
    trim: true,
    match: [/^\d{5}(-\d{4})?$/, 'Please enter a valid ZIP code']
  },
  country: { 
    type: String, 
    default: 'USA', 
    trim: true 
  },
  coordinates: {
    // For future use with maps
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  }
}, { _id: false });

const StoreInfoSchema = new mongoose.Schema({
  storeName: {
    type: String,
    default: 'The Donut Nook',
    trim: true,
    required: [true, 'Store name is required'],
    maxlength: [100, 'Store name cannot be more than 100 characters']
  },
  address: {
    type: AddressSchema,
    required: [true, 'Address is required']
  },
  contact: {
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
    socialMedia: {
      facebook: { type: String, trim: true },
      instagram: { type: String, trim: true },
      twitter: { type: String, trim: true }
    },
    default: {}
  },
  // Reference to StoreTiming collection
  timings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StoreTiming'
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

// Add text index for search functionality
StoreInfoSchema.index({ 
  'storeName': 'text',
  'address.street': 'text',
  'address.city': 'text',
  'address.state': 'text',
  'address.zipCode': 'text'
});

module.exports = mongoose.model('StoreInfo', StoreInfoSchema);
