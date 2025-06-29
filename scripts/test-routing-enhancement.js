#!/usr/bin/env node

/**
 * 测试路由层提示词增强功能
 */

require('dotenv').config();
const McpServer = require('../src/core/McpServer');

async function testRoutingEnhancement() {
  console.error('=== Testing Routing Layer Enhancement ===');
  console.error('Start time:', new Date().toISOString());
  
  try {
    // 1. 创建并初始化服务器
    console.error('\n1. Initializing server...');
    const server = new McpServer({
      name: 'web3-data-mcp-test',
      version: '1.0.0',
      prompts: {
        defaultLanguage: 'en',
        cacheEnabled: true
      }
    });
    
    const providerConfigs = {
      rootdata: {
        apiKey: process.env.ROOTDATA_API_KEY,
        baseUrl: process.env.ROOTDATA_BASE_URL || 'https://api.rootdata.com',
        cacheEnabled: false
      }
    };
    
    await server.initialize(providerConfigs);
    console.error('✅ Server initialized');
    
    // 2. 测试意图分析增强
    console.error('\n2. Testing enhanced intent analysis...');
    const testQueries = [
      'search for Uniswap',
      'get project details for 11646',
      'project id: 11646',
      '查找 DeFi 项目',
      'check my credits balance',
      'uni token info',
      '@Uniswap'
    ];
    
    for (const query of testQueries) {
      console.error(`\nQuery: "${query}"`);
      const intent = server.toolRouter._analyzeIntent(query);
      console.error(`Intent: ${intent.type} (confidence: ${intent.confidence.toFixed(2)})`);
      console.error(`Keywords: ${intent.keywords.join(', ')}`);
    }
    
    // 3. 测试实体提取增强
    console.error('\n3. Testing enhanced entity extraction...');
    const entityTestQueries = [
      'Uniswap project details',
      '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
      'project 11646',
      '@Uniswap twitter',
      'uni token',
      'Ethereum DeFi ecosystem'
    ];
    
    for (const query of entityTestQueries) {
      console.error(`\nQuery: "${query}"`);
      const entities = server.toolRouter._extractEntities(query);
      console.error(`Entities found: ${entities.length}`);
      entities.forEach(entity => {
        console.error(`  - ${entity.type}: ${entity.value} (confidence: ${entity.confidence}, source: ${entity.source})`);
      });
    }
    
    // 4. 测试路由选择增强
    console.error('\n4. Testing enhanced route selection...');
    const routeTestCases = [
      { query: 'search for uni', expectedTool: 'search_web3_entities' },
      { query: 'project 11646 details', expectedTool: 'get_project_details' },
      { query: 'check credits', expectedTool: 'check_credits' }
    ];
    
    for (const testCase of routeTestCases) {
      console.error(`\nQuery: "${testCase.query}"`);
      const intent = server.toolRouter._analyzeIntent(testCase.query);
      const entities = server.toolRouter._extractEntities(testCase.query);
      const route = server.toolRouter._selectBestRoute(intent, entities, {});
      
      if (route) {
        console.error(`Selected tool: ${route.tool}`);
        console.error(`Score: ${route.score.toFixed(2)}`);
        console.error(`Reasoning: ${route.reasoning}`);
        console.error(`Expected: ${testCase.expectedTool}`);
        console.error(`Match: ${route.tool === testCase.expectedTool ? '✅' : '❌'}`);
      } else {
        console.error('❌ No route found');
      }
    }
    
    // 5. 测试参数构建增强
    console.error('\n5. Testing enhanced parameter building...');
    const paramTestCases = [
      {
        toolName: 'search_web3_entities',
        query: 'uni protocol',
        entities: [{ type: 'PROJECT', value: 'Uniswap' }]
      },
      {
        toolName: 'get_project_details',
        query: 'project 11646 with team info',
        entities: [{ type: 'NUMBER', value: '11646' }]
      }
    ];
    
    for (const testCase of paramTestCases) {
      console.error(`\nTool: ${testCase.toolName}`);
      console.error(`Query: "${testCase.query}"`);
      const params = server.toolRouter._buildApiParams(
        testCase.toolName,
        testCase.query,
        testCase.entities,
        'en',
        {}
      );
      console.error('Built parameters:', JSON.stringify(params, null, 2));
    }
    
    // 6. 测试查询优化
    console.error('\n6. Testing query optimization...');
    const optimizationTests = [
      'uni',
      'comp lending',
      'defi projects',
      'ethereum gamefi'
    ];
    
    for (const query of optimizationTests) {
      const optimized = server.toolRouter._optimizeSearchQuery(query, []);
      console.error(`"${query}" → "${optimized}"`);
    }
    
    // 7. 测试完整路由流程
    console.error('\n7. Testing complete routing flow...');
    const fullTestQuery = 'get details for Uniswap project';
    console.error(`Full test query: "${fullTestQuery}"`);
    
    const result = await server.toolRouter.routeQuery(fullTestQuery, {
      includeDetails: true,
      requestId: 'test-001'
    });
    
    console.error('\nRouting result:');
    console.error(`Success: ${result.success ? '✅' : '❌'}`);
    console.error(`Provider: ${result.provider}`);
    console.error(`Tool: ${result.tool}`);
    console.error(`Intent: ${result.intent.type} (${result.intent.confidence.toFixed(2)})`);
    console.error(`Entities: ${result.entities.length}`);
    console.error(`Language: ${result.language}`);
    if (!result.success) {
      console.error(`Error: ${result.error}`);
    }
    
    // 8. 检查提示词集成
    console.error('\n8. Checking prompt integration...');
    const promptStats = server.promptManager.getStats();
    console.error('Prompt Manager Stats after routing tests:');
    console.error(JSON.stringify(promptStats, null, 2));
    
    // 9. 路由统计
    console.error('\n9. Routing statistics...');
    const routingStats = server.toolRouter.getRoutingStats();
    console.error(JSON.stringify(routingStats, null, 2));
    
    console.error('\n✅ All routing enhancement tests completed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
  
  process.exit(0);
}

// 运行测试
testRoutingEnhancement().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
}); 