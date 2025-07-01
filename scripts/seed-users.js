require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const users = [
    {
      name: 'Admin User',
      email: 'admin@test.com',
      passwordHash: await bcrypt.hash('Admin@123', 10),
      signedInWithGoogle: false,
      emailVerified: true,
      role: 'admin'
    },
    {
      name: 'Manager User',
      email: 'manager@test.com',
      passwordHash: await bcrypt.hash('Manager@123', 10),
      signedInWithGoogle: false,
      emailVerified: true,
      role: 'manager'
    }
  ];

  for (const user of users) {
    const exists = await User.findOne({ email: user.email });
    if (!exists) await User.create(user);
  }

  console.log('✅ Seeded admin and manager users');
  await mongoose.disconnect();
};

seed();
