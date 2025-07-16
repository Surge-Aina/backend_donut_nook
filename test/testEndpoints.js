const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5100/store-info';

async function testEndpoints() {
  try {
    console.log('Testing Store Timings API Endpoints\n');
    
    // 1. Test GET /timings
    console.log('1. Testing GET /timings');
    const timingsResponse = await axios.get(`${API_BASE_URL}/timings`);
    console.log('Response status:', timingsResponse.status);
    console.log('Timings data:', JSON.stringify(timingsResponse.data, null, 2));
    
    // 2. Test GET /status
    console.log('\n2. Testing GET /status');
    const statusResponse = await axios.get(`${API_BASE_URL}/status`);
    console.log('Response status:', statusResponse.status);
    console.log('Store status:', JSON.stringify(statusResponse.data, null, 2));
    
    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('\nError:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    process.exit(1);
  }
}

testEndpoints();
