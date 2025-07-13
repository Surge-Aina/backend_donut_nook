const express = require('express');
const router = express.Router();
const aboutController = require('../controllers/aboutController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// GET all sections
router.get('/', aboutController.getAllAbout);

// CREATE a section (Admin only)
router.post('/', verifyToken, requireAdmin, aboutController.createAbout);

// UPDATE a section by ID (Admin only)
router.put('/:id', verifyToken, requireAdmin, aboutController.updateAbout);

// DELETE a section by ID (Admin only)
router.delete('/:id', verifyToken, requireAdmin, aboutController.deleteAbout);

module.exports = router;
