const express = require('express');
const router = express.Router();
const About = require('../models/About');

// Get about info
router.get('/', async (req, res) => {
    try {
        const about = await About.find();
        res.json(about);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create or update about info
router.post('/', async (req, res) => {
    try {
        const about = await About.findOneAndUpdate(
            {}, // only one about doc expected
            { ...req.body },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        res.status(200).json(about);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
