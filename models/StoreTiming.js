const mongoose = require('mongoose');

const StoreTimingSchema = new mongoose.Schema({
  day: {
    type: String,
    required: true,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    unique: true
  },
  open: { 
    type: String, 
    required: true,
    match: /^([01]\d|2[0-3]):([0-5]\d)$/ // HH:MM format
  },
  close: { 
    type: String, 
    required: true,
    match: /^([01]\d|2[0-3]):([0-5]\d)$/ // HH:MM format
  },
  isClosed: { 
    type: Boolean, 
    default: false 
  },
  splitHours: [{
    open: { 
      type: String,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/
    },
    close: { 
      type: String,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/
    }
  }]
}, { timestamps: true });

// Add a compound unique index on day
StoreTimingSchema.index({ day: 1 }, { unique: true });

module.exports = mongoose.model('StoreTiming', StoreTimingSchema);
