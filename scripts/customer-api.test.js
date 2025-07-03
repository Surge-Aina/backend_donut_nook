require('dotenv').config();
const request = require('supertest');
const express = require('express');
const connectDB = require('../utils/db');
const userRoutes = require('../routes/users');

const app = express();
app.use(express.json());
app.use('/users', userRoutes);

beforeAll(async () => {
  await connectDB();
});

describe('User Login API', () => {
  it('should login with manager-provided credentials', async () => {
    const res = await request(app)
      .post('/users/login')
      .send({ email: 'cust@test.com', password: 'Cust@123' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token'); // or adjust based on your login response
  });
}); 