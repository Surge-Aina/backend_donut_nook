require('dotenv').config();
const mongoose = require('mongoose');
const Customer = require('../models/Customer');

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const customers = [
    {
      name: 'John Smith',
      email: 'john.smith@email.com',
      phone: '+1-555-0101',
      dob: new Date('1990-05-15'),
      totalSpent: 45.50,
      loyaltyPoints: 150,
      purchaseHistory: [
        {
          menuItemId: 1,
          amount: 3.50,
          timestamp: new Date('2024-01-15T10:30:00Z')
        },
        {
          menuItemId: 2,
          amount: 4.25,
          timestamp: new Date('2024-01-20T14:15:00Z')
        }
      ]
    },
    {
      name: 'Sarah Johnson',
      email: 'sarah.j@email.com',
      phone: '+1-555-0102',
      dob: new Date('1985-08-22'),
      totalSpent: 78.75,
      loyaltyPoints: 275,
      purchaseHistory: [
        {
          menuItemId: 3,
          amount: 5.00,
          timestamp: new Date('2024-01-10T09:45:00Z')
        },
        {
          menuItemId: 1,
          amount: 3.50,
          timestamp: new Date('2024-01-18T16:20:00Z')
        }
      ]
    },
    {
      name: 'Mike Davis',
      email: 'mike.davis@email.com',
      phone: '+1-555-0103',
      dob: new Date('1992-12-03'),
      totalSpent: 32.00,
      loyaltyPoints: 100,
      purchaseHistory: [
        {
          menuItemId: 2,
          amount: 4.25,
          timestamp: new Date('2024-01-22T11:00:00Z')
        }
      ]
    },
    {
      name: 'Emily Wilson',
      email: 'emily.w@email.com',
      phone: '+1-555-0104',
      dob: new Date('1988-03-14'),
      totalSpent: 120.50,
      loyaltyPoints: 400,
      purchaseHistory: [
        {
          menuItemId: 1,
          amount: 3.50,
          timestamp: new Date('2024-01-05T13:30:00Z')
        },
        {
          menuItemId: 3,
          amount: 5.00,
          timestamp: new Date('2024-01-12T15:45:00Z')
        },
        {
          menuItemId: 2,
          amount: 4.25,
          timestamp: new Date('2024-01-25T10:15:00Z')
        }
      ]
    },
    {
      name: 'David Brown',
      email: 'david.brown@email.com',
      phone: '+1-555-0105',
      dob: new Date('1995-07-08'),
      totalSpent: 15.75,
      loyaltyPoints: 50,
      purchaseHistory: [
        {
          menuItemId: 1,
          amount: 3.50,
          timestamp: new Date('2024-01-28T12:00:00Z')
        }
      ]
    },
    {
      name: 'Customer User',
      email: 'cust@test.com',
      phone: '+1-555-0106',
      dob: new Date('1999-01-01'),
      totalSpent: 60.00,
      loyaltyPoints: 200,
      purchaseHistory: [
        {
          menuItemId: 1,
          amount: 5.00,
          timestamp: new Date('2024-02-01T10:00:00Z')
        },
        {
          menuItemId: 2,
          amount: 7.50,
          timestamp: new Date('2024-02-10T12:30:00Z')
        }
      ]
    }
  ];

  // Clear existing customers
  await Customer.deleteMany({});
  
  // Insert new customers
  for (const customer of customers) {
    await Customer.create(customer);
  }

  console.log('✅ Seeded 5 test customers');
  await mongoose.disconnect();
};

seed().catch(console.error); 