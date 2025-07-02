const express = require('express');
const router = express.Router();

// Example GET endpoint for /menu
router.get('/', (req, res) => {
  res.json({ message: 'Menu route is working!' });
});

module.exports = router; 