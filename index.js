require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./utils/db');
const testRoute = require('./routes/testRoute');
const userRoutes = require('./routes/users'); // ✅ add this line


const app = express();

connectDB();
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());

app.use('/test', testRoute);

app.use('/users', userRoutes); // ✅ mount route prefix

// Add store info routes
const storeInfoRoutes = require('./routes/storeInfoRoutes');
app.use('/api/store-info', storeInfoRoutes);

app.get('/', (req, res) => {
  res.send('🍩 Donut Nook Backend is Alive!');
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});
