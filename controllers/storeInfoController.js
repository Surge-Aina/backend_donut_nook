const mongoose = require('mongoose');
const StoreInfo = require('../models/StoreInfo');
const StoreTiming = require('../models/StoreTiming');

// Helper function to get or create store info
const getOrCreateStoreInfo = async () => {
  let storeInfo = await StoreInfo.findOne({});
  if (!storeInfo) {
    storeInfo = new StoreInfo({
      storeName: 'The Donut Nook',
      address: {},
      contact: {},
      isOpen: true,
      holidayBanners: []
    });
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

// Get store information
const getStoreInfo = async (req, res) => {
  try {
    // Try to get existing store info
    let storeInfo = await StoreInfo.findOne({}).lean();
    
    // If no store info exists, create a default one
    if (!storeInfo) {
      storeInfo = new StoreInfo({
        storeName: 'The Donut Nook',
        address: {},
        contact: {},
        isOpen: true,
        holidayBanners: []
      });
      await storeInfo.save();
      storeInfo = storeInfo.toObject();
    }
    
    // Get all store timings
    const allTimings = await StoreTiming.find({}).lean();
    
    // Transform timings to object keyed by day
    storeInfo.timings = allTimings.reduce((acc, timing) => {
      acc[timing.day] = timing;
      return acc;
    }, {});
    
    res.json(storeInfo);
  } catch (error) {
    console.error('Error in getStoreInfo:', error);
    handleError(res, error, 'Error fetching store information');
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
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { timings } = req.body;
    
    if (!Array.isArray(timings)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Timings must be an array' });
    }
    
    // Delete all existing timings
    await StoreTiming.deleteMany({}).session(session);
    
    // Insert new timings
    const newTimings = await StoreTiming.insertMany(timings, { session });
    
    // Update StoreInfo to reference the new timings
    await StoreInfo.findOneAndUpdate(
      {},
      { $set: { timings: newTimings.map(t => t._id) } },
      { upsert: true, session }
    );
    
    await session.commitTransaction();
    session.endSession();
    
    res.json(newTimings);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error updating store timings:', error);
    res.status(500).json({ 
      message: 'Error updating store timings',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' 
    });
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
    const storeInfo = await StoreInfo.findOne({}).populate('timings');
    if (!storeInfo) {
      return res.status(404).json({ message: 'Store information not found' });
    }
    
    const now = new Date();
    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const todaysTiming = storeInfo.timings?.find(t => t.day === dayName);
    
    // Check for active holiday banners
    if (storeInfo.holidayBanners?.length) {
      const activeBanner = storeInfo.holidayBanners.find(banner => {
        if (!banner.isActive || !banner.specialHours) return false;
        const bannerStart = new Date(banner.startDate);
        const bannerEnd = new Date(banner.endDate);
        return now >= bannerStart && now <= bannerEnd;
      });
      
      if (activeBanner?.specialHours?.length) {
        const specialHour = activeBanner.specialHours.find(hour => 
          new Date(hour.date).toDateString() === now.toDateString()
        );
        
        if (specialHour) {
          const isOpen = !specialHour.isClosed && isWithinTimeRange(now, specialHour.open, specialHour.close);
          return res.json({
            isOpen,
            message: isOpen ? 'Open with special hours' : `Closed for ${activeBanner.title}`,
            holidayTitle: activeBanner.title
          });
        }
      }
    }
    
    // Check regular hours
    if (!todaysTiming || todaysTiming.isClosed) {
      return res.json({ isOpen: false, message: 'Closed for today' });
    }
    
    // Check if within regular hours
    const isOpen = isWithinTimeRange(now, todaysTiming.open, todaysTiming.close);
    return res.json({ isOpen, message: isOpen ? 'Open' : 'Closed' });
    
  } catch (error) {
    console.error('Error getting store status:', error);
    res.status(500).json({ 
      message: 'Error getting store status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' 
    });
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

module.exports = {
  getStoreInfo,
  updateStoreInfo,
  updateStoreTimings,
  addHolidayBanner,
  getActiveHolidayBanners,
  getStoreStatus,
  isWithinTimeRange,
  deleteStoreInfo 
};

