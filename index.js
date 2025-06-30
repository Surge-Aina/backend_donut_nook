require('dotenv').config();
const express = require('express');
const cors = require('cors');
const testRoute = require('./routes/testRoute');

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
app.use(express.json());

// Test route for connection check
app.use('/test', testRoute);

// Optional default route
app.get('/', (req, res) => {
  res.send('🍩 Donut Nook Backend is Alive!');
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});
