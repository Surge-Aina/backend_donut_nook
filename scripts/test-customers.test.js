require('dotenv').config();
const connectDB = require('../utils/db');
const mongoose = require('mongoose');
const request = require('supertest');
const express = require('express');
const customerRoutes = require('../routes/customers');

const app = express();
app.use(express.json());
app.use('/customers', customerRoutes);

beforeAll(async () => {
  await connectDB();
});

// Test GET /customers
it('should return 200 and an array for GET /customers', async () => {
  const res = await request(app).get('/customers');
  expect(res.statusCode).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
});

// Test POST /customers
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
});

afterAll(async () => {
  await mongoose.connection.close();
}); 