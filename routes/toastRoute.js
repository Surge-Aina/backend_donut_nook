const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

const toastLogSchema = new mongoose.Schema({
  type: String,
  message: String,
  createdAt: { type: Date, default: Date.now, expires: '48h' } // auto delete after 48 hours
});

const ToastLog = mongoose.model('ToastLog', toastLogSchema);

router.post('/', async (req, res) => {
  try {
    const { type, message } = req.body;
    await ToastLog.create({ type, message });
    res.status(201).json({ success: true });
  } catch (err) {
    console.error('Error saving toast log:', err);
    res.status(500).json({ error: 'Failed to save toast log' });
  }
});

module.exports = router;