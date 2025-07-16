const mongoose = require('mongoose');
const StoreInfo = require('../models/StoreInfo');
const {
  getStoreTimings: getTimings,
  updateStoreTimings: updateTimings,
  getStoreStatus: getStatus,
  formatTimingsResponse
} = require('./storeTimingController');

// Helper: get-or-create StoreInfo (optionally in a session)
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

// Standard error handler
const handleError = (res, error, message, status = 500) => {
  console.error(message, error);
  res.status(status).json({
    message,
    error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
  });
};

// Parse ISO date strings
const parseDate = (dateStr) => {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) throw new Error('Invalid date format');
  return date;
};

// Time-range checker
const isWithinTimeRange = (currentTime, openTime, closeTime) => {
  const toMins = t => t.split(':').map(Number).reduce((h,m) => h*60 + m, 0);
  const now = currentTime.getHours()*60 + currentTime.getMinutes();
  const open = toMins(openTime);
  const close = toMins(closeTime);
  if (close < open) return now >= open || now <= close; // overnight
  return now >= open && now <= close;
};

// Fetch or default timings
async function fetchStoreTimings() {
  const doc = await StoreInfo.findOne({}).populate('timings').lean();
  const arr = (doc?.timings && doc.timings.length) 
    ? formatTimingsResponse(doc.timings) 
    : formatTimingsResponse([
        { day:'monday', isClosed:true,  open:'00:00', close:'00:00', splitHours:[] },
        { day:'tuesday',isClosed:true,  open:'00:00', close:'00:00', splitHours:[] },
        { day:'wednesday',isClosed:true,open:'00:00', close:'00:00', splitHours:[] },
        { day:'thursday',isClosed:true, open:'00:00', close:'00:00', splitHours:[] },
        { day:'friday',isClosed:true,   open:'00:00', close:'00:00', splitHours:[] },
        { day:'saturday',isClosed:true, open:'00:00', close:'00:00', splitHours:[] },
        { day:'sunday', isClosed:true,  open:'00:00', close:'00:00', splitHours:[] },
      ]);
  return { success: true, data: arr };
}

// ─── CRUD & Banner Endpoints ────────────────────────────────────

// GET /store-info
const getStoreInfo = async (req, res) => {
  const session = await mongoose.startSession();
  let inTxn = false;
  try {
    await session.startTransaction();
    inTxn = true;

    const storeInfo = await getOrCreateStoreInfo(session);
    const obj = storeInfo.toObject();

    const { success, data, message } = await fetchStoreTimings();
    if (!success) throw new Error(message);

    obj.timings = data;
    await session.commitTransaction();
    res.json({ success: true, data: obj });
  } catch (err) {
    if (inTxn) await session.abortTransaction();
    handleError(res, err, 'Error fetching store information');
  } finally {
    await session.endSession();
  }
};

// PUT /store-info
const updateStoreInfo = async (req, res) => {
  try {
    const { storeName, address, contact, isOpen } = req.body;
    const doc = await getOrCreateStoreInfo();
    if (storeName !== undefined) doc.storeName = storeName;
    if (address) doc.address = { ...doc.address, ...address };
    if (contact) {
      if (contact.phone     !== undefined) doc.contact.phone     = contact.phone;
      if (contact.email     !== undefined) doc.contact.email     = contact.email;
      if (contact.socialMedia) {
        if (contact.socialMedia.facebook  !== undefined) doc.contact.socialMedia.facebook  = contact.socialMedia.facebook;
        if (contact.socialMedia.instagram !== undefined) doc.contact.socialMedia.instagram = contact.socialMedia.instagram;
        if (contact.socialMedia.twitter   !== undefined) doc.contact.socialMedia.twitter   = contact.socialMedia.twitter;
      }
    }
    if (isOpen !== undefined) doc.isOpen = isOpen;
    await doc.save();
    res.json(doc);
  } catch (err) {
    handleError(res, err, 'Error updating store information');
  }
};

// PUT /store-info/timings
const updateStoreTimings = async (req, res) => {
  try {
    await updateTimings(req, res);
  } catch (err) {
    handleError(res, err, 'Error updating store timings');
  }
};

// POST /store-info/holiday-banners
const addHolidayBanner = async (req, res) => {
  try {
    const { title, message, imageUrl, startDate, endDate, specialHours } = req.body;
    if (!title || !message || !startDate || !endDate) {
      return res.status(400).json({ message: 'Title, message, startDate & endDate are required' });
    }
    const banner = {
      title,
      message,
      imageUrl,
      startDate: parseDate(startDate),
      endDate:   parseDate(endDate),
      isActive:  true,
      specialHours: specialHours || []
    };
    const doc = await getOrCreateStoreInfo();
    doc.holidayBanners.push(banner);
    await doc.save();
    res.status(201).json(banner);
  } catch (err) {
    handleError(res, err, 'Error adding holiday banner');
  }
};

// GET /store-info/holiday-banners/active
const getActiveHolidayBanners = async (req, res) => {
  try {
    const now = new Date();
    const doc = await StoreInfo.findOne({
      'holidayBanners.isActive': true,
      'holidayBanners.startDate': { $lte: now },
      'holidayBanners.endDate':   { $gte: now }
    });
    if (!doc?.holidayBanners?.length) return res.json([]);
    const active = doc.holidayBanners.filter(b =>
      b.isActive && b.startDate <= now && b.endDate >= now
    );
    res.json(active);
  } catch (err) {
    handleError(res, err, 'Error fetching active holiday banners');
  }
};

// POST /store-info/holiday-banners/seed
async function seedNationalHolidays(req, res) {
  try {
    const session = await mongoose.startSession();
    await session.startTransaction();
    const doc = await getOrCreateStoreInfo(session);

    const holidays2025 = [
      { title: "New Year's Day",            date: "2025-01-01" },
      { title: "Martin Luther King Jr. Day",date: "2025-01-20" },
      { title: "Presidents' Day",           date: "2025-02-17" },
      { title: "Memorial Day",              date: "2025-05-26" },
      { title: "Independence Day",          date: "2025-07-04" },
      { title: "Labor Day",                 date: "2025-09-01" },
      { title: "Columbus Day",              date: "2025-10-13" },
      { title: "Veterans Day",              date: "2025-11-11" },
      { title: "Thanksgiving Day",          date: "2025-11-27" },
      { title: "Christmas Day",             date: "2025-12-25" }
    ];

    const now = new Date();
    const seeded = [];
    for (const h of holidays2025) {
      if (!doc.holidayBanners.some(b => b.title === h.title)) {
        doc.holidayBanners.push({
          title: h.title,
          message: `Closed on ${h.title}`,
          imageUrl: "",
          proposed: true,
          approved: null,
          isActive: false,
          proposedOn:        now.toISOString(),
          decisionDeadline:  new Date(new Date(h.date).getTime() - 8*24*60*60*1000).toISOString(),
          startDate:         new Date(new Date(h.date).getTime() - 7*24*60*60*1000).toISOString(),
          endDate:           h.date,
          specialHours: []
        });
        seeded.push(h.title);
      }
    }

    await doc.save({ session });
    await session.commitTransaction();
    res.status(201).json({ seeded });
  } catch (err) {
    handleError(res, err, 'Error seeding national holidays');
  }
}

// GET /store-info/status
const getStoreStatus = async (req, res) => {
  try {
    await getStatus(req, res);
  } catch (err) {
    handleError(res, err, 'Error getting store status');
  }
};

// DELETE /store-info/:id
const deleteStoreInfo = async (req, res) => {
  try {
    const deleted = await StoreInfo.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'StoreInfo not found' });
    res.json({ message: 'StoreInfo deleted successfully' });
  } catch (err) {
    handleError(res, err, 'Error deleting store information');
  }
};

// GET /store-info/timings
const getStoreTimings = async (req, res) => {
  try {
    const result = await fetchStoreTimings();
    res.json(result);
  } catch (err) {
    handleError(res, err, 'Error getting store timings');
  }
};

module.exports = {
  getStoreInfo,
  updateStoreInfo,
  updateStoreTimings,
  addHolidayBanner,
  getActiveHolidayBanners,
  seedNationalHolidays,      // ← our seeder
  getStoreStatus,
  deleteStoreInfo,
  getStoreTimings,
  isWithinTimeRange,
  getOrCreateStoreInfo
};
