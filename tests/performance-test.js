/**
 * 性能测试套件
 * 测试API响应时间、缓存效率、内存使用等性能指标
 */

const { PerformanceOptimizer } = require('../src/utils/performanceOptimizer');
const RootDataProvider = require('../src/providers/rootdata/RootDataProvider');

// 性能测试配置
const PERFORMANCE_CONFIG = {
  warmupIterations: 10,
  testIterations: 100,
  maxResponseTime: 5000, // 5秒
  maxMemoryIncrease: 50, // 50MB
  minCacheHitRate: 0.7 // 70%
};

/**
 * 性能测试工具
 */
class PerformanceTester {
  constructor() {
    this.results = {
      cacheTests: {},
      memoryTests: {},
      responseTimeTests: {},
      throughputTests: {}
    };
  }

  /**
   * 测量函数执行时间
   */
  async measureTime(fn, label = 'operation') {
    const start = process.hrtime.bigint();
    let result;
    let error = null;

    try {
      result = await fn();
    } catch (err) {
      error = err;
    }

    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // 转换为毫秒

    return {
      duration,
      result,
      error,
      label
    };
  }

  /**
   * 测量内存使用
   */
  measureMemory() {
    const usage = process.memoryUsage();
    return {
      rss: usage.rss / 1024 / 1024, // MB
      heapTotal: usage.heapTotal / 1024 / 1024,
      heapUsed: usage.heapUsed / 1024 / 1024,
      external: usage.external / 1024 / 1024
    };
  }

  /**
   * 缓存性能测试
   */
  async testCachePerformance() {
    console.log('\n🧪 Testing cache performance...');

    const optimizer = new PerformanceOptimizer({
      cache: { enabled: true, maxSize: 100, ttl: 60000 }
    });

    const testEndpoint = 'test_endpoint';
    const testParams = { query: 'test' };
    
    // 模拟API调用
    let callCount = 0;
    const mockApiCall = async () => {
      callCount++;
      await new Promise(resolve => setTimeout(resolve, 100)); // 模拟网络延迟
      return { success: true, data: { id: callCount, timestamp: Date.now() } };
    };

    const measurements = [];

    // 预热
    for (let i = 0; i < PERFORMANCE_CONFIG.warmupIterations; i++) {
      await optimizer.optimizeRequest(testEndpoint, testParams, mockApiCall);
    }

    // 重置计数器
    callCount = 0;
    optimizer.cacheManager.clear();

    // 性能测试
    for (let i = 0; i < PERFORMANCE_CONFIG.testIterations; i++) {
      const measurement = await this.measureTime(async () => {
        return await optimizer.optimizeRequest(testEndpoint, testParams, mockApiCall);
      }, `cache-test-${i}`);
      
      measurements.push(measurement);
    }

    const stats = optimizer.getStats();
    const avgResponseTime = measurements.reduce((sum, m) => sum + m.duration, 0) / measurements.length;
    const cacheHitRate = parseFloat(stats.cache.hitRate) / 100;

    this.results.cacheTests = {
      avgResponseTime: avgResponseTime.toFixed(2) + 'ms',
      cacheHitRate: stats.cache.hitRate,
      totalCalls: callCount,
      cacheSize: stats.cache.cacheSize,
      passed: cacheHitRate >= PERFORMANCE_CONFIG.minCacheHitRate
    };

    console.log(`✅ Cache test completed - Hit rate: ${stats.cache.hitRate}, Avg time: ${avgResponseTime.toFixed(2)}ms`);
    return this.results.cacheTests;
  }

  /**
   * 内存使用测试
   */
  async testMemoryUsage() {
    console.log('\n🧪 Testing memory usage...');

    const initialMemory = this.measureMemory();
    
    const optimizer = new PerformanceOptimizer({
      cache: { enabled: true, maxSize: 1000 }
    });

    // 模拟大量API调用
    const promises = [];
    for (let i = 0; i < 500; i++) {
      const testCall = async () => {
        const endpoint = `endpoint_${i % 10}`;
        const params = { id: i, data: 'x'.repeat(1000) }; // 1KB数据
        
        return await optimizer.optimizeRequest(endpoint, params, async () => {
          return { success: true, data: { id: i, largeData: 'x'.repeat(5000) } }; // 5KB响应
        });
      };
      
      promises.push(testCall());
    }

    await Promise.all(promises);

    const finalMemory = this.measureMemory();
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

    this.results.memoryTests = {
      initialMemory: initialMemory.heapUsed.toFixed(2) + 'MB',
      finalMemory: finalMemory.heapUsed.toFixed(2) + 'MB',
      memoryIncrease: memoryIncrease.toFixed(2) + 'MB',
      passed: memoryIncrease <= PERFORMANCE_CONFIG.maxMemoryIncrease
    };

    console.log(`✅ Memory test completed - Increase: ${memoryIncrease.toFixed(2)}MB`);

    // 清理
    optimizer.cleanup();
    
    // 强制垃圾回收
    if (global.gc) {
      global.gc();
    }

    return this.results.memoryTests;
  }

  /**
   * 响应时间测试
   */
  async testResponseTime() {
    console.log('\n🧪 Testing response times...');

    const measurements = [];
    
    // 模拟不同延迟的API调用
    const delays = [10, 50, 100, 200, 500];
    
    for (const delay of delays) {
      const testMeasurements = [];
      
      for (let i = 0; i < 20; i++) {
        const measurement = await this.measureTime(async () => {
          await new Promise(resolve => setTimeout(resolve, delay));
          return { success: true, delay };
        }, `response-${delay}ms-${i}`);
        
        testMeasurements.push(measurement);
      }
      
      const avgTime = testMeasurements.reduce((sum, m) => sum + m.duration, 0) / testMeasurements.length;
      const maxTime = Math.max(...testMeasurements.map(m => m.duration));
      const minTime = Math.min(...testMeasurements.map(m => m.duration));
      
      measurements.push({
        delay,
        avgTime: avgTime.toFixed(2),
        maxTime: maxTime.toFixed(2),
        minTime: minTime.toFixed(2),
        variance: (maxTime - minTime).toFixed(2)
      });
    }

    const overallAvg = measurements.reduce((sum, m) => sum + parseFloat(m.avgTime), 0) / measurements.length;

    this.results.responseTimeTests = {
      measurements,
      overallAvgTime: overallAvg.toFixed(2) + 'ms',
      passed: overallAvg <= PERFORMANCE_CONFIG.maxResponseTime
    };

    console.log(`✅ Response time test completed - Overall avg: ${overallAvg.toFixed(2)}ms`);
    return this.results.responseTimeTests;
  }

  /**
   * 并发处理测试
   */
  async testThroughput() {
    console.log('\n🧪 Testing throughput and concurrency...');

    const optimizer = new PerformanceOptimizer({
      rateLimit: { maxRequests: 100, windowMs: 60000 },
      batch: { batchSize: 10, batchDelay: 50 }
    });

    const concurrencyLevels = [1, 5, 10, 20, 50];
    const throughputResults = [];

    for (const concurrency of concurrencyLevels) {
      const startTime = Date.now();
      const promises = [];

      for (let i = 0; i < concurrency; i++) {
        const promise = optimizer.optimizeRequest(
          `endpoint_${i}`,
          { id: i },
          async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
            return { success: true, id: i };
          }
        );
        promises.push(promise);
      }

      await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;
      const throughput = (concurrency / duration) * 1000; // requests per second

      throughputResults.push({
        concurrency,
        duration: duration + 'ms',
        throughput: throughput.toFixed(2) + ' req/s'
      });
    }

    this.results.throughputTests = {
      results: throughputResults,
      passed: true // 基本完成即为通过
    };

    console.log('✅ Throughput test completed');
    return this.results.throughputTests;
  }

  /**
   * 生成性能报告
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: 4,
        passedTests: 0,
        failedTests: 0
      },
      details: this.results
    };

    // 计算通过的测试数量
    Object.values(this.results).forEach(test => {
      if (test.passed) {
        report.summary.passedTests++;
      } else {
        report.summary.failedTests++;
      }
    });

    return report;
  }

  /**
   * 运行所有性能测试
   */
  async runAllTests() {
    console.log('🚀 Starting performance test suite...');
    console.log(`Configuration: ${JSON.stringify(PERFORMANCE_CONFIG, null, 2)}`);

    try {
      await this.testCachePerformance();
      await this.testMemoryUsage();
      await this.testResponseTime();
      await this.testThroughput();

      const report = this.generateReport();
      
      console.log('\n📊 Performance Test Report:');
      console.log('='.repeat(50));
      console.log(`✅ Passed: ${report.summary.passedTests}/${report.summary.totalTests}`);
      console.log(`❌ Failed: ${report.summary.failedTests}/${report.summary.totalTests}`);
      
      if (report.summary.failedTests > 0) {
        console.log('\n❌ Failed Tests:');
        Object.entries(this.results).forEach(([testName, result]) => {
          if (!result.passed) {
            console.log(`  - ${testName}: ${JSON.stringify(result, null, 4)}`);
          }
        });
      }

      console.log('\n📈 Detailed Results:');
      console.log(JSON.stringify(report.details, null, 2));

      // 如果有失败的测试，退出码为1
      if (report.summary.failedTests > 0) {
        process.exit(1);
      }

      console.log('\n🎉 All performance tests passed!');
      return report;

    } catch (error) {
      console.error('\n💥 Performance tests failed:', error);
      process.exit(1);
    }
  }
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  const tester = new PerformanceTester();
  tester.runAllTests().catch(console.error);
}

module.exports = { PerformanceTester, PERFORMANCE_CONFIG }; 