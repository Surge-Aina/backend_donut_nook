const express = require('express');
const router = express.Router();
const Holiday = require('../models/Holiday');

// GET all holidays
router.get('/', async (req, res) => {
  try {
    const holidays = await Holiday.find({});
    res.json(holidays);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST (add new holiday manually if needed)
router.post('/', async (req, res) => {
  try {
    const holiday = new Holiday(req.body);
    await holiday.save();
    res.status(201).json(holiday);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;