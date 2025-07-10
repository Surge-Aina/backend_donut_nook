const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { requireRole } = require('../middleware/auth');

// Create a new customer (any authenticated user)
router.post('/', requireRole(['admin', 'manager', 'customer']), customerController.createCustomer);

// Get all customers (admin and manager only)
router.get('/', requireRole(['admin', 'manager']), customerController.getCustomers);

// Get a customer by ID (admin, manager, or the customer themselves)
router.get('/:id', requireRole(['admin', 'manager', 'customer']), customerController.getCustomerById);

// Add a purchase to a customer (admin, manager, or the customer themselves)
router.post('/:id/purchase', requireRole(['admin', 'manager', 'customer']), customerController.addPurchase);

// Delete a customer by ID (admin and manager only)
router.delete('/:id', requireRole(['admin', 'manager']), customerController.deleteCustomer);

// Update a customer by ID (admin and manager only)
router.patch('/:id', requireRole(['admin', 'manager']), customerController.updateCustomer);

module.exports = router; 