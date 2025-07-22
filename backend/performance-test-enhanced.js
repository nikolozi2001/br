/**
 * Enhanced Performance Test Script for Report APIs
 * Tests the upgraded performance optimization features
 */

const http = require('http');
const { performance } = require('perf_hooks');

// Configuration
const BASE_URL = 'http://localhost:3000';
const REPORT_ENDPOINTS = [
  '/api/report1',
  '/api/report2', 
  '/api/report3'
];
const TEST_ITERATIONS = 10;
const CONCURRENT_REQUESTS = 5;

/**
 * Make HTTP request and measure comprehensive metrics
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
          requestId: res.headers['x-request-id'],
          serverTime: res.headers['x-server-time'],
          dataSize: data.length,
          headers: {
            responseTime: res.headers['x-response-time'],
            cacheKey: res.headers['x-cache-key'],
            dataSize: res.headers['x-data-size']
          }
        });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(15000, () => {
      reject(new Error('Request timeout'));
    });
  });
}

/**
 * Test concurrent requests
 */
async function testConcurrentRequests(endpoint, concurrency = CONCURRENT_REQUESTS) {
  console.log(`\n🚀 Testing ${concurrency} concurrent requests to ${endpoint}...`);
  
  const promises = Array(concurrency).fill().map(() => 
    makeRequest(`${BASE_URL}${endpoint}?lang=en`)
  );
  
  const start = performance.now();
  const results = await Promise.all(promises);
  const totalTime = performance.now() - start;
  
  const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
  const cacheHits = results.filter(r => r.cacheStatus === 'HIT').length;
  
  console.log(`   ✅ Completed in ${totalTime.toFixed(2)}ms`);
  console.log(`   📊 Average response: ${avgResponseTime.toFixed(2)}ms`);
  console.log(`   🎯 Cache hits: ${cacheHits}/${concurrency} (${((cacheHits/concurrency)*100).toFixed(1)}%)`);
  
  return { results, totalTime, avgResponseTime, cacheHits };
}

/**
 * Test cache warming and performance
 */
async function testCachePerformance(endpoint) {
  console.log(`\n❄️  Testing cache performance for ${endpoint}...`);
  
  // Clear cache first
  try {
    await makeRequest(`${BASE_URL}${endpoint}/cache`);
    console.log('   🧹 Cache cleared');
  } catch (err) {
    // Cache clear endpoint might not exist for all routes
  }
  
  // Cold start
  console.log('   🌡️  Cold start test...');
  const coldResult = await makeRequest(`${BASE_URL}${endpoint}?lang=en`);
  console.log(`      ⏱️  Cold: ${coldResult.responseTime.toFixed(2)}ms (${coldResult.cacheStatus || 'N/A'})`);
  
  // Warm cache tests
  console.log('   🔥 Warm cache tests...');
  const warmResults = [];
  for (let i = 0; i < 5; i++) {
    const result = await makeRequest(`${BASE_URL}${endpoint}?lang=en`);
    warmResults.push(result);
    if (i < 3) {
      console.log(`      ⏱️  Warm ${i+1}: ${result.responseTime.toFixed(2)}ms (${result.cacheStatus || 'N/A'})`);
    }
  }
  
  const avgWarmTime = warmResults.reduce((sum, r) => sum + r.responseTime, 0) / warmResults.length;
  const improvement = ((coldResult.responseTime - avgWarmTime) / coldResult.responseTime * 100);
  
  console.log(`   📈 Cache improvement: ${improvement.toFixed(1)}% faster`);
  
  return { coldResult, warmResults, avgWarmTime, improvement };
}

/**
 * Test health and monitoring endpoints
 */
async function testMonitoringEndpoints() {
  console.log('\n🏥 Testing monitoring endpoints...');
  
  const endpoints = [
    '/api/monitoring/health',
    '/api/monitoring/diagnostics',
    '/api/monitoring/metrics',
    '/api/monitoring/cache/stats'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const result = await makeRequest(`${BASE_URL}${endpoint}`);
      console.log(`   ✅ ${endpoint}: ${result.statusCode} (${result.responseTime.toFixed(2)}ms)`);
    } catch (error) {
      console.log(`   ❌ ${endpoint}: ${error.message}`);
    }
  }
}

/**
 * Test circuit breaker functionality
 */
async function testCircuitBreaker() {
  console.log('\n⚡ Testing circuit breaker resilience...');
  
  // Test with invalid endpoint to trigger failures
  const invalidEndpoint = '/api/report999';
  let failures = 0;
  
  for (let i = 0; i < 3; i++) {
    try {
      await makeRequest(`${BASE_URL}${invalidEndpoint}`);
    } catch (error) {
      failures++;
    }
  }
  
  console.log(`   📊 Simulated ${failures} failures for circuit breaker testing`);
  
  // Check circuit breaker status
  try {
    const healthResult = await makeRequest(`${BASE_URL}/api/monitoring/health`);
    console.log(`   🔍 System health check: ${healthResult.statusCode}`);
  } catch (error) {
    console.log(`   ⚠️  Health check failed: ${error.message}`);
  }
}

/**
 * Run comprehensive performance tests
 */
async function runEnhancedPerformanceTests() {
  console.log('🚀 Starting Enhanced Performance Tests...\n');
  console.log('=' .repeat(60));
  
  const testResults = {
    endpoints: {},
    monitoring: {},
    summary: {}
  };

  try {
    // Test each report endpoint
    for (const endpoint of REPORT_ENDPOINTS) {
      console.log(`\n📋 Testing ${endpoint}...`);
      console.log('-'.repeat(40));
      
      try {
        // Cache performance test
        const cacheTest = await testCachePerformance(endpoint);
        
        // Concurrent requests test  
        const concurrentTest = await testConcurrentRequests(endpoint);
        
        testResults.endpoints[endpoint] = {
          cacheTest,
          concurrentTest
        };
        
      } catch (error) {
        console.log(`   ❌ Error testing ${endpoint}: ${error.message}`);
        testResults.endpoints[endpoint] = { error: error.message };
      }
    }

    // Test monitoring endpoints
    await testMonitoringEndpoints();
    
    // Test circuit breaker
    await testCircuitBreaker();

    // Performance summary
    console.log('\n📊 Performance Summary:');
    console.log('=' .repeat(60));
    
    for (const [endpoint, results] of Object.entries(testResults.endpoints)) {
      if (results.error) {
        console.log(`❌ ${endpoint}: ${results.error}`);
        continue;
      }
      
      const { cacheTest, concurrentTest } = results;
      
      console.log(`\n📈 ${endpoint}:`);
      console.log(`   Cold Start: ${cacheTest.coldResult.responseTime.toFixed(2)}ms`);
      console.log(`   Cached Avg: ${cacheTest.avgWarmTime.toFixed(2)}ms`);
      console.log(`   Improvement: ${cacheTest.improvement.toFixed(1)}%`);
      console.log(`   Concurrent Avg: ${concurrentTest.avgResponseTime.toFixed(2)}ms`);
      console.log(`   Cache Hit Rate: ${((concurrentTest.cacheHits/CONCURRENT_REQUESTS)*100).toFixed(1)}%`);
    }

    // Final health check
    console.log('\n🏁 Final System Health Check:');
    console.log('-'.repeat(40));
    
    try {
      const finalHealth = await makeRequest(`${BASE_URL}/api/monitoring/health`);
      console.log(`✅ System Status: ${finalHealth.statusCode === 200 ? 'Healthy' : 'Issues Detected'}`);
      console.log(`⏱️  Health Check Time: ${finalHealth.responseTime.toFixed(2)}ms`);
    } catch (error) {
      console.log(`❌ Health check failed: ${error.message}`);
    }

    console.log('\n🎉 Performance testing completed!');
    console.log('\n💡 Recommendations:');
    console.log('   • Monitor cache hit rates - aim for >80%');
    console.log('   • Watch for response times >1000ms');
    console.log('   • Check /api/monitoring/diagnostics for insights');
    console.log('   • Use /api/monitoring/metrics for ongoing monitoring');

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
if (require.main === module) {
  runEnhancedPerformanceTests().catch(console.error);
}

module.exports = {
  runEnhancedPerformanceTests,
  testCachePerformance,
  testConcurrentRequests,
  makeRequest
};
