const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { authenticateToken, requireAdminOrManager } = require('../middleware/auth');

// Create a new customer
router.post('/', customerController.createCustomer);

// Get all customers (admin and manager only)
router.get('/', authenticateToken, requireAdminOrManager, customerController.getCustomers);

// Get the currently logged-in customer's profile
router.get('/me', authenticateToken, customerController.getMe);

// Get a customer by ID
router.get('/:id', customerController.getCustomerById);

// Add a purchase to a customer
router.post('/:id/purchase', customerController.addPurchase);

// Delete a customer by ID (admin and manager only)
router.delete('/:id', authenticateToken, requireAdminOrManager, customerController.deleteCustomer);

// Update a customer by ID (admin and manager only)
router.patch('/:id', authenticateToken, requireAdminOrManager, customerController.updateCustomer);

// PATCH /customers/:id/loyalty - Update loyalty points (admin/manager only)
router.patch('/:id/loyalty', authenticateToken, requireAdminOrManager, customerController.updateLoyaltyPoints);

module.exports = router; 
