const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

// Create a new customer
router.post('/', customerController.createCustomer);

// Get all customers
router.get('/', customerController.getCustomers);

// Get a customer by ID
router.get('/:id', customerController.getCustomerById);

// Add a purchase to a customer
router.post('/:id/purchase', customerController.addPurchase);

module.exports = router; 