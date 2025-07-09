require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./utils/db'); // ✅ only once
const testRoute = require('./routes/testRoute');

const aboutRoutes = require('./routes/aboutRoute');

const userRoutes = require('./routes/users');
const specialsRoutes = require('./routes/specials');
const storeRoutes = require('./routes/storeRoutes');
const holidayRoutes = require('./routes/holidayRoutes');
const aboutRoutes = require('./routes/aboutRoute');
const menuRoutes = require('./routes/menu');
const storeInfoRoutes = require('./routes/storeInfoRoutes');
const customerRoutes = require('./routes/customers');


const app = express();

// Connect to database (non-blocking for Render)
connectDB().catch(err => {
  console.error('❌ Database connection failed:', err);
  // Don't throw error - let server start anyway
});

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());

app.use('/test', testRoute);
app.use('/users', userRoutes);
app.use('/specials', specialsRoutes);
app.use('/api/store', storeRoutes);
app.use('/about', aboutRoutes);
app.use('/menu', menuRoutes);
app.use('/customers', customerRoutes);
app.use('/store-info', storeInfoRoutes);
app.use('/holidays', holidayRoutes); // ✅ Make sure this is added!


app.use('/about', aboutRoutes);



app.get('/', (req, res) => {
  res.status(200).json({
    message: '🍩 Donut Nook Backend is Alive!',
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Additional health check for Render
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', port: PORT });
});

// Port configuration for Render deployment
const PORT = process.env.PORT || 5100;
console.log(`🔧 Environment PORT: ${process.env.PORT}`);
console.log(`🔧 Using PORT: ${PORT}`);
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Backend running on port ${PORT}`);
  console.log(`🌐 Server accessible at: http://localhost:${PORT}`);
});

module.exports = { app, server }; // ✅ Export both for testing

