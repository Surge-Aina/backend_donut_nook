const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index'); // Already connects to DB

describe('Holiday API', () => {
  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('should return a list of holidays', async () => {
    const res = await request(app).get('/api/holidays');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});