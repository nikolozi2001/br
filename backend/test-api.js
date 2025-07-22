/**
 * Quick API Test Script
 * Tests the fixed report2 endpoint
 */

const http = require('http');

function testAPI() {
  console.log('🧪 Testing Report2 API...\n');
  
  const options = {
    hostname: '192.168.1.27',
    port: 5000,
    path: '/api/report2?lang=ge',
    method: 'GET',
    timeout: 5000
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        if (res.statusCode === 200) {
          const response = JSON.parse(data);
          console.log('\n✅ Success! API Response:');
          console.log(`- Totals: ${JSON.stringify(response.totals)}`);
          console.log(`- Rows count: ${response.rows?.length || 0}`);
          console.log(`- Cache status: ${res.headers['x-cache'] || 'N/A'}`);
        } else {
          console.log('\n❌ Error Response:');
          console.log(data);
        }
      } catch (e) {
        console.log('\n❌ Failed to parse response:');
        console.log(data);
      }
    });
  });

  req.on('error', (err) => {
    console.log('\n❌ Request failed:', err.message);
    console.log('\n💡 Make sure the server is running on http://192.168.1.27:5000');
  });

  req.on('timeout', () => {
    console.log('\n⏰ Request timed out');
    req.destroy();
  });

  req.end();
}

if (require.main === module) {
  testAPI();
}

module.exports = { testAPI };
