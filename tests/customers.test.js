require('dotenv').config();
const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../index');
const Customer = require('../models/Customer');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

describe('Customer API Tests', () => {
  let adminToken, managerToken, customerToken;
  let testCustomerId;

  beforeAll(async () => {
    // Wait for database connection
    if (mongoose.connection.readyState !== 1) {
      await new Promise(resolve => {
        mongoose.connection.once('connected', resolve);
      });
    }

    // Create test users and generate tokens
    const adminUser = await User.findOne({ email: 'admin@test.com' }) || 
      await User.create({
        name: 'Admin User',
        email: 'admin@test.com',
        passwordHash: 'hashedpassword',
        role: 'admin'
      });

    const managerUser = await User.findOne({ email: 'manager@test.com' }) || 
      await User.create({
        name: 'Manager User',
        email: 'manager@test.com',
        passwordHash: 'hashedpassword',
        role: 'manager'
      });

    const customerUser = await User.findOne({ email: 'customer@test.com' }) || 
      await User.create({
        name: 'Customer User',
        email: 'customer@test.com',
        passwordHash: 'hashedpassword',
        role: 'customer'
      });

    adminToken = jwt.sign({ id: adminUser._id, role: adminUser.role }, process.env.JWT_SECRET || 'test-secret');
    managerToken = jwt.sign({ id: managerUser._id, role: managerUser.role }, process.env.JWT_SECRET || 'test-secret');
    customerToken = jwt.sign({ id: customerUser._id, role: customerUser.role }, process.env.JWT_SECRET || 'test-secret');
  });

  beforeEach(async () => {
    // Clear customers collection
    await Customer.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('GET /customers', () => {
    it('should return 200 and an array for GET /customers (admin)', async () => {
      const res = await request(app)
        .get('/customers')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 200 and an array for GET /customers (manager)', async () => {
      const res = await request(app)
        .get('/customers')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should deny customer role from accessing customers list', async () => {
      const res = await request(app)
        .get('/customers')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.statusCode).toBe(403);
      expect(res.body.error).toContain('Access denied');
    });

    it('should deny access without authentication token', async () => {
      const res = await request(app).get('/customers');
      expect(res.statusCode).toBe(401);
      expect(res.body.error).toContain('Access token required');
    });
  });

  describe('POST /customers', () => {
    it('should return 201 and the created customer for POST /customers', async () => {
      const newCustomer = {
        name: 'Test User',
        email: 'testuser@example.com',
        phone: '1234567890',
        dob: '1990-01-01'
      };
      const res = await request(app).post('/customers').send(newCustomer);
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.name).toBe('Test User');
      testCustomerId = res.body._id; // Save for other tests
    });
  });

  describe('PATCH /customers/:id', () => {
    beforeEach(async () => {
      // Create a test customer for PATCH tests
      const testCustomer = await Customer.create({
        name: 'Patch Test User',
        email: 'patchtest@example.com',
        phone: '1234567890',
        dob: '1990-01-01',
        loyaltyPoints: 10
      });
      testCustomerId = testCustomer._id;
    });

    it('should allow admin to update customer loyalty points', async () => {
      const res = await request(app)
        .patch(`/customers/${testCustomerId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ loyaltyPoints: 25 });

      expect(res.statusCode).toBe(200);
      expect(res.body.loyaltyPoints).toBe(25);
    });

    it('should allow manager to update customer loyalty points', async () => {
      const res = await request(app)
        .patch(`/customers/${testCustomerId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ loyaltyPoints: 30 });

      expect(res.statusCode).toBe(200);
      expect(res.body.loyaltyPoints).toBe(30);
    });

    it('should deny customer role from updating loyalty points', async () => {
      const res = await request(app)
        .patch(`/customers/${testCustomerId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ loyaltyPoints: 50 });

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toContain('Access denied');
    });

    it('should deny access without authentication token', async () => {
      const res = await request(app)
        .patch(`/customers/${testCustomerId}`)
        .send({ loyaltyPoints: 50 });

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toContain('Access token required');
    });

    it('should return 404 for non-existent customer', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .patch(`/customers/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ loyaltyPoints: 25 });

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Customer not found');
    });

    it('should allow partial updates (only loyalty points)', async () => {
      const res = await request(app)
        .patch(`/customers/${testCustomerId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ loyaltyPoints: 100 });

      expect(res.statusCode).toBe(200);
      expect(res.body.loyaltyPoints).toBe(100);
      expect(res.body.name).toBe('Patch Test User'); // Other fields unchanged
    });
  });

  describe('DELETE /customers/:id', () => {
    beforeEach(async () => {
      // Create a test customer for DELETE tests
      const testCustomer = await Customer.create({
        name: 'Delete Test User',
        email: 'deletetest@example.com',
        phone: '1234567890',
        dob: '1990-01-01'
      });
      testCustomerId = testCustomer._id;
    });

    it('should delete customer successfully (admin)', async () => {
      const res = await request(app)
        .delete(`/customers/${testCustomerId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Customer deleted successfully');
    });

    it('should delete customer successfully (manager)', async () => {
      const res = await request(app)
        .delete(`/customers/${testCustomerId}`)
        .set('Authorization', `Bearer ${managerToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Customer deleted successfully');
    });

    it('should deny customer role from deleting customers', async () => {
      const res = await request(app)
        .delete(`/customers/${testCustomerId}`)
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.statusCode).toBe(403);
      expect(res.body.error).toContain('Access denied');
    });

    it('should deny access without authentication token', async () => {
      const res = await request(app).delete(`/customers/${testCustomerId}`);
      expect(res.statusCode).toBe(401);
      expect(res.body.error).toContain('Access token required');
    });

    it('should return 404 for non-existent customer', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/customers/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Customer not found');
    });
  });
}); 