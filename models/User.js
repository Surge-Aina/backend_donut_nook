const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: {
    type: String,
    required: true,
    lowercase: true,
    unique: true,
    match: [/.+@.+\..+/, 'Email must be valid']
  },
  passwordHash: { type: String }, // optional if Google
  googleId: { type: String },     // optional if password

  signedInWithGoogle: { type: Boolean, default: false },
  emailVerified: { type: Boolean, default: false },
  role: { type: String, enum: ['customer', 'manager', 'admin'], default: 'customer' },

  birthdate: { type: Date },
}, { timestamps: true });

// Compare password
userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);
