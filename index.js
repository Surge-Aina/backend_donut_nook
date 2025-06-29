require('dotenv').config();
const express = require('express');
const app = express();

const PORT = process.env.PORT;

app.get('/', (req, res) => {
    res.set('Content-Type', 'text/plain');
    res.status(200).send('Donut Nook Backend is Running!');
  });
  
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
