require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./utils/db'); // ✅ only once
const testRoute = require('./routes/testRoute');
const testTimingRoute = require('./routes/testTimingRoute');
const userRoutes = require('./routes/users');
const specialsRoutes = require('./routes/specials');
const storeRoutes = require('./routes/storeRoutes');
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

// Configure CORS to allow multiple origins
const allowedOrigins = [
  'http://localhost:3000', // Local development
  'https://frontend-donut-nook.vercel.app', // Production frontend
  // Add other environments as needed
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified origin: ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

app.use('/test', testRoute);
app.use('/test-timings', testTimingRoute);
app.use('/users', userRoutes);
app.use('/specials', specialsRoutes);
app.use('/api/store', storeRoutes);
app.use('/about', aboutRoutes);
app.use('/menu', menuRoutes);
app.use('/customers', customerRoutes);
app.use('/store-info', storeInfoRoutes);

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

