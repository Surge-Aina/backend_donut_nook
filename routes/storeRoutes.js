const express = require('express');
const router = express.Router();
const StoreInfo = require('../models/StoreInfo');

// Get all store info
router.get('/', async (req, res) => {
    try {
        const stores = await StoreInfo.find();
        res.json(stores);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create or update store info (upsert logic)
router.post('/', async (req, res) => {
    try {
        const store = await StoreInfo.findOneAndUpdate(
            {}, // only one store doc expected
            { ...req.body },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        res.status(200).json(store);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
