const mongoose = require('mongoose');

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/; // HH:MM format 24h

const splitHoursSchema = new mongoose.Schema({
  open: {
    type: String,
    required: true,
    match: [timeRegex, 'Please use HH:MM format (24h)']
  },
  close: {
    type: String,
    required: true,
    match: [timeRegex, 'Please use HH:MM format (24h)']
  }
}, { _id: false });

const StoreTimingSchema = new mongoose.Schema({
  day: {
    type: String,
    required: [true, 'Day is required'],
    lowercase: true,
    enum: {
      values: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      message: '{VALUE} is not a valid day'
    },
    unique: true
  },
  isClosed: {
    type: Boolean,
    default: false
  },
  // Legacy support - will be removed in future versions
  open: {
    type: String,
    required: function() { 
      return !this.isClosed && (!this.splitHours || this.splitHours.length === 0); 
    },
    match: [timeRegex, 'Please use HH:MM format (24h)']
  },
  close: {
    type: String,
    required: function() { 
      return !this.isClosed && (!this.splitHours || this.splitHours.length === 0); 
    },
    match: [timeRegex, 'Please use HH:MM format (24h)']
  },
  splitHours: {
    type: [splitHoursSchema],
    default: [],
    validate: {
      validator: function(v) {
        // If not closed, must have at least one time slot
        return !this.isClosed ? v && v.length > 0 : true;
      },
      message: 'At least one time slot is required when the store is open'
    }
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add index for faster lookups
StoreTimingSchema.index({ day: 1 }, { unique: true });

module.exports = mongoose.model('StoreTiming', StoreTimingSchema);
