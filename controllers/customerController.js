const Customer = require('../models/Customer');

// Create a new customer
exports.createCustomer = async (req, res) => {
  try {
    const customer = new Customer(req.body);
    await customer.save();
    res.status(201).json(customer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all customers
exports.getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find();
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a customer by ID
exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add a purchase to a customer
exports.addPurchase = async (req, res) => {
  try {
    const { menuItemId, amount } = req.body;
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const purchase = {
      menuItemId,
      amount,
      timestamp: new Date()
    };
    customer.purchaseHistory.push(purchase);
    customer.totalSpent += amount;
    // Example: 1 loyalty point per $10 spent
    customer.loyaltyPoints = Math.floor(customer.totalSpent / 10);
    await customer.save();
    res.json(customer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete a customer by ID
exports.deleteCustomer = async (req, res) => {
  try {
    const deletedCustomer = await Customer.findByIdAndDelete(req.params.id);
    if (!deletedCustomer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.status(200).json({ message: 'Customer deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a customer by ID (admin and manager only)
exports.updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Loyalty points logic
    if (req.body.hasOwnProperty('loyaltyPoints')) {
      const newPoints = req.body.loyaltyPoints;
      const currentPoints = customer.loyaltyPoints;
      const userRole = req.user.role;

      if (userRole === 'manager') {
        // Manager can only add (increase) points
        if (newPoints < currentPoints) {
          return res.status(403).json({ error: 'Managers can only add loyalty points, not decrease or delete them.' });
        }
        customer.loyaltyPoints = newPoints;
      } else if (userRole === 'admin') {
        // Admin can only delete (set to zero) points
        if (newPoints !== 0) {
          return res.status(403).json({ error: 'Admins can only delete (set to zero) loyalty points.' });
        }
        customer.loyaltyPoints = 0;
      } else {
        return res.status(403).json({ error: 'Access denied. Only manager or admin can update loyalty points.' });
      }
      // Remove loyaltyPoints from req.body so it doesn't get overwritten below
      delete req.body.loyaltyPoints;
    }

    // Update other fields (allowed for both roles)
    Object.keys(req.body).forEach(field => {
      customer[field] = req.body[field];
    });
    await customer.save();
    res.json(customer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
