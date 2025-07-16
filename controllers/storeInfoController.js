const mongoose = require('mongoose');
const StoreInfo = require('../models/StoreInfo');
const {
  getStoreTimings: getTimings,
  updateStoreTimings: updateTimings,
  getStoreStatus: getStatus,
  formatTimingsResponse
} = require('./storeTimingController');

// Helper function to get or create store info
const getOrCreateStoreInfo = async (session = null) => {
  const query = StoreInfo.findOne({});
  if (session) query.session(session);
  
  let storeInfo = await query;
  if (!storeInfo) {
    storeInfo = new StoreInfo({
      storeName: 'The Donut Nook',
      address: {},
      contact: {},
      isOpen: true,
      holidayBanners: []
    });
    
    if (session) {
      await storeInfo.save({ session });
    } else {
      await storeInfo.save();
    }
  }
  return storeInfo;
};

// Helper function for error response
const handleError = (res, error, message, status = 500) => {
  console.error(message, error);
  res.status(status).json({ 
    message,
    error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' 
  });
};

// Helper function to convert date string to Date object
const parseDate = (dateStr) => {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date format');
  }
  return date;
};

// Helper function to check if current time is within a time range
const isWithinTimeRange = (currentTime, openTime, closeTime) => {
  const [openHour, openMinute] = openTime.split(':').map(Number);
  const [closeHour, closeMinute] = closeTime.split(':').map(Number);
  
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const currentInMinutes = currentHour * 60 + currentMinute;
  const openInMinutes = openHour * 60 + openMinute;
  const closeInMinutes = closeHour * 60 + closeMinute;
  
  // Handle overnight hours (e.g., 22:00 to 04:00)
  if (closeInMinutes < openInMinutes) {
    // If current time is after opening time (overnight) or before closing time (next day)
    return currentInMinutes >= openInMinutes || currentInMinutes <= closeInMinutes;
  }
  
  // Normal case (not overnight)
  return currentInMinutes >= openInMinutes && currentInMinutes <= closeInMinutes;
};


//helper function to get store Timings
async function fetchStoreTimings() {
  const storeInfo = await StoreInfo.findOne({}).populate('timings').lean();

  if (storeInfo && storeInfo.timings && storeInfo.timings.length > 0) {
    return {
      success: true,
      data: formatTimingsResponse(storeInfo.timings)
    };
  }

  // Return default timings if none found
  const defaultTimings = [
    { day: 'monday', isClosed: true, open: '00:00', close: '00:00', splitHours: [] },
    { day: 'tuesday', isClosed: true, open: '00:00', close: '00:00', splitHours: [] },
    { day: 'wednesday', isClosed: true, open: '00:00', close: '00:00', splitHours: [] },
    { day: 'thursday', isClosed: true, open: '00:00', close: '00:00', splitHours: [] },
    { day: 'friday', isClosed: true, open: '00:00', close: '00:00', splitHours: [] },
    { day: 'saturday', isClosed: true, open: '00:00', close: '00:00', splitHours: [] },
    { day: 'sunday', isClosed: true, open: '00:00', close: '00:00', splitHours: [] }
  ];

  return {
    success: true,
    data: formatTimingsResponse(defaultTimings)
  };
}


// Get store information
const getStoreInfo = async (req, res) => {
  const session = await mongoose.startSession();
  let isTransactionInProgress = false;
  
  try {
    // Start transaction
    await session.startTransaction();
    isTransactionInProgress = true;
    
    // Get or create store info
    const storeInfo = await getOrCreateStoreInfo(session);
    const storeInfoObj = storeInfo.toObject ? storeInfo.toObject() : storeInfo;

    // Get store timings without starting a new transaction
    const { success, data, message } = await fetchStoreTimings();
    if (!success) throw new Error(message || 'Failed to fetch timings');

    storeInfoObj.timings = data;
    
    // Add timings to store info
    storeInfoObj.timings = data || {};
    
    await session.commitTransaction();
    isTransactionInProgress = false;
    
    res.json({
      success: true,
      data: storeInfoObj
    });
  } catch (error) {
    if (isTransactionInProgress) {
      await session.abortTransaction().catch(abortError => {
        console.error('Error aborting transaction:', abortError);
      });
    }
    console.error('Error in getStoreInfo:', error);
    handleError(res, error, 'Error fetching store information');
  } finally {
    await session.endSession().catch(sessionError => {
      console.error('Error ending session:', sessionError);
    });
  }
};

// Update store information
const updateStoreInfo = async (req, res) => {
  try {
    const { storeName, address, contact, isOpen } = req.body;
    const storeInfo = await getOrCreateStoreInfo();
    
    if (storeName !== undefined) storeInfo.storeName = storeName;
    if (address) storeInfo.address = { ...storeInfo.address, ...address };
    if (contact) {
      // Only update the provided contact fields
      if (contact.phone !== undefined) storeInfo.contact.phone = contact.phone;
      if (contact.email !== undefined) storeInfo.contact.email = contact.email;
      if (contact.socialMedia) {
        if (contact.socialMedia.facebook !== undefined) storeInfo.contact.socialMedia.facebook = contact.socialMedia.facebook;
        if (contact.socialMedia.instagram !== undefined) storeInfo.contact.socialMedia.instagram = contact.socialMedia.instagram;
        if (contact.socialMedia.twitter !== undefined) storeInfo.contact.socialMedia.twitter = contact.socialMedia.twitter;
      }
    }
    if (isOpen !== undefined) storeInfo.isOpen = isOpen;
    
    await storeInfo.save();
    res.json(storeInfo);
  } catch (error) {
    handleError(res, error, 'Error updating store information');
  }
};

// Update store timings
const updateStoreTimings = async (req, res) => {
  try {
    // Delegate to the store timing controller
    await updateTimings(req, res);
  } catch (error) {
    console.error('Error in updateStoreTimings:', error);
    handleError(res, error, 'Error updating store timings');
  }
};

// Add holiday banner
const addHolidayBanner = async (req, res) => {
  try {
    const { title, message, imageUrl, startDate, endDate, specialHours } = req.body;
    
    if (!title || !message || !startDate || !endDate) {
      return res.status(400).json({ 
        message: 'Title, message, start date, and end date are required' 
      });
    }

    const banner = {
      title,
      message,
      imageUrl,
      startDate: parseDate(startDate),
      endDate: parseDate(endDate),
      isActive: true,
      specialHours: specialHours || []
    };

    const storeInfo = await getOrCreateStoreInfo();
    storeInfo.holidayBanners.push(banner);
    
    await storeInfo.save();
    res.status(201).json(banner);
  } catch (error) {
    handleError(res, error, 'Error adding holiday banner');
  }
};

// Get active holiday banners
const getActiveHolidayBanners = async (req, res) => {
  try {
    const now = new Date();
    const storeInfo = await StoreInfo.findOne({
      'holidayBanners.isActive': true,
      'holidayBanners.startDate': { $lte: now },
      'holidayBanners.endDate': { $gte: now }
    });
    
    if (!storeInfo?.holidayBanners?.length) {
      return res.json([]);
    }
    
    const activeBanners = storeInfo.holidayBanners.filter(banner => 
      banner.isActive && 
      banner.startDate <= now && 
      banner.endDate >= now
    );
    
    res.json(activeBanners);
  } catch (error) {
    console.error('Error fetching holiday banners:', error);
    res.status(500).json({ 
      message: 'Error fetching active holiday banners',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' 
    });
  }
};

// Get store status (open/closed)
const getStoreStatus = async (req, res) => {
  try {
    // Delegate to the store timing controller
    await getStatus(req, res);
  } catch (error) {
    console.error('Error in getStoreStatus:', error);
    handleError(res, error, 'Error getting store status');
  }
};

// Delete store info by ID
const deleteStoreInfo = async (req, res) => {
  try {
    const deleted = await StoreInfo.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'StoreInfo not found' });
    }
    res.status(200).json({ message: 'StoreInfo deleted successfully' });
  } catch (error) {
    handleError(res, error, 'Error deleting store information');
  }
};

// Get store timings
const getStoreTimings = async (req, res) => {
  try {
    const result = await fetchStoreTimings();
    return res.json(result);
  } catch (error) {
    console.error('Error getting store timings:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to get store timings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


module.exports = {
  getStoreInfo,
  updateStoreInfo,
  updateStoreTimings,
  addHolidayBanner,
  getActiveHolidayBanners,
  getStoreStatus,
  deleteStoreInfo,
  getStoreTimings,
  isWithinTimeRange,
  getOrCreateStoreInfo // Export for testing
};
