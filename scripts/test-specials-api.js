const axios = require('axios');

const API_BASE = 'http://localhost:5100/api';

async function testSpecialsAPI() {
  console.log('🧪 Testing Specials API...\n');

  try {
    // Test GET /api/specials
    console.log('📡 Testing GET /api/specials...');
    const response = await axios.get(`${API_BASE}/specials`);
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`📊 Found ${response.data.length} specials`);
    
    if (response.data.length > 0) {
      console.log('\n📋 Current Specials:');
      response.data.forEach((special, index) => {
        console.log(`${index + 1}. ${special.title}`);
        console.log(`   Message: ${special.message}`);
        console.log(`   Valid: ${new Date(special.startDate).toLocaleDateString()} - ${new Date(special.endDate).toLocaleDateString()}`);
        console.log(`   ID: ${special._id}`);
        console.log('');
      });
    } else {
      console.log('❌ No specials found in database');
      console.log('💡 Run the seed script: node scripts/seed-specials.js');
    }

  } catch (error) {
    console.error('❌ API Test Failed:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
    } else if (error.request) {
      console.error('   No response received. Is the backend running on port 5100?');
    } else {
      console.error(`   Error: ${error.message}`);
    }
  }
}

// Run the test
testSpecialsAPI(); 