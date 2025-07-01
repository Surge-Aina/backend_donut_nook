require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./utils/db');
const testRoute = require('./routes/testRoute');
const userRoutes = require('./routes/users'); // ✅ add this line
const storeRoutes = require('./routes/storeRoutes');
const aboutRoutes = require('./routes/aboutRoutes');


const app = express();

connectDB();
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());

app.use('/test', testRoute);

app.use('/users', userRoutes); // ✅ mount route prefix

app.use('/api/store', storeRoutes);
app.use('/api/about', aboutRoutes);

app.get('/', (req, res) => {
  res.send('🍩 Donut Nook Backend is Alive!');
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});
