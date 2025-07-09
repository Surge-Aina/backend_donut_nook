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

// Mock the Special model
jest.mock('../models/Special', () => ({
  find: jest.fn(),
  findOne: jest.fn(),
}));

const Menu = require('../models/Menu');
const Special = require('../models/Special');
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
      const mockItems = [
        { itemId: 1, name: 'Item 1', toObject: () => ({ itemId: 1, name: 'Item 1' }) }, 
        { itemId: 2, name: 'Item 2', toObject: () => ({ itemId: 2, name: 'Item 2' }) }
      ];
      Menu.find.mockResolvedValue(mockItems);
      
      // Mock active specials
      const mockActiveSpecials = [
        {
          title: 'Summer Sale',
          message: 'Get 20% off!',
          endDate: new Date('2024-12-31'),
          itemIds: [1]
        }
      ];
      Special.find.mockResolvedValue(mockActiveSpecials);

      const response = await request(app).get('/menu');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('activeSpecial');
      expect(response.body[0].activeSpecial).toEqual({
        title: 'Summer Sale',
        message: 'Get 20% off!',
        expiresOn: new Date('2024-12-31')
      });
      expect(response.body[1]).not.toHaveProperty('activeSpecial');
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
      const mockItem = { 
        itemId: 1, 
        name: 'Item 1',
        toObject: () => ({ itemId: 1, name: 'Item 1' })
      };
      Menu.findOne.mockResolvedValue(mockItem);
      
      // Mock no active special
      Special.findOne.mockResolvedValue(null);

      const response = await request(app).get('/menu/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ itemId: 1, name: 'Item 1' });
      expect(response.body).not.toHaveProperty('activeSpecial');
    });
    
    it('should return the item with active special if found', async () => {
      const mockItem = { 
        itemId: 1, 
        name: 'Item 1',
        toObject: () => ({ itemId: 1, name: 'Item 1' })
      };
      Menu.findOne.mockResolvedValue(mockItem);
      
      // Mock active special
      const mockActiveSpecial = {
        title: 'Special Deal',
        message: 'Limited time offer!',
        endDate: new Date('2024-12-31')
      };
      Special.findOne.mockResolvedValue(mockActiveSpecial);

      const response = await request(app).get('/menu/1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('activeSpecial');
      expect(response.body.activeSpecial).toEqual({
        title: 'Special Deal',
        message: 'Limited time offer!',
        expiresOn: new Date('2024-12-31')
      });
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
