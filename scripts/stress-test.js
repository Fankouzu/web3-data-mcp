#!/usr/bin/env node

/**
 * 压力测试脚本 - 测试系统在高并发下的表现
 */

require('dotenv').config();
const McpServer = require('../src/core/McpServer');

// 测试配置
const config = {
  concurrency: 10,      // 并发数
  duration: 30,         // 测试持续时间（秒）
  warmupTime: 5,        // 预热时间（秒）
  reportInterval: 5     // 报告间隔（秒）
};

// 测试查询池
const queryPool = [
  // 英文查询
  'search ethereum defi projects',
  'find layer 2 solutions',
  'get Uniswap project details',
  'search NFT marketplaces',
  'find GameFi projects',
  'check my credits',
  'search Solana ecosystem',
  'find DeFi protocols on Polygon',
  
  // 中文查询
  '搜索以太坊项目',
  '查找DeFi协议',
  '获取项目详情',
  '查看积分余额',
  
  // 复杂查询
  'find projects similar to Uniswap',
  'search for decentralized exchanges on ethereum',
  'get funding information for Aave',
  'find all projects by Paradigm'
];

// 统计数据
const stats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  totalTime: 0,
  minTime: Infinity,
  maxTime: 0,
  errors: {},
  requestTimes: []
};

// 运行单个请求
async function runRequest(server, query) {
  const start = Date.now();
  
  try {
    await server.toolRouter.routeQuery(query, { 
      dryRun: true,  // 不执行实际API调用，只测试路由
      requestId: `stress-${stats.totalRequests}`
    });
    
    const duration = Date.now() - start;
    stats.successfulRequests++;
    stats.totalTime += duration;
    stats.minTime = Math.min(stats.minTime, duration);
    stats.maxTime = Math.max(stats.maxTime, duration);
    stats.requestTimes.push(duration);
    
    return { success: true, duration };
  } catch (error) {
    const duration = Date.now() - start;
    stats.failedRequests++;
    
    const errorKey = error.message || 'Unknown error';
    stats.errors[errorKey] = (stats.errors[errorKey] || 0) + 1;
    
    return { success: false, duration, error: errorKey };
  } finally {
    stats.totalRequests++;
  }
}

// 运行并发请求
async function runConcurrentRequests(server, concurrency) {
  const promises = [];
  
  for (let i = 0; i < concurrency; i++) {
    // 随机选择查询
    const query = queryPool[Math.floor(Math.random() * queryPool.length)];
    promises.push(runRequest(server, query));
  }
  
  return Promise.all(promises);
}

// 计算百分位数
function calculatePercentile(arr, percentile) {
  const sorted = arr.sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[index] || 0;
}

// 生成报告
function generateReport(elapsed) {
  const avgTime = stats.totalRequests > 0 ? stats.totalTime / stats.totalRequests : 0;
  const successRate = stats.totalRequests > 0 ? (stats.successfulRequests / stats.totalRequests) * 100 : 0;
  const throughput = elapsed > 0 ? (stats.totalRequests / elapsed) * 1000 : 0;
  
  console.error('\n=== 压力测试报告 ===');
  console.error(`运行时间: ${(elapsed / 1000).toFixed(1)}秒`);
  console.error(`总请求数: ${stats.totalRequests}`);
  console.error(`成功请求: ${stats.successfulRequests}`);
  console.error(`失败请求: ${stats.failedRequests}`);
  console.error(`成功率: ${successRate.toFixed(2)}%`);
  console.error(`吞吐量: ${throughput.toFixed(2)} req/s`);
  
  if (stats.requestTimes.length > 0) {
    console.error('\n响应时间统计:');
    console.error(`  平均: ${avgTime.toFixed(2)}ms`);
    console.error(`  最小: ${stats.minTime}ms`);
    console.error(`  最大: ${stats.maxTime}ms`);
    console.error(`  P50: ${calculatePercentile(stats.requestTimes, 50)}ms`);
    console.error(`  P90: ${calculatePercentile(stats.requestTimes, 90)}ms`);
    console.error(`  P95: ${calculatePercentile(stats.requestTimes, 95)}ms`);
    console.error(`  P99: ${calculatePercentile(stats.requestTimes, 99)}ms`);
  }
  
  if (Object.keys(stats.errors).length > 0) {
    console.error('\n错误统计:');
    Object.entries(stats.errors)
      .sort((a, b) => b[1] - a[1])
      .forEach(([error, count]) => {
        console.error(`  ${error}: ${count}次`);
      });
  }
}

// 主测试函数
async function runStressTest() {
  console.error('=== 压力测试开始 ===');
  console.error(`配置: ${config.concurrency}并发, ${config.duration}秒持续时间\n`);
  
  try {
    // 初始化服务器
    console.error('初始化服务器...');
    const server = new McpServer({
      name: 'web3-data-mcp-stress',
      version: '1.0.0'
    });
    
    await server.initialize({
      rootdata: {
        apiKey: process.env.ROOTDATA_API_KEY || 'test-key',
        baseUrl: 'https://api.rootdata.com',
        cacheEnabled: true
      }
    });
    
    console.error('✅ 服务器初始化完成');
    
    // 预热阶段
    console.error(`\n开始预热 (${config.warmupTime}秒)...`);
    const warmupEnd = Date.now() + (config.warmupTime * 1000);
    
    while (Date.now() < warmupEnd) {
      await runConcurrentRequests(server, Math.min(5, config.concurrency));
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // 重置统计
    Object.assign(stats, {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalTime: 0,
      minTime: Infinity,
      maxTime: 0,
      errors: {},
      requestTimes: []
    });
    
    console.error('✅ 预热完成，开始正式测试...\n');
    
    // 主测试循环
    const testStart = Date.now();
    const testEnd = testStart + (config.duration * 1000);
    let lastReportTime = testStart;
    
    while (Date.now() < testEnd) {
      // 运行并发请求
      await runConcurrentRequests(server, config.concurrency);
      
      // 定期报告
      const now = Date.now();
      if (now - lastReportTime >= config.reportInterval * 1000) {
        const elapsed = now - testStart;
        console.error(`\n[${(elapsed / 1000).toFixed(0)}s] 中间报告:`);
        console.error(`  请求数: ${stats.totalRequests}`);
        console.error(`  成功率: ${((stats.successfulRequests / stats.totalRequests) * 100).toFixed(2)}%`);
        console.error(`  平均响应: ${(stats.totalTime / stats.totalRequests).toFixed(2)}ms`);
        lastReportTime = now;
      }
      
      // 短暂延迟避免过度压力
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    // 生成最终报告
    const totalElapsed = Date.now() - testStart;
    generateReport(totalElapsed);
    
    // 系统健康检查
    console.error('\n系统健康检查:');
    const promptStats = server.promptManager.getStats();
    console.error(`  提示词缓存: ${promptStats.cacheSize} 条`);
    console.error(`  缓存命中率: ${promptStats.cacheHitRate}`);
    
    // 性能评估
    console.error('\n性能评估:');
    const avgResponseTime = stats.totalTime / stats.totalRequests;
    if (avgResponseTime < 50) {
      console.error('  ✅ 响应时间: 优秀');
    } else if (avgResponseTime < 100) {
      console.error('  ⚠️ 响应时间: 良好');
    } else {
      console.error('  ❌ 响应时间: 需要优化');
    }
    
    if (stats.successfulRequests / stats.totalRequests > 0.99) {
      console.error('  ✅ 稳定性: 优秀');
    } else if (stats.successfulRequests / stats.totalRequests > 0.95) {
      console.error('  ⚠️ 稳定性: 良好');
    } else {
      console.error('  ❌ 稳定性: 需要改进');
    }
    
    console.error('\n✅ 压力测试完成!');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
  
  process.exit(0);
}

// 运行测试
runStressTest(); 