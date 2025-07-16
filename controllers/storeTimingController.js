const StoreTiming = require('../models/StoreTiming');
const StoreInfo = require('../models/StoreInfo');

// Helper function to format timings response
function formatTimingsResponse(timings) {
  const result = {};
  timings.forEach(timing => {
    result[timing.day] = {
      ...timing.toObject ? timing.toObject() : timing,
      open: timing.splitHours?.[0]?.open || timing.open || '00:00',
      close: timing.splitHours?.[timing.splitHours.length - 1]?.close || timing.close || '00:00'
    };
  });
  return result;
}

// Get all store timings
const getStoreTimings = async (req, res) => {
  try {
    console.log('\n=== GET STORE TIMINGS ===');
    const storeInfo = await StoreInfo.findOne({}).populate('timings').lean();
    console.log('\n🧠 Reading Timings from DB:', JSON.stringify(storeInfo?.timings || [], null, 2));
    
    if (storeInfo && storeInfo.timings) {
      console.log('StoreInfo found with timings');
      console.log('Number of timings in StoreInfo:', storeInfo.timings.length);
      
      if (storeInfo.timings.length > 0) {
        console.log('First timing sample:', {
          day: storeInfo.timings[0].day,
          splitHours: storeInfo.timings[0].splitHours,
          id: storeInfo.timings[0]._id
        });
      }
      
      return res.json({ 
        success: true, 
        data: formatTimingsResponse(storeInfo.timings) 
      });
    }
    
    // Return default timings if no StoreInfo exists
    console.log('No StoreInfo or timings found, returning default schedule');
    const defaultTimings = [
      { day: 'monday', isClosed: true, open: '00:00', close: '00:00', splitHours: [] },
      { day: 'tuesday', isClosed: true, open: '00:00', close: '00:00', splitHours: [] },
      { day: 'wednesday', isClosed: true, open: '00:00', close: '00:00', splitHours: [] },
      { day: 'thursday', isClosed: true, open: '00:00', close: '00:00', splitHours: [] },
      { day: 'friday', isClosed: true, open: '00:00', close: '00:00', splitHours: [] },
      { day: 'saturday', isClosed: true, open: '00:00', close: '00:00', splitHours: [] },
      { day: 'sunday', isClosed: true, open: '00:00', close: '00:00', splitHours: [] }
    ];
    
    return res.json({ 
      success: true, 
      data: formatTimingsResponse(defaultTimings) 
    });
  } catch (error) {
    console.error('Error getting store timings:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to get store timings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update store timings
const updateStoreTimings = async (req, res) => {
  try {
    console.log('\n=== UPDATE STORE TIMINGS ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    // Validate input
    let { timings } = req.body;
    if (!Array.isArray(timings)) {
      // If timings is an object, convert it to an array
      if (timings && typeof timings === 'object') {
        timings = Object.entries(timings).map(([day, timing]) => ({
          ...timing,
          day
        }));
      } else {
        return res.status(400).json({ 
          success: false, 
          message: 'Timings must be an array or an object keyed by day' 
        });
      }
    }

    // Validate each timing
    const validDays = new Set(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']);
    const seenDays = new Set();
    
    for (const timing of timings) {
      if (!timing.day || !validDays.has(timing.day)) {
        return res.status(400).json({ 
          success: false, 
          message: `Invalid day: ${timing.day}. Must be one of: ${[...validDays].join(', ')}` 
        });
      }
      
      if (seenDays.has(timing.day)) {
        return res.status(400).json({ 
          success: false, 
          message: `Duplicate day found: ${timing.day}` 
        });
      }
      seenDays.add(timing.day);

      // Normalize timing data
      if (timing.is24Hours) {
        timing.isClosed = false;
        timing.open = '00:00';
        timing.close = '23:59';
        timing.splitHours = [{ open: '00:00', close: '23:59' }];
      } else if (timing.isClosed) {
        timing.open = '00:00';
        timing.close = '00:00';
        timing.splitHours = [];
      } else if (timing.splitHours && timing.splitHours.length > 0) {
        // Ensure split hours are valid
        timing.splitHours = timing.splitHours.filter(sh => sh.open && sh.close);
        timing.splitHours.sort((a, b) => a.open.localeCompare(b.open));
        
        // Set main open/close to the earliest open and latest close
        timing.open = timing.splitHours[0]?.open || '00:00';
        timing.close = timing.splitHours[timing.splitHours.length - 1]?.close || '00:00';
      } else if (timing.open && timing.close) {
        // Convert single time range to splitHours format
        timing.splitHours = [{ open: timing.open, close: timing.close }];
      } else {
        return res.status(400).json({ 
          success: false, 
          message: `Invalid timing data for ${timing.day}. Must provide either is24Hours, isClosed, or valid open/close times.` 
        });
      }
    }

    // Delete existing timings
    console.log('\n🗑️  Deleting existing timings...');
    await StoreTiming.deleteMany({});
    
    // Insert new timings
    console.log('\n➕ Inserting new timings...');
    const newTimings = await StoreTiming.insertMany(timings);
    console.log('\n✅ New timings inserted:', JSON.stringify(newTimings, null, 2));
    
    // Update or create StoreInfo with the new timings
    const storeInfo = await StoreInfo.findOneAndUpdate(
      {},
      { 
        $set: { 
          timings: newTimings.map(t => t._id),
          // Include required fields if creating a new document
          $setOnInsert: {
            storeName: 'The Donut Nook',
            address: {
              street: '123 Test St',
              city: 'Test City',
              state: 'TS',
              zipCode: '12345',
              country: 'Test Country'
            },
            contact: {
              phone: '123-456-7890',
              email: 'test@example.com'
            },
            isOpen: true
          }
        } 
      },
      { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true
      }
    );
    
    console.log('✅ StoreInfo updated with new timings');
    
    // Get fresh data with populated timings
    const updatedStoreInfo = await StoreInfo.findOne({}).populate('timings');
    
    res.status(200).json({
      success: true,
      data: formatTimingsResponse(updatedStoreInfo.timings)
    });
    
  } catch (error) {
    console.error('Error updating store timings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update store timings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get store status (open/closed)
const getStoreStatus = async (req, res) => {
  try {
    const now = new Date();
    const dayOfWeek = now.toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
    
    // Get store info with populated timings
    const storeInfo = await StoreInfo.findOne({}).populate('timings').lean();
    
    if (!storeInfo || !storeInfo.timings || storeInfo.timings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No store timing information available',
        isOpen: false
      });
    }
    
    // Find today's timing
    const timing = storeInfo.timings.find(t => t.day === dayOfWeek);
    
    if (!timing) {
      return res.status(404).json({
        success: false,
        message: `No timing information available for ${dayOfWeek}`,
        isOpen: false
      });
    }
    
    // If store is marked as closed in StoreInfo
    if (storeInfo.isOpen === false) {
      return res.json({
        isOpen: false,
        message: 'Store is currently closed',
        currentTime: now.toLocaleTimeString(),
        today: dayOfWeek,
        timing: {
          ...timing,
          nextOpen: getNextOpenDay(dayOfWeek, storeInfo.timings)
        }
      });
    }
    
    // If the specific day is marked as closed
    if (timing.isClosed) {
      return res.json({
        isOpen: false,
        message: 'Store is closed today',
        currentTime: now.toLocaleTimeString(),
        today: dayOfWeek,
        timing: {
          ...timing,
          nextOpen: getNextOpenDay(dayOfWeek, storeInfo.timings)
        }
      });
    }
    
    // Check if current time is within any of the time slots
    const currentTime = now.getHours() * 100 + now.getMinutes();
    let isOpen = false;
    
    if (Array.isArray(timing.splitHours) && timing.splitHours.length > 0) {
      // Check against split hours if available
      isOpen = timing.splitHours.some(slot => {
        const openTime = convertToMinutes(slot.open);
        const closeTime = convertToMinutes(slot.close);
        
        // Handle overnight hours (e.g., 22:00-04:00)
        if (closeTime < openTime) {
          return currentTime >= openTime || currentTime <= closeTime;
        }
        return currentTime >= openTime && currentTime <= closeTime;
      });
    } else if (timing.open && timing.close) {
      // Fallback to single open/close
      const openTime = convertToMinutes(timing.open);
      const closeTime = convertToMinutes(timing.close);
      
      if (closeTime < openTime) {
        isOpen = currentTime >= openTime || currentTime <= closeTime;
      } else {
        isOpen = currentTime >= openTime && currentTime <= closeTime;
      }
    }
    
    res.json({
      isOpen,
      message: isOpen ? 'Store is currently open' : 'Store is currently closed',
      currentTime: now.toLocaleTimeString(),
      today: dayOfWeek,
      timing: {
        ...timing,
        // Include the next open time if store is closed
        nextOpen: !isOpen ? getNextOpenTime(dayOfWeek, timing, storeInfo.timings) : undefined
      }
    });
  } catch (error) {
    console.error('Error in getStoreStatus:', error);
    handleError(res, error, 'Failed to get store status');
  }
};

// Helper function to convert HH:MM to minutes since midnight
function convertToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 100 + minutes;
}

// Helper function to get the next open day
function getNextOpenDay(currentDay, timings) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentIndex = days.indexOf(currentDay);

  // Check next 6 days (to complete the week)
  for (let i = 1; i <= 6; i++) {
    const nextDayIndex = (currentIndex + i) % 7;
    const nextDay = days[nextDayIndex];

    // Find the timing for the next day
    const nextDayTiming = timings.find(t => t.day === nextDay);

    // If the store is open on this day and not marked as closed, return it
    if (nextDayTiming && !nextDayTiming.isClosed) {
      return nextDay;
    }
  }

  return null; // No open day found in the next 6 days
}

// Helper function to get next open time for today
function getNextOpenTime(currentDay, timing, allTimings) {
  if (!timing) return null;

  const now = new Date();
  const currentTime = now.getHours() * 100 + now.getMinutes();

  // First, check if there are more open slots today
  if (!timing.isClosed) {
    if (Array.isArray(timing.splitHours) && timing.splitHours.length > 0) {
      // Find the next open slot today
      for (const slot of timing.splitHours) {
        const openTime = convertToMinutes(slot.open);

        // If the slot is in the future, return it
        if (openTime > currentTime) {
          return {
            day: currentDay,
            time: slot.open,
            message: `Opens at ${slot.open} today`
          };
        }
      }
    } else if (timing.open) {
      const openTime = convertToMinutes(timing.open);

      // If the store opens later today
      if (openTime > currentTime) {
        return {
          day: currentDay,
          time: timing.open,
          message: `Opens at ${timing.open} today`
        };
      }
    }
  }

  // If no more slots today, find the next open day and time
  const nextOpenDay = getNextOpenDay(currentDay, allTimings);
  if (!nextOpenDay) return null;

  const nextDayTiming = allTimings.find(t => t.day === nextOpenDay);
  if (!nextDayTiming || nextDayTiming.isClosed) return null;

  // Get the first open time for the next open day
  let nextOpenTime = null;
  if (Array.isArray(nextDayTiming.splitHours) && nextDayTiming.splitHours.length > 0) {
    nextOpenTime = nextDayTiming.splitHours[0].open;
  } else if (nextDayTiming.open) {
    nextOpenTime = nextDayTiming.open;
  }

  if (!nextOpenTime) return null;

  return {
    day: nextOpenDay,
    time: nextOpenTime,
    message: `Opens at ${nextOpenTime} on ${nextOpenDay}`
  };
}

module.exports = {
  getStoreTimings,
  updateStoreTimings,
  getStoreStatus,
  // Export helpers for testing
  _test: {
    convertToMinutes,
    getNextOpenDay,
    getNextOpenTime
  }
};
