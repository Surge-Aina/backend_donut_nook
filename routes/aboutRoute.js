const express = require('express');
const router = express.Router();
const aboutController = require('../controllers/aboutController');
// used to verify rba, commented out for testing
const { verifyToken, requireAdmin } = require('../middleware/auth');




router.get('/', aboutController.getAbout);

// Only admin can update
router.put('/', verifyToken, requireAdmin, aboutController.updateAbout);
router.post('/', verifyToken, requireAdmin, aboutController.createAbout);


module.exports = router;
