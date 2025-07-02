const StoreInfo = require('../models/StoreInfo');

// @desc    Get store information
// @route   GET /api/store-info
// @access  Public
exports.getStoreInfo = async (req, res) => {
  try {
    let storeInfo = await StoreInfo.findOne({});
    
    // If no store info exists, create a default one
    if (!storeInfo) {
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
          email: 'info@thedonutnook.com',
          socialMedia: {
            facebook: 'thedonutnook',
            instagram: 'thedonutnook',
            twitter: 'thedonutnook'
          }
        }
      });
      await storeInfo.save();
    }
    
    res.json(storeInfo);
  } catch (error) {
    console.error('Error fetching store info:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update store information
// @route   PUT /api/store-info
// @access  Private/Admin
exports.updateStoreInfo = async (req, res) => {
  try {
    const { storeName, address, contact, isOpen } = req.body;
    
    let storeInfo = await StoreInfo.findOne({});
    
    if (!storeInfo) {
      // Create new store info if it doesn't exist
      storeInfo = new StoreInfo({
        storeName,
        address,
        contact,
        isOpen: isOpen !== undefined ? isOpen : true
      });
    } else {
      // Update existing store info
      if (storeName) storeInfo.storeName = storeName;
      if (address) storeInfo.address = { ...storeInfo.address, ...address };
      if (contact) storeInfo.contact = { ...storeInfo.contact, ...contact };
      if (isOpen !== undefined) storeInfo.isOpen = isOpen;
      storeInfo.lastUpdated = Date.now();
    }
    
    await storeInfo.save();
    res.json(storeInfo);
  } catch (error) {
    console.error('Error updating store info:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update store timings
// @route   PUT /api/store-info/timings
// @access  Private/Admin
exports.updateStoreTimings = async (req, res) => {
  try {
    const { timings } = req.body;
    
    if (!Array.isArray(timings)) {
      return res.status(400).json({ message: 'Timings must be an array' });
    }
    
    let storeInfo = await StoreInfo.findOne({});
    
    if (!storeInfo) {
      storeInfo = new StoreInfo({ timings });
    } else {
      storeInfo.timings = timings;
      storeInfo.lastUpdated = Date.now();
    }
    
    await storeInfo.save();
    res.json(storeInfo.timings);
  } catch (error) {
    console.error('Error updating store timings:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add or update holiday banner
// @route   POST /api/store-info/holiday-banners
// @access  Private/Admin
exports.manageHolidayBanner = async (req, res) => {
  try {
    const { 
      title, 
      message, 
      imageUrl, 
      isActive = true, 
      startDate, 
      endDate, 
      specialHours = [] 
    } = req.body;
    
    if (!title || !message || !startDate || !endDate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    let storeInfo = await StoreInfo.findOne({});
    
    if (!storeInfo) {
      storeInfo = new StoreInfo({ holidayBanners: [] });
    }
    
    const bannerData = {
      title,
      message,
      imageUrl,
      isActive,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      specialHours: specialHours.map(hour => ({
        date: new Date(hour.date),
        open: hour.open,
        close: hour.close,
        isClosed: hour.isClosed || false
      }))
    };
    
    // Check if we're updating an existing banner
    const bannerIndex = storeInfo.holidayBanners.findIndex(
      b => b.title.toLowerCase() === title.toLowerCase()
    );
    
    if (bannerIndex >= 0) {
      storeInfo.holidayBanners[bannerIndex] = bannerData;
    } else {
      storeInfo.holidayBanners.push(bannerData);
    }
    
    storeInfo.lastUpdated = Date.now();
    await storeInfo.save();
    
    res.json(storeInfo.holidayBanners);
  } catch (error) {
    console.error('Error managing holiday banner:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get active holiday banners
// @route   GET /api/store-info/holiday-banners/active
// @access  Public
exports.getActiveHolidayBanners = async (req, res) => {
  try {
    const now = new Date();
    const storeInfo = await StoreInfo.findOne({
      'holidayBanners.isActive': true,
      'holidayBanners.startDate': { $lte: now },
      'holidayBanners.endDate': { $gte: now }
    });
    
    if (!storeInfo || !storeInfo.holidayBanners || storeInfo.holidayBanners.length === 0) {
      return res.json([]);
    }
    
    const activeBanners = storeInfo.holidayBanners.filter(banner => 
      banner.isActive && 
      banner.startDate <= now && 
      banner.endDate >= now
    );
    
    res.json(activeBanners);
  } catch (error) {
    console.error('Error fetching active holiday banners:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get store status (open/closed)
// @route   GET /api/store-info/status
// @access  Public
exports.getStoreStatus = async (req, res) => {
  try {
    const now = new Date();
    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const currentTime = now.getHours() * 100 + now.getMinutes(); // Convert to HHMM format
    
    const storeInfo = await StoreInfo.findOne({});
    
    if (!storeInfo) {
      return res.json({ isOpen: false, message: 'Store information not available' });
    }
    
    // Check if store is manually closed
    if (!storeInfo.isOpen) {
      return res.json({ isOpen: false, message: 'Store is currently closed' });
    }
    
    // Check for special holiday hours
    if (storeInfo.holidayBanners && storeInfo.holidayBanners.length > 0) {
      const activeBanner = storeInfo.holidayBanners.find(banner => 
        banner.isActive && 
        banner.specialHours && 
        banner.specialHours.some(hour => {
          const hourDate = new Date(hour.date);
          return (
            hourDate.getDate() === now.getDate() &&
            hourDate.getMonth() === now.getMonth() &&
            hourDate.getFullYear() === now.getFullYear()
          );
        })
      );
      
      if (activeBanner) {
        const specialHour = activeBanner.specialHours.find(hour => {
          const hourDate = new Date(hour.date);
          return (
            hourDate.getDate() === now.getDate() &&
            hourDate.getMonth() === now.getMonth() &&
            hourDate.getFullYear() === now.getFullYear()
          );
        });
        
        if (specialHour) {
          if (specialHour.isClosed) {
            return res.json({ 
              isOpen: false, 
              message: 'Closed for ' + activeBanner.title,
              specialHours: specialHour
            });
          }
          
          const [openHour, openMinute] = specialHour.open.split(':').map(Number);
          const [closeHour, closeMinute] = specialHour.close.split(':').map(Number);
          const openTime = openHour * 100 + openMinute;
          const closeTime = closeHour * 100 + closeMinute;
          
          const isOpen = currentTime >= openTime && currentTime <= closeTime;
          
          return res.json({
            isOpen,
            message: isOpen ? 'Open with special hours' : 'Closed for today',
            specialHours: specialHour,
            holidayTitle: activeBanner.title
          });
        }
      }
    }
    
    // Check regular hours
    const todayTiming = storeInfo.timings.find(t => t.day.toLowerCase() === dayName);
    
    if (!todayTiming || todayTiming.isClosed) {
      return res.json({ isOpen: false, message: 'Closed for today' });
    }
    
    const [openHour, openMinute] = todayTiming.open.split(':').map(Number);
    const [closeHour, closeMinute] = todayTiming.close.split(':').map(Number);
    const openTime = openHour * 100 + openMinute;
    const closeTime = closeHour * 100 + closeMinute;
    
    // Check split hours if any
    if (todayTiming.splitHours && todayTiming.splitHours.length > 0) {
      const isInAnySplit = todayTiming.splitHours.some(split => {
        const [splitOpenHour, splitOpenMinute] = split.open.split(':').map(Number);
        const [splitCloseHour, splitCloseMinute] = split.close.split(':').map(Number);
        const splitOpenTime = splitOpenHour * 100 + splitOpenMinute;
        const splitCloseTime = splitCloseHour * 100 + splitCloseMinute;
        return currentTime >= splitOpenTime && currentTime <= splitCloseTime;
      });
      
      if (isInAnySplit) {
        return res.json({ 
          isOpen: true, 
          message: 'Open',
          nextClose: todayTiming.close
        });
      }
    }
    
    // Check regular hours
    const isOpen = currentTime >= openTime && currentTime <= closeTime;
    
    res.json({
      isOpen,
      message: isOpen ? 'Open' : 'Closed',
      nextOpen: isOpen ? null : (() => {
        // Find next open time (simplified)
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowDay = tomorrow.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        const tomorrowTiming = storeInfo.timings.find(t => t.day.toLowerCase() === tomorrowDay);
        return tomorrowTiming && !tomorrowTiming.isClosed ? `Opens tomorrow at ${tomorrowTiming.open}` : null;
      })()
    });
    
  } catch (error) {
    console.error('Error getting store status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
