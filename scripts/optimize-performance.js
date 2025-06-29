#!/usr/bin/env node

/**
 * 性能优化脚本 - 实施缓存预热和查询优化
 */

require('dotenv').config();
const McpServer = require('../src/core/McpServer');
const fs = require('fs');
const path = require('path');

// 常见查询模式（用于预热）
const commonQueries = [
  // 搜索查询
  'search ethereum projects',
  'find defi protocols',
  'search web3 games',
  'find layer2 solutions',
  
  // 项目查询
  'get project details',
  'show Uniswap information',
  'Aave project details',
  
  // 代币查询
  'UNI token info',
  'ETH price',
  
  // 积分查询
  'check credits',
  'remaining balance',
  
  // 中文查询
  '搜索DeFi项目',
  '查找以太坊生态',
  '获取项目详情'
];

// 常见项目名称（用于缓存）
const commonProjects = [
  'Uniswap', 'Aave', 'Compound', 'MakerDAO', 'Chainlink',
  'SushiSwap', 'Curve', 'Balancer', 'Synthetix', 'Yearn Finance'
];

async function optimizePerformance() {
  console.error('=== 性能优化脚本 ===');
  console.error(`开始时间: ${new Date().toISOString()}\n`);
  
  try {
    // 1. 初始化服务器
    console.error('1. 初始化服务器...');
    const server = new McpServer({
      name: 'web3-data-mcp-optimize',
      version: '1.0.0',
      prompts: {
        defaultLanguage: 'en',
        cacheEnabled: true,
        cacheTTL: 7200000 // 2小时缓存
      }
    });
    
    await server.initialize({
      rootdata: {
        apiKey: process.env.ROOTDATA_API_KEY || 'test-key',
        baseUrl: 'https://api.rootdata.com',
        cacheEnabled: true,
        cacheTTL: 3600000 // 1小时API缓存
      }
    });
    
    console.error('✅ 服务器初始化完成');
    
    // 2. 缓存预热 - 提示词
    console.error('\n2. 预热提示词缓存...');
    const warmupStart = Date.now();
    
    // 预加载所有工具的提示词
    const tools = server.toolRouter.getAvailableTools();
    for (const tool of tools) {
      // 加载各种类型的提示词
      server.promptManager.getToolPrompt(tool.name, 'system', { language: 'en' });
      server.promptManager.getToolPrompt(tool.name, 'system', { language: 'zh' });
      server.promptManager.getToolPrompt(tool.name, 'usage', { language: 'en' });
      server.promptManager.getToolPrompt(tool.name, 'usage', { language: 'zh' });
    }
    
    // 预加载路由提示词
    const routingTypes = ['intent_analysis', 'entity_extraction', 'param_building', 'route_selection'];
    routingTypes.forEach(type => {
      server.promptManager.getRoutingPrompt(type, { language: 'en' });
      server.promptManager.getRoutingPrompt(type, { language: 'zh' });
    });
    
    const warmupTime = Date.now() - warmupStart;
    console.error(`✅ 提示词预热完成 (耗时: ${warmupTime}ms)`);
    
    // 3. 缓存预热 - 常见查询
    console.error('\n3. 预热查询缓存...');
    const queryWarmupStart = Date.now();
    let warmupCount = 0;
    
    for (const query of commonQueries) {
      try {
        // 只进行路由分析，不执行实际API调用
        const routeResult = await server.toolRouter.routeQuery(query, {
          dryRun: true // 不执行实际API调用
        });
        warmupCount++;
      } catch (e) {
        // 忽略错误，继续预热
      }
    }
    
    const queryWarmupTime = Date.now() - queryWarmupStart;
    console.error(`✅ 查询预热完成 (${warmupCount}/${commonQueries.length} 成功, 耗时: ${queryWarmupTime}ms)`);
    
    // 4. 优化配置验证
    console.error('\n4. 验证优化配置...');
    const stats = server.promptManager.getStats();
    console.error('缓存统计:');
    console.error(`  - 缓存大小: ${stats.cacheSize}`);
    console.error(`  - 命中率: ${stats.cacheHitRate}`);
    console.error(`  - 加载的提示词: ${stats.promptsLoaded}`);
    
    // 5. 性能基准测试
    console.error('\n5. 运行性能基准测试...');
    const benchmarkQueries = [
      'search ethereum defi projects',
      'get project details for Uniswap',
      'check my credits'
    ];
    
    const benchmarkResults = [];
    
    for (const query of benchmarkQueries) {
      const times = [];
      const iterations = 10;
      
      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        try {
          await server.toolRouter.routeQuery(query, { dryRun: true });
          times.push(Date.now() - start);
        } catch (e) {
          // 忽略错误
        }
      }
      
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      
      benchmarkResults.push({
        query,
        avgTime: avgTime.toFixed(2),
        minTime,
        maxTime
      });
    }
    
    console.error('\n基准测试结果:');
    benchmarkResults.forEach(result => {
      console.error(`  "${result.query}"`);
      console.error(`    平均: ${result.avgTime}ms, 最小: ${result.minTime}ms, 最大: ${result.maxTime}ms`);
    });
    
    // 6. 生成优化建议
    console.error('\n6. 优化建议:');
    
    // 检查缓存命中率
    const cacheHitRate = parseFloat(stats.cacheHitRate);
    if (cacheHitRate < 70) {
      console.error('  ⚠️ 缓存命中率较低，建议增加缓存TTL或预热更多查询');
    } else {
      console.error('  ✅ 缓存命中率良好');
    }
    
    // 检查平均响应时间
    const avgResponseTime = benchmarkResults.reduce((sum, r) => sum + parseFloat(r.avgTime), 0) / benchmarkResults.length;
    if (avgResponseTime > 50) {
      console.error('  ⚠️ 平均响应时间较高，建议优化查询逻辑');
    } else {
      console.error('  ✅ 响应时间优秀');
    }
    
    // 7. 保存优化报告
    const report = {
      timestamp: new Date().toISOString(),
      warmup: {
        promptsWarmedUp: stats.promptsLoaded,
        queriesWarmedUp: warmupCount,
        totalWarmupTime: warmupTime + queryWarmupTime
      },
      performance: {
        cacheStats: stats,
        benchmarkResults,
        avgResponseTime: avgResponseTime.toFixed(2)
      },
      recommendations: []
    };
    
    if (cacheHitRate < 70) {
      report.recommendations.push('增加缓存TTL时间');
      report.recommendations.push('预热更多常见查询');
    }
    
    if (avgResponseTime > 50) {
      report.recommendations.push('优化查询路由逻辑');
      report.recommendations.push('考虑使用批处理');
    }
    
    const reportPath = path.join(__dirname, '../logs', `optimization-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.error(`\n✅ 优化报告已保存: ${reportPath}`);
    
    console.error('\n✅ 性能优化完成!');
    
  } catch (error) {
    console.error('\n❌ 优化失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
  
  process.exit(0);
}

// 运行优化
optimizePerformance(); 