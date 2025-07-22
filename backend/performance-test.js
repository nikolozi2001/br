/**
 * Performance Test Script for Report APIs
 * Run this script to validate the performance optimizations
 */

const http = require('http');
const { performance } = require('perf_hooks');

// Configuration
const BASE_URL = 'http://localhost:3000';
const REPORT_ENDPOINT = '/api/report2';
const TEST_ITERATIONS = 10;

/**
 * Make HTTP request and measure response time
 */
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const start = performance.now();
    
    const req = http.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const end = performance.now();
        const responseTime = end - start;
        
        resolve({
          statusCode: res.statusCode,
          responseTime,
          cacheStatus: res.headers['x-cache'],
          data: data.length,
          headers: res.headers
        });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(10000, () => {
      reject(new Error('Request timeout'));
    });
  });
}

/**
 * Run performance tests
 */
async function runPerformanceTests() {
  console.log('🚀 Starting Performance Tests...\n');
  
  const results = {
    cold: [],
    cached: [],
    health: null
  };

  try {
    // Test 1: Cold start (first request)
    console.log('1️⃣  Testing cold start performance...');
    const coldResult = await makeRequest(`${BASE_URL}${REPORT_ENDPOINT}?lang=en`);
    results.cold.push(coldResult);
    console.log(`   ✅ Cold start: ${coldResult.responseTime.toFixed(2)}ms (Cache: ${coldResult.cacheStatus || 'N/A'})`);

    // Small delay to ensure cache is set
    await new Promise(resolve => setTimeout(resolve, 100));

    // Test 2: Cached requests
    console.log('\n2️⃣  Testing cached performance...');
    for (let i = 0; i < TEST_ITERATIONS; i++) {
      const cachedResult = await makeRequest(`${BASE_URL}${REPORT_ENDPOINT}?lang=en`);
      results.cached.push(cachedResult);
      
      if (i < 3) { // Show first 3 results
        console.log(`   ✅ Request ${i + 1}: ${cachedResult.responseTime.toFixed(2)}ms (Cache: ${cachedResult.cacheStatus || 'N/A'})`);
      }
    }

    // Test 3: Health check
    console.log('\n3️⃣  Testing health endpoint...');
    const healthResult = await makeRequest(`${BASE_URL}${REPORT_ENDPOINT}/health`);
    results.health = healthResult;
    console.log(`   ✅ Health check: ${healthResult.responseTime.toFixed(2)}ms`);

    // Test 4: Different language (new cache entry)
    console.log('\n4️⃣  Testing different language...');
    const georgianResult = await makeRequest(`${BASE_URL}${REPORT_ENDPOINT}?lang=ge`);
    console.log(`   ✅ Georgian: ${georgianResult.responseTime.toFixed(2)}ms (Cache: ${georgianResult.cacheStatus || 'N/A'})`);

    // Analysis
    console.log('\n📊 Performance Analysis:');
    console.log('=' .repeat(50));
    
    const avgCached = results.cached.reduce((sum, r) => sum + r.responseTime, 0) / results.cached.length;
    const minCached = Math.min(...results.cached.map(r => r.responseTime));
    const maxCached = Math.max(...results.cached.map(r => r.responseTime));
    
    console.log(`Cold Start Response Time: ${results.cold[0].responseTime.toFixed(2)}ms`);
    console.log(`Cached Average Response Time: ${avgCached.toFixed(2)}ms`);
    console.log(`Cached Min Response Time: ${minCached.toFixed(2)}ms`);
    console.log(`Cached Max Response Time: ${maxCached.toFixed(2)}ms`);
    console.log(`Performance Improvement: ${((results.cold[0].responseTime - avgCached) / results.cold[0].responseTime * 100).toFixed(1)}%`);
    
    // Cache analysis
    const cacheHits = results.cached.filter(r => r.cacheStatus === 'HIT').length;
    const cacheMisses = results.cached.filter(r => r.cacheStatus === 'MISS').length;
    
    console.log(`\n🎯 Cache Performance:`);
    console.log(`Cache Hits: ${cacheHits}/${results.cached.length} (${(cacheHits / results.cached.length * 100).toFixed(1)}%)`);
    console.log(`Cache Misses: ${cacheMisses}/${results.cached.length} (${(cacheMisses / results.cached.length * 100).toFixed(1)}%)`);

    // Health check data
    if (results.health && results.health.statusCode === 200) {
      try {
        const healthData = JSON.parse(results.health.data);
        console.log(`\n💚 System Health:`);
        console.log(`Status: ${healthData.status}`);
        console.log(`Cache Size: ${healthData.cache_stats?.size || 'N/A'} entries`);
        console.log(`Max Cache Size: ${healthData.cache_stats?.maxSize || 'N/A'}`);
      } catch (e) {
        console.log('⚠️  Could not parse health data');
      }
    }

    console.log('\n✨ Performance tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Performance test failed:', error.message);
    console.log('\n💡 Make sure the server is running on port 3000');
    console.log('   Run: npm start (in backend directory)');
  }
}

/**
 * Test cache management endpoints
 */
async function testCacheManagement() {
  console.log('\n🧹 Testing Cache Management...');
  
  try {
    // Clear cache
    const clearResult = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: `${REPORT_ENDPOINT}/cache`,
        method: 'DELETE'
      };
      
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode, data }));
      });
      
      req.on('error', reject);
      req.end();
    });
    
    console.log(`   ✅ Cache cleared: ${clearResult.statusCode === 200 ? 'Success' : 'Failed'}`);
    
  } catch (error) {
    console.log(`   ❌ Cache management test failed: ${error.message}`);
  }
}

// Run tests
if (require.main === module) {
  console.log('Performance Optimization Test Suite');
  console.log('===================================\n');
  
  runPerformanceTests()
    .then(() => testCacheManagement())
    .then(() => {
      console.log('\n🎉 All tests completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runPerformanceTests,
  testCacheManagement,
  makeRequest
};
