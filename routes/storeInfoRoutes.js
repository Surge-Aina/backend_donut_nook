const express = require('express');
const router = express.Router();
const {
  getStoreInfo,
  updateStoreInfo,
  updateStoreTimings,
  addHolidayBanner,
  getActiveHolidayBanners,
  getStoreStatus
} = require('../controllers/storeInfoController');

// Public routes
router.get('/', getStoreInfo);
router.get('/holiday-banners/active', getActiveHolidayBanners);
router.get('/status', getStoreStatus);

// Protected routes (add authentication middleware later)
router.put('/', updateStoreInfo);
router.put('/timings', updateStoreTimings);
router.post('/holiday-banners', addHolidayBanner);

module.exports = router;
