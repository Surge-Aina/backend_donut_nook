require('dotenv').config();
const mongoose = require('mongoose');
const Holiday = require('../models/Holiday');
const connectDB = require('../utils/db');

const holidays = [
  { name: "New Year's Day", date: "2025-01-01" },
  { name: "Martin Luther King, Jr.'s Birthday", date: "2025-01-20" },
  { name: "Washington's Birthday", date: "2025-02-17" },
  { name: "Memorial Day", date: "2025-05-26" },
  { name: "Juneteenth National Independence Day", date: "2025-06-19" },
  { name: "Independence Day", date: "2025-07-04" },
  { name: "Labor Day", date: "2025-09-01" },
  { name: "Columbus Day", date: "2025-10-13" },
  { name: "Veterans Day", date: "2025-11-11" },
  { name: "Thanksgiving Day", date: "2025-11-27" },
  { name: "Christmas Day", date: "2025-12-25" }
];

const generateBannerStart = (dateStr) => {
  const date = new Date(dateStr);
  date.setDate(date.getDate() - 15);
  return date.toISOString().split('T')[0];
};

const seedHolidays = async () => {
  await connectDB();

  // Clear existing holidays (optional)
  await Holiday.deleteMany();

  // Add 15-day banner start and insert
  const holidayData = holidays.map(h => ({
    name: h.name,
    date: h.date,
    bannerStart: generateBannerStart(h.date),
    mustClose: true
  }));

  await Holiday.insertMany(holidayData);
  console.log('✅ Holidays seeded successfully');

  mongoose.disconnect();
};

seedHolidays();