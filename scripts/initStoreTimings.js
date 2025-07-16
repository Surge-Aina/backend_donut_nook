const path = require('path');
const mongoose = require('mongoose');
const StoreTiming = require('../models/StoreTiming');
const StoreInfo = require('../models/StoreInfo');

// Load environment variables from the root .env file
const envPath = path.resolve(__dirname, '..', '.env');
require('dotenv').config({ path: envPath });

console.log('Environment variables loaded from:', envPath);
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '*** URI is set ***' : 'MONGODB_URI is not set!');

// Helper function to validate time format
const isValidTime = (time) => {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return timeRegex.test(time);
};

// Helper function to ensure proper timing format
const formatTiming = (day, timing) => {
  // If splitHours is provided, use it
  if (timing.splitHours && timing.splitHours.length > 0) {
    // Validate split hours
    const validSplitHours = timing.splitHours.filter(slot => 
      slot.open && slot.close && 
      isValidTime(slot.open) && 
      isValidTime(slot.close)
    );
    
    return {
      day: day.toLowerCase(),
      isClosed: timing.isClosed || false,
      open: validSplitHours[0]?.open || '09:00',
      close: validSplitHours[validSplitHours.length - 1]?.close || '17:00',
      splitHours: validSplitHours.length > 0 ? validSplitHours : [],
      is24Hours: timing.is24Hours || false
    };
  }
  
  // If no splitHours but has open/close, create a single splitHour
  if (timing.open && timing.close && isValidTime(timing.open) && isValidTime(timing.close)) {
    return {
      day: day.toLowerCase(),
      isClosed: timing.isClosed || false,
      open: timing.open,
      close: timing.close,
      splitHours: [{
        open: timing.open,
        close: timing.close
      }],
      is24Hours: timing.is24Hours || false
    };
  }
  
  // Default to closed if no valid times provided
  return {
    day: day.toLowerCase(),
    isClosed: true,
    open: '09:00',
    close: '17:00',
    splitHours: [],
    is24Hours: false
  };
};

const initTimings = async () => {
  try {
    // Connect to MongoDB
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in the environment variables');
    }
    
    const mongoUri = process.env.MONGODB_URI;
    console.log('Connecting to MongoDB at:', mongoUri);
    
    await mongoose.connect(mongoUri);
    console.log('Successfully connected to MongoDB');

    console.log('Connected to MongoDB...');

    // Clear existing timings
    await StoreTiming.deleteMany({});
    
    // Define timings with exact hours provided
    const timings = [
      // Monday: 12:00 AM - 1:00 PM, 8:30 PM - 12:00 AM
      formatTiming('monday', {
        isClosed: false,
        splitHours: [
          { open: '00:00', close: '13:00' },
          { open: '20:30', close: '23:59' }
        ]
      }),
      
      // Tuesday: 12:00 AM - 1:00 PM, 8:30 PM - 12:00 AM
      formatTiming('tuesday', {
        isClosed: false,
        splitHours: [
          { open: '00:00', close: '13:00' },
          { open: '20:30', close: '23:59' }
        ]
      }),
      
      // Wednesday: 12:00 AM - 11:59 PM
      formatTiming('wednesday', {
        isClosed: false,
        splitHours: [
          { open: '00:00', close: '23:59' }
        ]
      }),
      
      // Thursday: 12:00 AM - 11:59 PM
      formatTiming('thursday', {
        isClosed: false,
        splitHours: [
          { open: '00:00', close: '23:59' }
        ]
      }),
      
      // Friday: 12:00 AM - 11:59 PM
      formatTiming('friday', {
        isClosed: false,
        splitHours: [
          { open: '00:00', close: '23:59' }
        ]
      }),
      
      // Saturday: 12:00 AM - 11:59 PM
      formatTiming('saturday', {
        isClosed: false,
        splitHours: [
          { open: '00:00', close: '23:59' }
        ]
      }),
      
      // Sunday: 12:00 AM - 1:00 PM, 8:30 PM - 12:00 AM
      formatTiming('sunday', {
        isClosed: false,
        splitHours: [
          { open: '00:00', close: '13:00' },
          { open: '20:30', close: '23:59' }
        ]
      })
    ];

    // Start a session for the transaction
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Insert timings
      const createdTimings = await StoreTiming.insertMany(timings, { session });
      console.log(`Created ${createdTimings.length} store timings`);

      // Get or create store info
      let storeInfo = await StoreInfo.findOne({}).session(session);
      
      if (!storeInfo) {
        // Create new store info if it doesn't exist
        storeInfo = new StoreInfo({
          storeName: 'The Donut Nook',
          address: {
            street: '123 Donut Street',
            city: 'Donutville',
            state: 'CA',
            zipCode: '90210',
            country: 'USA'
          },
          contact: {
            phone: '(555) 123-4567',
            email: 'info@donutnook.com'
          },
          timings: createdTimings.map(t => t._id),
          isOpen: true
        });
        
        await storeInfo.save({ session });
        console.log('Created new store info');
      } else {
        // Update existing store info
        storeInfo.timings = createdTimings.map(t => t._id);
        await storeInfo.save({ session });
        console.log('Updated existing store info with new timings');
      }
      
      // Commit the transaction
      await session.commitTransaction();
      console.log('Transaction committed successfully');
      
      // Get the updated store info with populated timings
      const updatedStoreInfo = await StoreInfo.findById(storeInfo._id)
        .populate('timings')
        .lean();
        
      console.log('Store info with timings:', JSON.stringify(updatedStoreInfo, null, 2));
      
      return {
        success: true,
        message: 'Store timings initialized successfully',
        data: updatedStoreInfo
      };
    } catch (error) {
      console.error('Error in transaction:', error);
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  } catch (error) {
    console.error('Error initializing store timings:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
  }
};

// Run the initialization
(async () => {
  try {
    await initTimings();
    console.log('Initialization completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Initialization failed:', error);
    process.exit(1);
  }
})();
