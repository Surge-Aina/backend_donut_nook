const request = require('supertest');
const express = require('express');
const app = express();

app.use(express.json());
// Mock the Menu model
jest.mock('../models/Menu', () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

const Menu = require('../models/Menu');
const menuController = require('../controllers/menuController');

const mockedMenuItem = {
    _id: 'abc123',
    price: 9.99,
    availability: true,
    category: 'Old Category'
}

// Use your controller functions
app.get('/menu', menuController.getAllItems);
app.get('/menu/:itemId', menuController.getItemByItemId);
app.patch('/menu/:itemId', menuController.editItemByItemId);

describe('Menu Controller', () => {
  describe('GET /menu', () => {
    it('should return all items with status 200', async () => {
      // Mock data for all items
      const mockItems = [{ itemId: '1', name: 'Item 1' }, { itemId: '2', name: 'Item 2' }];
      Menu.find.mockResolvedValue(mockItems);

      const response = await request(app).get('/menu');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockItems);
    });

    it('should return 500 if there is an error', async () => {
      Menu.find.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/menu');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ message: 'error finding all items' });
    });
  });

  describe('GET /menu/:itemId', () => {
    it('should return the item if found', async () => {
      const mockItem = { itemId: '1', name: 'Item 1' };
      Menu.findOne.mockResolvedValue(mockItem);

      const response = await request(app).get('/menu/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockItem);
    });

    it('should return 404 if item is not found', async () => {
      Menu.findOne.mockResolvedValue(null);

      const response = await request(app).get('/menu/1');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'item not found' });
    });

    it('should return 500 if there is an error', async () => {
      Menu.findOne.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/menu/1');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ message: 'error getting item by ID' });
    });
  });

  describe('PATCH /menu/:itemId', () => {
    it('should return updated item', async () => {
        Menu.findOne.mockResolvedValue(mockedMenuItem);

        Menu.findByIdAndUpdate.mockResolvedValue({
            _id: 'abc123',
            price: 9.99,
            availability: true,
            category: 'Updated category'
        });

        const response = await request(app)
            .patch('/menu/1')
            .send({ category: 'Updated category' });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            _id: 'abc123',
            price: 9.99,
            availability: true,
            category: 'Updated category'
        });
    });
    });

    describe('PATCH /menu/:itemId', () => {
        it('should return 404 no item found', async () => {
            Menu.findOne.mockResolvedValue(null);

            const response = await request(app)
                .patch('/menu/999')
                .send({category: ' no item found test '});
            
            expect(response.status).toBe(404);
            expect(response.body).toEqual({message: 'item not found'});
        });
    });

});
