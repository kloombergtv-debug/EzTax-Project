// Debugging script to check Danny's tax data
const fetch = require('node-fetch');

async function checkDannyData() {
  try {
    // Direct database query endpoint
    const response = await fetch('http://localhost:5000/api/tax-return/user/20', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Danny tax data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

checkDannyData();