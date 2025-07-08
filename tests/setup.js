// Test setup file for Jest
require('dotenv').config({ path: '.env.test' });

// Global test timeout
jest.setTimeout(10000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global test utilities
global.testUtils = {
  // Helper to create test data
  createTestData: (model, data) => {
    return new model(data);
  },
  
  // Helper to clean up test data
  cleanupTestData: async (model, filter = {}) => {
    await model.deleteMany(filter);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  const mongoose = require('mongoose');
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
  }
  process.exit(0);
}); 