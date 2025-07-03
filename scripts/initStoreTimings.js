const mongoose = require('mongoose');
const StoreTiming = require('../models/StoreTiming');
const StoreInfo = require('../models/StoreInfo');
require('dotenv').config();

const initTimings = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB...');

    // Clear existing timings
    await StoreTiming.deleteMany({});
    
    // Create timings based on the provided schedule
    const timings = [
      { day: 'monday', open: '00:00', close: '01:00', isClosed: false, splitHours: [{ open: '20:30', close: '23:59' }] },
      { day: 'tuesday', open: '00:00', close: '13:00', isClosed: false, splitHours: [{ open: '20:30', close: '23:59' }] },
      { day: 'wednesday', open: '00:00', close: '23:59', isClosed: false },
      { day: 'thursday', open: '00:00', close: '23:59', isClosed: false },
      { day: 'friday', open: '00:00', close: '23:59', isClosed: false },
      { day: 'saturday', open: '00:00', close: '23:59', isClosed: false },
      { day: 'sunday', open: '00:00', close: '13:00', isClosed: false, splitHours: [{ open: '20:30', close: '23:59' }] },
    ];

    // Insert timings
    const createdTimings = await StoreTiming.insertMany(timings);
    console.log('Created store timings:', createdTimings);

    // Update StoreInfo to reference these timings
    const storeInfo = await StoreInfo.findOneAndUpdate(
      {},
      { 
        $set: { 
          timings: createdTimings.map(t => t._id),
          storeName: 'The Donut Nook',
          address: {
            street: '958 East Ave A',
            city: 'Chico',
            state: 'CA',
            zipCode: '95926',
            country: 'USA'
          },
          contact: {
            phone: '(530) 342-2118',
            email: 'info@thedonutnook.com',
            socialMedia: {
              facebook: 'thedonutnook',
              instagram: 'thedonutnook',
              twitter: 'thedonutnook'
            }
          }
        } 
      },
      { upsert: true, new: true }
    ).populate('timings');

    console.log('Updated store info with timings:', storeInfo);
    
    process.exit(0);
  } catch (error) {
    console.error('Error initializing store timings:', error);
    process.exit(1);
  }
};

initTimings();
