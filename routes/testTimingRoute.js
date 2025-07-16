const express = require('express');
const router = express.Router();
const StoreTiming = require('../models/StoreTiming');

// Test endpoint to get all timings directly from StoreTiming collection
router.get('/test-timings', async (req, res) => {
  try {
    console.log('\n=== TEST TIMINGS ENDPOINT ===');
    const timings = await StoreTiming.find({}).sort('day').lean();
    
    console.log('Direct timings from database:', JSON.stringify(timings, null, 2));
    
    res.json({
      success: true,
      data: timings,
      count: timings.length
    });
  } catch (error) {
    console.error('Error in test-timings endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch test timings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
