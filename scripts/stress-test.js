#!/usr/bin/env node

/**
 * Stress Test: 1000 Concurrent Wallet Requests
 * 
 * Tests the KarmaTrust API under high load to verify:
 * - System stability under concurrent requests
 * - Cache effectiveness
 * - Rate limiting behavior
 * - Error handling
 * - Performance degradation patterns
 */

const API_BASE = process.env.API_BASE || 'http://localhost:3000';
const TOTAL_REQUESTS = 1000;
const CONCURRENCY = 50; // Concurrent requests at a time

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

/**
 * Generate random Ethereum address
 */
function generateRandomAddress() {
  const chars = '0123456789abcdef';
  let address = '0x';
  for (let i = 0; i < 40; i++) {
    address += chars[Math.floor(Math.random() * chars.length)];
  }
  return address;
}

/**
 * Generate test wallet addresses
 * Mix of random and real addresses for realistic testing
 */
function generateTestAddresses(count) {
  const addresses = [];
  
  // 10% real addresses (for cache testing)
  const realAddresses = [
    '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', // Alice
    '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B', // Bob
    '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', // Vitalik
  ];
  
  const realCount = Math.floor(count * 0.1);
  for (let i = 0; i < realCount; i++) {
    addresses.push(realAddresses[i % realAddresses.length]);
  }
  
  // 90% random addresses
  const randomCount = count - realCount;
  for (let i = 0; i < randomCount; i++) {
    addresses.push(generateRandomAddress());
  }
  
  // Shuffle
  return addresses.sort(() => Math.random() - 0.5);
}

/**
 * Make a single API request
 */
async function makeRequest(wallet, index) {
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${API_BASE}/api/credit/score?wallet=${wallet}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    const duration = Date.now() - startTime;
    
    if (!response.ok) {
      return {
        success: false,
        duration,
        status: response.status,
        error: `HTTP ${response.status}`,
        wallet,
        index,
      };
    }
    
    const data = await response.json();
    
    return {
      success: true,
      duration,
      status: response.status,
      cached: data.cached || false,
      dataSource: data.dataSource,
      score: data.score,
      wallet,
      index,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      success: false,
      duration,
      error: error.message,
      wallet,
      index,
    };
  }
}

/**
 * Run requests with concurrency control
 */
async function runConcurrentRequests(addresses, concurrency) {
  const results = [];
  const queue = [...addresses];
  let completed = 0;
  let inProgress = 0;
  
  return new Promise((resolve) => {
    function processNext() {
      while (inProgress < concurrency && queue.length > 0) {
        const wallet = queue.shift();
        const index = completed + inProgress;
        inProgress++;
        
        makeRequest(wallet, index)
          .then((result) => {
            results.push(result);
            completed++;
            inProgress--;
            
            // Progress indicator
            if (completed % 50 === 0 || completed === addresses.length) {
              const percent = ((completed / addresses.length) * 100).toFixed(1);
              process.stdout.write(`\r${colors.cyan}Progress: ${completed}/${addresses.length} (${percent}%)${colors.reset}`);
            }
            
            if (completed === addresses.length) {
              console.log('\n');
              resolve(results);
            } else {
              processNext();
            }
          })
          .catch((error) => {
            console.error(`\n${colors.red}Error processing request:${colors.reset}`, error);
            inProgress--;
            processNext();
          });
      }
    }
    
    processNext();
  });
}

/**
 * Analyze results and generate report
 */
function analyzeResults(results, totalTime) {
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const cached = results.filter(r => r.cached);
  
  // Response time statistics
  const durations = successful.map(r => r.duration);
  durations.sort((a, b) => a - b);
  
  const stats = {
    total: results.length,
    successful: successful.length,
    failed: failed.length,
    cached: cached.length,
    successRate: ((successful.length / results.length) * 100).toFixed(2),
    cacheHitRate: ((cached.length / successful.length) * 100).toFixed(2),
    
    // Response times
    minTime: Math.min(...durations),
    maxTime: Math.max(...durations),
    avgTime: (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(0),
    medianTime: durations[Math.floor(durations.length / 2)],
    p95Time: durations[Math.floor(durations.length * 0.95)],
    p99Time: durations[Math.floor(durations.length * 0.99)],
    
    // Throughput
    totalTime: (totalTime / 1000).toFixed(2),
    requestsPerSecond: (results.length / (totalTime / 1000)).toFixed(2),
    
    // Data sources
    dataSources: {},
    
    // Error breakdown
    errors: {},
  };
  
  // Count data sources
  successful.forEach(r => {
    stats.dataSources[r.dataSource] = (stats.dataSources[r.dataSource] || 0) + 1;
  });
  
  // Count errors
  failed.forEach(r => {
    const errorKey = r.error || `HTTP ${r.status}`;
    stats.errors[errorKey] = (stats.errors[errorKey] || 0) + 1;
  });
  
  return stats;
}

/**
 * Print formatted report
 */
function printReport(stats) {
  console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.blue}           STRESS TEST REPORT${colors.reset}`);
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
  
  // Overall metrics
  console.log(`${colors.cyan}📊 OVERALL METRICS${colors.reset}`);
  console.log(`   Total Requests:     ${stats.total}`);
  console.log(`   ${colors.green}✓${colors.reset} Successful:       ${stats.successful} (${stats.successRate}%)`);
  if (stats.failed > 0) {
    console.log(`   ${colors.red}✗${colors.reset} Failed:           ${stats.failed}`);
  }
  console.log(`   ${colors.yellow}⚡${colors.reset} Cache Hits:       ${stats.cached} (${stats.cacheHitRate}%)`);
  console.log(`   Total Time:         ${stats.totalTime}s`);
  console.log(`   Throughput:         ${stats.requestsPerSecond} req/s\n`);
  
  // Response times
  console.log(`${colors.cyan}⏱️  RESPONSE TIMES${colors.reset}`);
  console.log(`   Min:                ${stats.minTime}ms`);
  console.log(`   Median:             ${stats.medianTime}ms`);
  console.log(`   Average:            ${stats.avgTime}ms`);
  console.log(`   P95:                ${stats.p95Time}ms`);
  console.log(`   P99:                ${stats.p99Time}ms`);
  console.log(`   Max:                ${stats.maxTime}ms\n`);
  
  // Data sources
  if (Object.keys(stats.dataSources).length > 0) {
    console.log(`${colors.cyan}📡 DATA SOURCES${colors.reset}`);
    Object.entries(stats.dataSources).forEach(([source, count]) => {
      const percent = ((count / stats.successful) * 100).toFixed(1);
      console.log(`   ${source.padEnd(15)} ${count.toString().padStart(4)} (${percent}%)`);
    });
    console.log();
  }
  
  // Errors
  if (Object.keys(stats.errors).length > 0) {
    console.log(`${colors.cyan}❌ ERRORS${colors.reset}`);
    Object.entries(stats.errors).forEach(([error, count]) => {
      console.log(`   ${error.padEnd(30)} ${count}`);
    });
    console.log();
  }
  
  // Performance rating
  console.log(`${colors.cyan}🎯 PERFORMANCE RATING${colors.reset}`);
  
  let rating = '';
  let ratingColor = '';
  
  if (stats.successRate >= 99 && stats.avgTime < 1000) {
    rating = 'EXCELLENT ⭐⭐⭐⭐⭐';
    ratingColor = colors.green;
  } else if (stats.successRate >= 95 && stats.avgTime < 2000) {
    rating = 'GOOD ⭐⭐⭐⭐';
    ratingColor = colors.green;
  } else if (stats.successRate >= 90 && stats.avgTime < 5000) {
    rating = 'ACCEPTABLE ⭐⭐⭐';
    ratingColor = colors.yellow;
  } else {
    rating = 'NEEDS IMPROVEMENT ⭐⭐';
    ratingColor = colors.red;
  }
  
  console.log(`   ${ratingColor}${rating}${colors.reset}\n`);
  
  // Recommendations
  console.log(`${colors.cyan}💡 RECOMMENDATIONS${colors.reset}`);
  
  if (stats.cacheHitRate < 10) {
    console.log(`   ${colors.yellow}⚠${colors.reset}  Cache hit rate is low (${stats.cacheHitRate}%). Consider:`);
    console.log(`      - Increasing cache TTL`);
    console.log(`      - Pre-warming frequently accessed addresses`);
  }
  
  if (stats.avgTime > 2000) {
    console.log(`   ${colors.yellow}⚠${colors.reset}  Average response time is high (${stats.avgTime}ms). Consider:`);
    console.log(`      - Implementing request queuing`);
    console.log(`      - Adding rate limiting`);
    console.log(`      - Optimizing API calls to external services`);
  }
  
  if (stats.successRate < 95) {
    console.log(`   ${colors.red}⚠${colors.reset}  Success rate is below 95% (${stats.successRate}%). Investigate:`);
    console.log(`      - Error logs for failure patterns`);
    console.log(`      - External API rate limits`);
    console.log(`      - Server resource constraints`);
  }
  
  if (stats.p99Time > 10000) {
    console.log(`   ${colors.yellow}⚠${colors.reset}  P99 latency is high (${stats.p99Time}ms). Consider:`);
    console.log(`      - Adding timeout limits`);
    console.log(`      - Implementing circuit breakers`);
  }
  
  console.log();
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
}

/**
 * Main test execution
 */
async function main() {
  console.log(`\n${colors.blue}╔════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║       KarmaTrust API Stress Test (1000 reqs)      ║${colors.reset}`);
  console.log(`${colors.blue}╚════════════════════════════════════════════════════╝${colors.reset}\n`);
  
  console.log(`${colors.cyan}Configuration:${colors.reset}`);
  console.log(`  API Base:           ${API_BASE}`);
  console.log(`  Total Requests:     ${TOTAL_REQUESTS}`);
  console.log(`  Concurrency:        ${CONCURRENCY}`);
  console.log(`  Test Strategy:      10% real addresses (cache), 90% random\n`);
  
  // Check if API is running
  console.log(`${colors.yellow}Checking API health...${colors.reset}`);
  try {
    const healthResponse = await fetch(`${API_BASE}/api/health`);
    if (!healthResponse.ok) {
      throw new Error(`API health check failed: ${healthResponse.status}`);
    }
    console.log(`${colors.green}✓ API is running${colors.reset}\n`);
  } catch (error) {
    console.error(`${colors.red}✗ API is not reachable:${colors.reset}`, error.message);
    console.log(`\n${colors.yellow}Make sure the backend is running:${colors.reset}`);
    console.log(`  cd backend && npm run dev\n`);
    process.exit(1);
  }
  
  // Generate test addresses
  console.log(`${colors.yellow}Generating ${TOTAL_REQUESTS} test addresses...${colors.reset}`);
  const addresses = generateTestAddresses(TOTAL_REQUESTS);
  console.log(`${colors.green}✓ Addresses generated${colors.reset}\n`);
  
  // Run stress test
  console.log(`${colors.yellow}Running stress test...${colors.reset}`);
  const startTime = Date.now();
  
  const results = await runConcurrentRequests(addresses, CONCURRENCY);
  
  const totalTime = Date.now() - startTime;
  
  // Analyze and report
  const stats = analyzeResults(results, totalTime);
  printReport(stats);
  
  // Exit with appropriate code
  process.exit(stats.successRate >= 95 ? 0 : 1);
}

// Run the test
main().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
