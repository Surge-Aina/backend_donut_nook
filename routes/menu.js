const express = require('express');
const router = express.Router();
const { getAllItems, 
        addMenuItem, 
        editItemByItemId, 
        deleteItemByItemId } = require('../controllers/menuController');

router.get('/', getAllItems);
router.post('/', addMenuItem);
router.patch('/:itemId', editItemByItemId);
router.delete('/:itemId', deleteItemByItemId);

module.exports = router;