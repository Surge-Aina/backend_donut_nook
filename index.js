require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient,ServerApiVersion } = require('mongodb');

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.get('/', (req, res) => {
    res.send('Backend is alive!');
  });

app.get('/ping', async (req, res) => {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('donut_nook');
    const doc = await db.collection('test').findOne({});
    res.json({
      message: process.env.DEPLOYMENT_TEST_MSG,
      dbTest: doc?.text || 'No data found in ctest'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to connect to MongoDB' });
  } finally {
    await client.close();
  }
});

const PORT = process.env.PORT;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Backend running on port ${PORT}`);
});
