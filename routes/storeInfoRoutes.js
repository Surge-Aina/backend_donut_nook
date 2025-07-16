const express = require('express');
const router = express.Router();
const { deleteStoreInfo } = require('../controllers/storeInfoController');
const {
  getStoreInfo,
  updateStoreInfo,
  addHolidayBanner,
  getActiveHolidayBanners,
  getStoreStatus: getStatus
} = require('../controllers/storeInfoController');

// Import store timing controller
const {
  getStoreTimings: getTimings,
  updateStoreTimings: updateTimings,
  getStoreStatus
} = require('../controllers/storeTimingController');

// Public routes
router.get('/', getStoreInfo);
router.get('/timings', getTimings);
router.get('/holiday-banners/active', getActiveHolidayBanners);
router.get('/status', getStoreStatus);

// Protected routes (add authentication middleware later)
router.put('/', updateStoreInfo);
router.put('/timings', updateTimings);
router.post('/holiday-banners', addHolidayBanner);
router.delete('/:id', deleteStoreInfo);

module.exports = router;
