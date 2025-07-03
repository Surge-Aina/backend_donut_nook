# Test Suite Documentation

This directory contains the automated test suite for the Donut Nook backend API.

## 📁 Directory Structure

```
tests/
├── api/           # API integration tests
├── unit/          # Unit tests for models and utilities
├── integration/   # Integration tests for controllers
├── utils/         # Test helper utilities
├── setup.js       # Jest setup configuration
└── README.md      # This file
```

## 🧪 Test Types

### API Tests (`/api`)
- Test HTTP endpoints using Supertest
- Verify request/response handling
- Test authentication and authorization
- Validate API contracts

### Unit Tests (`/unit`)
- Test individual models and utilities
- Mock external dependencies
- Fast execution
- High code coverage

### Integration Tests (`/integration`)
- Test controller logic
- Test database interactions
- Test middleware functionality

## 🚀 Running Tests

### Run all tests
```bash
npm test
```

### Run specific test types
```bash
# API tests only
npm test -- tests/api

# Unit tests only
npm test -- tests/unit

# Integration tests only
npm test -- tests/integration
```

### Run with coverage
```bash
npm test -- --coverage
```

### Run in watch mode
```bash
npm test -- --watch
```

## 🛠️ Test Utilities

### Database Helpers
- `connectTestDB()` - Connect to test database
- `disconnectTestDB()` - Disconnect from test database
- `clearTestDB()` - Clear all test data

### Data Factories
- `createTestUser(overrides)` - Create test user data
- `createTestMenuItem(overrides)` - Create test menu item data
- `createTestSpecial(overrides)` - Create test special data

### Authentication Helpers
- `generateTestToken(user)` - Generate JWT token for testing

## 📝 Writing Tests

### API Test Example
```javascript
describe('GET /api/menu', () => {
  it('should return all menu items', async () => {
    const response = await request(app)
      .get('/api/menu')
      .expect(200);

    expect(response.body).toBeInstanceOf(Array);
  });
});
```

### Unit Test Example
```javascript
describe('Menu Model', () => {
  it('should validate required fields', async () => {
    const menuItem = new Menu({});
    
    try {
      await menuItem.save();
      fail('Should have thrown validation error');
    } catch (error) {
      expect(error.errors.name).toBeDefined();
    }
  });
});
```

## 🔧 Configuration

### Jest Configuration (`jest.config.js`)
- Test environment: Node.js
- Coverage reporting
- Test timeout: 10 seconds
- Setup file: `tests/setup.js`

### Environment Variables
Create a `.env.test` file for test-specific configuration:
```
MONGODB_TEST_URI=mongodb://localhost:27017/donut_nook_test
JWT_SECRET=test-secret-key
```

## 📊 Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean up test data
3. **Descriptive names**: Use clear test descriptions
4. **Arrange-Act-Assert**: Structure tests consistently
5. **Mock external services**: Don't depend on external APIs
6. **Test edge cases**: Include error scenarios

## 🐛 Debugging Tests

### Enable verbose logging
```bash
npm test -- --verbose
```

### Run single test file
```bash
npm test -- tests/api/auth.test.js
```

### Debug with Node.js inspector
```bash
node --inspect-brk node_modules/.bin/jest --runInBand tests/api/auth.test.js
``` 