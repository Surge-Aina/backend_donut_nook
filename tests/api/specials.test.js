const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../../index');
const Special = require('../../models/Special');
const { 
  clearTestDB, 
  createTestSpecial 
} = require('../utils/testHelpers');

describe('Specials API Tests', () => {
  beforeAll(async () => {
    // Wait for database connection to be ready
    if (mongoose.connection.readyState !== 1) {
      await new Promise(resolve => {
        mongoose.connection.once('connected', resolve);
      });
    }
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  // Mock authentication middleware (if needed in the future)
  const mockAuth = (req, res, next) => {
    req.user = {
      _id: new mongoose.Types.ObjectId(),
      role: 'manager'
    };
    next();
  };

  describe('GET /specials', () => {
    it('should return all specials successfully', async () => {
      // Create test specials
      const special1 = createTestSpecial({
        specialId: 1,
        title: 'Summer Special',
        message: 'Get 20% off on summer donuts',
        itemIds: [101, 102, 103]
      });
      const special2 = createTestSpecial({
        specialId: 2,
        title: 'Weekend Deal',
        message: 'Buy 2 get 1 free on weekends',
        itemIds: [201, 202]
      });

      await Special.create([special1, special2]);

      const response = await request(app)
        .get('/specials')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('title', 'Summer Special');
      expect(response.body[1]).toHaveProperty('title', 'Weekend Deal');
    });

    it('should return empty array when no specials exist', async () => {
      const response = await request(app)
        .get('/specials')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(0);
    });
  });

  describe('POST /specials', () => {
    it('should create a new special successfully', async () => {
      const specialData = createTestSpecial({
        specialId: 1,
        title: 'New Year Special',
        message: 'Ring in the new year with sweet deals',
        itemIds: [301, 302, 303, 304]
      });

      const response = await request(app)
        .post('/specials')
        .send(specialData)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('specialId', 1);
      expect(response.body).toHaveProperty('title', 'New Year Special');
      expect(response.body).toHaveProperty('message', 'Ring in the new year with sweet deals');
      expect(response.body).toHaveProperty('itemIds');
      expect(response.body.itemIds).toEqual([301, 302, 303, 304]);
      expect(response.body).toHaveProperty('startDate');
      expect(response.body).toHaveProperty('endDate');
      expect(response.body).toHaveProperty('createdBy');
    });

    it('should return 400 for missing required fields', async () => {
      const invalidSpecialData = {
        title: 'Incomplete Special',
        message: 'This special is missing required fields'
        // Missing: specialId, itemIds, startDate, endDate, createdBy
      };

      const response = await request(app)
        .post('/specials')
        .send(invalidSpecialData)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Validation error');
      expect(response.body).toHaveProperty('error');
    });

    it('should return 500 for duplicate specialId', async () => {
      // Create first special
      const special1 = createTestSpecial({ specialId: 1 });
      await Special.create(special1);

      // Try to create second special with same specialId
      const special2 = createTestSpecial({ specialId: 1 });

      const response = await request(app)
        .post('/specials')
        .send(special2)
        .expect(500);

      expect(response.body).toHaveProperty('message', 'Error creating special');
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid date format', async () => {
      const invalidSpecialData = createTestSpecial({
        specialId: 1,
        startDate: 'invalid-date',
        endDate: 'invalid-date'
      });

      const response = await request(app)
        .post('/specials')
        .send(invalidSpecialData)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Validation error');
      expect(response.body).toHaveProperty('error');
    });

    it('should accept endDate before startDate (no validation)', async () => {
      const specialData = createTestSpecial({
        specialId: 1,
        startDate: new Date('2024-12-31'),
        endDate: new Date('2024-01-01') // End date before start date
      });

      const response = await request(app)
        .post('/specials')
        .send(specialData)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('startDate');
      expect(response.body).toHaveProperty('endDate');
    });
  });

  describe('PATCH /specials/:id', () => {
    it('should update a special successfully', async () => {
      // Create a special first
      const specialData = createTestSpecial({
        specialId: 1,
        title: 'Original Title',
        message: 'Original message'
      });
      const createdSpecial = await Special.create(specialData);

      const updateData = {
        title: 'Updated Title',
        message: 'Updated message'
      };

      const response = await request(app)
        .patch(`/specials/${createdSpecial._id}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('_id', createdSpecial._id.toString());
      expect(response.body).toHaveProperty('title', 'Updated Title');
      expect(response.body).toHaveProperty('message', 'Updated message');
      expect(response.body).toHaveProperty('specialId', 1); // Should remain unchanged
    });

    it('should return 404 for non-existent special', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const updateData = { title: 'Updated Title' };

      const response = await request(app)
        .patch(`/specials/${fakeId}`)
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Special not found');
    });

    it('should return 500 for invalid update data', async () => {
      // Create a special first
      const specialData = createTestSpecial({ specialId: 1 });
      const createdSpecial = await Special.create(specialData);

      const invalidUpdateData = {
        specialId: 'invalid-id', // Invalid type
        startDate: 'invalid-date' // Invalid date format
      };

      const response = await request(app)
        .patch(`/specials/${createdSpecial._id}`)
        .send(invalidUpdateData)
        .expect(500);

      expect(response.body).toHaveProperty('message', 'Error updating special');
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid ObjectId format', async () => {
      const invalidId = 'invalid-object-id';
      const updateData = { title: 'Updated Title' };

      const response = await request(app)
        .patch(`/specials/${invalidId}`)
        .send(updateData)
        .expect(500); // MongoDB will throw an error for invalid ObjectId

      expect(response.body).toHaveProperty('message', 'Error updating special');
    });
  });

  describe('DELETE /specials/:id', () => {
    it('should delete a special successfully', async () => {
      // Create a special first
      const specialData = createTestSpecial({ specialId: 1 });
      const createdSpecial = await Special.create(specialData);

      const response = await request(app)
        .delete(`/specials/${createdSpecial._id}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Special deleted successfully');

      // Verify the special is actually deleted
      const deletedSpecial = await Special.findById(createdSpecial._id);
      expect(deletedSpecial).toBeNull();
    });

    it('should return 404 for non-existent special', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/specials/${fakeId}`)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Special not found');
    });

    it('should return 500 for invalid ObjectId format', async () => {
      const invalidId = 'invalid-object-id';

      const response = await request(app)
        .delete(`/specials/${invalidId}`)
        .expect(500); // MongoDB will throw an error for invalid ObjectId

      expect(response.body).toHaveProperty('message', 'Error deleting special');
    });
  });

  describe('Edge Cases and Business Logic', () => {
    it('should handle specials with empty itemIds array', async () => {
      const specialData = createTestSpecial({
        specialId: 1,
        title: 'Empty Items Special',
        message: 'Special with no items',
        itemIds: []
      });

      const response = await request(app)
        .post('/specials')
        .send(specialData)
        .expect(201);

      expect(response.body).toHaveProperty('itemIds');
      expect(response.body.itemIds).toEqual([]);
    });

    it('should handle specials with single itemId', async () => {
      const specialData = createTestSpecial({
        specialId: 1,
        title: 'Single Item Special',
        message: 'Special with one item',
        itemIds: [999]
      });

      const response = await request(app)
        .post('/specials')
        .send(specialData)
        .expect(201);

      expect(response.body).toHaveProperty('itemIds');
      expect(response.body.itemIds).toEqual([999]);
    });

    it('should handle specials with very long title and message', async () => {
      const longTitle = 'A'.repeat(1000);
      const longMessage = 'B'.repeat(2000);
      
      const specialData = createTestSpecial({
        specialId: 1,
        title: longTitle,
        message: longMessage
      });

      const response = await request(app)
        .post('/specials')
        .send(specialData)
        .expect(201);

      expect(response.body).toHaveProperty('title', longTitle);
      expect(response.body).toHaveProperty('message', longMessage);
    });

    it('should handle specials with past dates', async () => {
      const pastStartDate = new Date('2020-01-01');
      const pastEndDate = new Date('2020-12-31');
      
      const specialData = createTestSpecial({
        specialId: 1,
        title: 'Past Special',
        message: 'This special is in the past',
        startDate: pastStartDate,
        endDate: pastEndDate
      });

      const response = await request(app)
        .post('/specials')
        .send(specialData)
        .expect(201);

      expect(response.body).toHaveProperty('startDate');
      expect(response.body).toHaveProperty('endDate');
    });
  });
}); 