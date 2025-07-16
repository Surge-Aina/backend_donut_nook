const express = require('express');
const router = express.Router();

const {
  getStoreInfo,
  updateStoreInfo,
  addHolidayBanner,
  getActiveHolidayBanners,
  seedNationalHolidays,
  getStoreStatus: getStatus,
  deleteStoreInfo
} = require('../controllers/storeInfoController');

const {
  getStoreTimings: getTimings,
  updateStoreTimings: updateTimings,
  getStoreStatus
} = require('../controllers/storeTimingController');

// Public
router.get(  '/',            getStoreInfo);
router.get(  '/timings',     getTimings);
router.get(  '/holiday-banners/active', getActiveHolidayBanners);
router.get(  '/status',      getStatus);

// Seed (public or protected as you prefer)
router.post( '/holiday-banners/seed', seedNationalHolidays);

// Protected (later add auth middleware)
router.put(  '/',                updateStoreInfo);
router.put(  '/timings',        updateTimings);
router.post( '/holiday-banners', addHolidayBanner);
router.delete('/:id',            deleteStoreInfo);

module.exports = router;
