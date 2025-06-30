const express = require('express');
const router = express.Router();
const { MongoClient } = require('mongodb');

router.get('/ping', async (req, res) => {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('donut_nook');
    const doc = await db.collection('test').findOne({});
    res.json({
      message: process.env.DEPLOYMENT_TEST_MSG,
      dbTest: doc?.text || 'No data found in test collection'
    });
  } catch (err) {
    console.error('MongoDB error:', err);
    res.status(500).json({ error: 'MongoDB connection failed' });
  } finally {
    await client.close();
  }
});

module.exports = router;
