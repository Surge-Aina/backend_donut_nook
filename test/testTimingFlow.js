const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

// Models
const StoreInfo = require('../models/StoreInfo');
const StoreTiming = require('../models/StoreTiming');

const API_BASE_URL = 'http://localhost:5100';

async function testTimingFlow() {
  try {
    // Connect to the database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // 1. First, clear existing data
    console.log('\n🧹 Clearing existing data...');
    await StoreTiming.deleteMany({});
    await StoreInfo.deleteMany({});

    // 2. Define test timings
    const testTimings = [
      {
        day: 'monday',
        isClosed: false,
        open: '09:00',
        close: '17:00',
        splitHours: [
          { open: '09:00', close: '12:00' },
          { open: '13:00', close: '17:00' }
        ]
      },
      {
        day: 'tuesday',
        isClosed: false,
        open: '09:00',
        close: '17:00',
        splitHours: [
          { open: '09:00', close: '12:00' },
          { open: '13:00', close: '17:00' }
        ]
      }
    ];

    // 3. Send update request
    console.log('\n🔄 Sending update request...');
    const updateResponse = await axios.put(
      `${API_BASE_URL}/store-info/timings`,
      { timings: testTimings }
    );
    console.log('✅ Update response:', JSON.stringify(updateResponse.data, null, 2));

    // 4. Check database directly
    console.log('\n🔍 Checking database directly...');
    const dbTimings = await StoreTiming.find({}).lean();
    console.log('📦 Timings in database:', JSON.stringify(dbTimings, null, 2));
    
    let storeInfo = await StoreInfo.findOne({}).populate('timings').lean();
    if (!storeInfo) {
      // Create new StoreInfo with required fields
      storeInfo = new StoreInfo({
        timings: dbTimings.map(t => t._id),
        address: '123 Test St, Test City, TS 12345',
        phone: '123-456-7890',
        email: 'test@example.com',
        isOpen: true
      });
      await storeInfo.save();
    }
    console.log('🏪 StoreInfo in database:', {
      _id: storeInfo?._id,
      timings: storeInfo?.timings?.map(t => ({
        _id: t._id,
        day: t.day,
        splitHours: t.splitHours
      }))
    });

    // 5. Make GET request
    console.log('\n📡 Making GET request to /store-info/timings...');
    const getResponse = await axios.get(`${API_BASE_URL}/store-info/timings`);
    console.log('✅ GET response:', JSON.stringify(getResponse.data, null, 2));

    console.log('\n✅ Test completed!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

testTimingFlow();
