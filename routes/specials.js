const express = require('express');
const router = express.Router();
const { getAllSpecials, createSpecial, updateSpecial, deleteSpecial } = require('../controllers/specialController');

// GET all specials
router.get('/', getAllSpecials);

// POST create new special
router.post('/', createSpecial);

// PATCH update special by id
router.patch('/:id', updateSpecial);

// DELETE special by id
router.delete('/:id', deleteSpecial);

module.exports = router; 