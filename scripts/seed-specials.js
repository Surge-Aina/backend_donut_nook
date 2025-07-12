require('dotenv').config();
const mongoose = require('mongoose');
const Special = require('../models/Special');

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/donut_nook');
    console.log('✅ Connected to database');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

// Sample specials data
const sampleSpecials = [
  {
    specialId: 1001,
    title: '🍩 Weekend Donut Bonanza',
    message: 'Buy any 2 donuts, get 1 FREE! Perfect for sharing with friends and family. Valid every Saturday and Sunday.',
    itemIds: [101, 102, 103, 104, 105],
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    createdBy: new mongoose.Types.ObjectId()
  },
  {
    specialId: 1002,
    title: '🎉 Birthday Special',
    message: 'Celebrate your birthday with us! Show your ID and get 50% off any donut of your choice. Valid on your birthday month.',
    itemIds: [201, 202, 203, 204],
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    createdBy: new mongoose.Types.ObjectId()
  },
  {
    specialId: 1003,
    title: '☕ Coffee & Donut Combo',
    message: 'Pair any donut with a medium coffee for just $5.99! Perfect morning combo to start your day right.',
    itemIds: [301, 302, 303],
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    createdBy: new mongoose.Types.ObjectId()
  },
  {
    specialId: 1004,
    title: '🌅 Early Bird Special',
    message: 'First 10 customers every morning get 25% off their entire order! Doors open at 6 AM.',
    itemIds: [401, 402, 403, 404, 405],
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    createdBy: new mongoose.Types.ObjectId()
  },
  {
    specialId: 1005,
    title: '🎨 Custom Donut Workshop',
    message: 'Book a custom donut decorating workshop for groups of 6+ people. Includes all supplies and 2 donuts per person.',
    itemIds: [501, 502],
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    createdBy: new mongoose.Types.ObjectId()
  }
];

// Seed the database
const seedSpecials = async () => {
  try {
    // Clear existing specials
    await Special.deleteMany({});
    console.log('🗑️  Cleared existing specials');

    // Insert new specials
    const insertedSpecials = await Special.insertMany(sampleSpecials);
    console.log(`✅ Successfully seeded ${insertedSpecials.length} specials`);

    // Display the seeded specials
    console.log('\n📋 Seeded Specials:');
    insertedSpecials.forEach((special, index) => {
      console.log(`${index + 1}. ${special.title}`);
      console.log(`   Message: ${special.message}`);
      console.log(`   Valid: ${special.startDate.toLocaleDateString()} - ${special.endDate.toLocaleDateString()}`);
      console.log(`   ID: ${special._id}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error seeding specials:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the seed script
const main = async () => {
  console.log('🌱 Starting specials seed script...');
  await connectDB();
  await seedSpecials();
};

main().catch(console.error); 