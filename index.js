require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./utils/db'); // ✅ only once
const testRoute = require('./routes/testRoute');
const userRoutes = require('./routes/users');
const specialsRoutes = require('./routes/specials');
const storeRoutes = require('./routes/storeRoutes');
const holidayRoutes = require('./routes/holidayRoutes');
const aboutRoutes = require('./routes/aboutRoutes');
const menuRoutes = require('./routes/menu');
const storeInfoRoutes = require('./routes/storeInfoRoutes');
const customerRoutes = require('./routes/customers');

const app = express();

connectDB();
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());

app.use('/test', testRoute);
app.use('/users', userRoutes);
app.use('/specials', specialsRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/about', aboutRoutes);
app.use('/menu', menuRoutes);
app.use('/customers', customerRoutes);
app.use('/api/store-info', storeInfoRoutes);
app.use('/api/holidays', holidayRoutes); // ✅ Make sure this is added!

app.get('/', (req, res) => {
  res.send('🍩 Donut Nook Backend is Alive!');
});

const PORT = process.env.PORT || 5100; // fallback if PORT is undefined
const server = app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});

module.exports = { app, server }; // ✅ Export both for testing

