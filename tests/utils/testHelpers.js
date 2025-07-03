const request = require('supertest');
const mongoose = require('mongoose');

/**
 * Test helper utilities for the Donut Nook API
 */

// Create a test server instance
const createTestServer = (app) => {
  return request(app);
};

// Database connection helper for tests
const connectTestDB = async () => {
  try {
    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      console.log('Already connected to database');
      return;
    }
    
    // Use the same connection as the main app
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/donut_nook');
    console.log('Connected to database');
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};

// Disconnect from database (only if needed)
const disconnectTestDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('Disconnected from database');
    }
  } catch (error) {
    console.error('Database disconnection failed:', error);
    throw error;
  }
};

// Clear all collections in test database
const clearTestDB = async () => {
  try {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  } catch (error) {
    console.error('Error clearing test database:', error);
    // Continue with tests even if clearing fails
  }
};

// Create test user data
const createTestUser = (overrides = {}) => {
  return {
    username: 'testuser',
    email: 'test@example.com',
    password: 'testpassword123',
    role: 'customer',
    ...overrides
  };
};

// Create test menu item data
const createTestMenuItem = (overrides = {}) => {
  return {
    name: 'Test Donut',
    description: 'A delicious test donut',
    price: 3.99,
    category: 'glazed',
    isAvailable: true,
    ...overrides
  };
};

// Create test special data
const createTestSpecial = (overrides = {}) => {
  return {
    specialId: Math.floor(Math.random() * 1000) + 1,
    title: 'Test Special',
    message: 'A special test offer',
    itemIds: [101, 102, 103],
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    createdBy: new mongoose.Types.ObjectId(),
    ...overrides
  };
};

// Generate JWT token for testing
const generateTestToken = (user) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
};

module.exports = {
  createTestServer,
  connectTestDB,
  disconnectTestDB,
  clearTestDB,
  createTestUser,
  createTestMenuItem,
  createTestSpecial,
  generateTestToken
}; 