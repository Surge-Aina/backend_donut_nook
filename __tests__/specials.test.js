const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index'); // Import the Express app
const Special = require('../models/Special');

describe('Specials API', () => {
  let testSpecialId;
  let testSpecial;

  // Test data
  const testSpecialData = {
    specialId: 1001,
    title: 'Test Special',
    message: 'This is a test special offer',
    itemIds: [1, 2, 3],
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    createdBy: new mongoose.Types.ObjectId() // Create a valid ObjectId
  };

  // Setup: Clear database before each test
  beforeEach(async () => {
    await Special.deleteMany({});
  });

  // Cleanup: Close database connection after all tests
  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('GET /specials', () => {
    it('should return 200 and an empty array when no specials exist', async () => {
      const response = await request(app)
        .get('/specials')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(0);
    });

    it('should return 200 and an array of specials when specials exist', async () => {
      // Create a test special
      const special = new Special(testSpecialData);
      await special.save();

      const response = await request(app)
        .get('/specials')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('_id');
      expect(response.body[0]).toHaveProperty('specialId', testSpecialData.specialId);
      expect(response.body[0]).toHaveProperty('title', testSpecialData.title);
      expect(response.body[0]).toHaveProperty('message', testSpecialData.message);
    });

    it('should handle database errors gracefully', async () => {
      // Mock a database error by temporarily breaking the connection
      const originalFind = Special.find;
      Special.find = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/specials')
        .expect(500);

      expect(response.body).toHaveProperty('message', 'Error retrieving specials');
      expect(response.body).toHaveProperty('error');

      // Restore the original method
      Special.find = originalFind;
    });
  });

  describe('POST /specials', () => {
    it('should create a new special and return 201', async () => {
      const response = await request(app)
        .post('/specials')
        .send(testSpecialData)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('specialId', testSpecialData.specialId);
      expect(response.body).toHaveProperty('title', testSpecialData.title);
      expect(response.body).toHaveProperty('message', testSpecialData.message);
      expect(response.body).toHaveProperty('itemIds');
      expect(response.body).toHaveProperty('startDate');
      expect(response.body).toHaveProperty('endDate');
      expect(response.body).toHaveProperty('createdBy');

      // Verify the special was actually saved to the database
      const savedSpecial = await Special.findById(response.body._id);
      expect(savedSpecial).toBeTruthy();
      expect(savedSpecial.specialId).toBe(testSpecialData.specialId);
    });

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        // Missing required fields
        title: 'Test Special'
        // Missing specialId, message, itemIds, startDate, endDate, createdBy
      };

      const response = await request(app)
        .post('/specials')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Validation error');
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for duplicate specialId', async () => {
      // Create first special
      const special1 = new Special(testSpecialData);
      await special1.save();

      // Try to create second special with same specialId
      const duplicateData = {
        ...testSpecialData,
        title: 'Different Title',
        _id: new mongoose.Types.ObjectId() // Different _id but same specialId
      };

      const response = await request(app)
        .post('/specials')
        .send(duplicateData)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Validation error');
    });
  });

  describe('PATCH /specials/:id', () => {
    beforeEach(async () => {
      // Create a test special for update tests
      const special = new Special(testSpecialData);
      const savedSpecial = await special.save();
      testSpecialId = savedSpecial._id;
      testSpecial = savedSpecial;
    });

    it('should update a special and return 200', async () => {
      const updateData = {
        title: 'Updated Special Title',
        message: 'Updated message'
      };

      const response = await request(app)
        .patch(`/specials/${testSpecialId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('_id', testSpecialId.toString());
      expect(response.body).toHaveProperty('title', updateData.title);
      expect(response.body).toHaveProperty('message', updateData.message);
      expect(response.body).toHaveProperty('specialId', testSpecialData.specialId); // Unchanged

      // Verify the update was actually saved
      const updatedSpecial = await Special.findById(testSpecialId);
      expect(updatedSpecial.title).toBe(updateData.title);
      expect(updatedSpecial.message).toBe(updateData.message);
    });

    it('should return 404 for non-existent special', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const updateData = { title: 'Updated Title' };

      const response = await request(app)
        .patch(`/specials/${nonExistentId}`)
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Special not found');
    });

    it('should return 400 for invalid update data', async () => {
      const invalidData = {
        specialId: 'not-a-number' // Should be a number
      };

      const response = await request(app)
        .patch(`/specials/${testSpecialId}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Validation error');
    });
  });

  describe('DELETE /specials/:id', () => {
    beforeEach(async () => {
      // Create a test special for delete tests
      const special = new Special(testSpecialData);
      const savedSpecial = await special.save();
      testSpecialId = savedSpecial._id;
    });

    it('should delete a special and return 200', async () => {
      const response = await request(app)
        .delete(`/specials/${testSpecialId}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Special deleted successfully');

      // Verify the special was actually deleted
      const deletedSpecial = await Special.findById(testSpecialId);
      expect(deletedSpecial).toBeNull();
    });

    it('should return 404 for non-existent special', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/specials/${nonExistentId}`)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Special not found');
    });

    it('should return 500 for invalid ObjectId format', async () => {
      const invalidId = 'invalid-id-format';

      const response = await request(app)
        .delete(`/specials/${invalidId}`)
        .expect(500);

      expect(response.body).toHaveProperty('message', 'Error deleting special');
    });
  });
}); 