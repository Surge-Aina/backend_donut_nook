const express = require('express');
const router = express.Router();
const aboutController = require('../controllers/aboutController');
// used to verify rba, commented out for testing
// const { verifyToken, requireAdmin } = require('../middleware/auth');


// testing with global admin access // do not use in deployment
const { authenticate, requireAdmin } = require('../middleware/auth');
/////////////////////////////////////

router.get('/', aboutController.getAbout);

// Only admin can update
// router.put('/', verifyToken, requireAdmin, aboutController.updateAbout);


/////////////////////////////////////////////////////////////////////////////
// for testing (authenticate allows admin methods to be called without signing in)
// do not use in testing
router.put('/', authenticate, requireAdmin, aboutController.updateAbout);
router.post('/', authenticate, requireAdmin, aboutController.createAbout);
/// requireAdmin('admin') might work but for now was breaking
/// used to verify whether user is admin or not for posting
/////////////////////////////////////

module.exports = router;
