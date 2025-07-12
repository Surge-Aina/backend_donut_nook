const express = require('express');
const router = express.Router();
const { getAllSpecials, createSpecial, updateSpecial, deleteSpecial } = require('../controllers/specialController');
const { requireRole } = require('../middleware/auth');

// GET all specials (public)
router.get('/', getAllSpecials);

// POST create new special (admin/manager only)
router.post('/', requireRole(['admin', 'manager']), createSpecial);

// PATCH update special by id (admin/manager only)
router.patch('/:id', requireRole(['admin', 'manager']), updateSpecial);

// DELETE special by id (admin/manager only)
router.delete('/:id', requireRole(['admin', 'manager']), deleteSpecial);

module.exports = router; 