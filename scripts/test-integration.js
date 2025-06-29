#!/usr/bin/env node

/**
 * 系统集成测试 - 测试完整的提示词增强流程
 */

require('dotenv').config();
const McpServer = require('../src/core/McpServer');

// 测试用例定义
const testCases = [
  {
    name: 'Search Projects',
    query: 'find defi projects on ethereum',
    expectedIntent: 'search',
    expectedTool: 'search_web3_entities',
    checkResponse: (response) => {
      const data = JSON.parse(response);
      return data.interpretation && data.suggestions && data.dataQuality;
    }
  },
  {
    name: 'Get Project Details',
    query: 'show me details about project 11646',
    expectedIntent: 'project_details',
    expectedTool: 'get_project_details',
    checkResponse: (response) => {
      const data = JSON.parse(response);
      return data.interpretation && data.dataQuality;
    }
  },
  {
    name: 'Check Credits',
    query: 'how many credits do I have left',
    expectedIntent: 'credits_check',  // 修正为实际的 intent 类型
    expectedTool: 'check_credits',
    checkResponse: (response) => {
      const data = JSON.parse(response);
      return data.success && data.data;
    }
  },
  {
    name: 'Search with Abbreviation',
    query: 'find btc ecosystem projects',
    expectedIntent: 'search',
    expectedTool: 'search_web3_entities',
    checkResponse: (response) => {
      const data = JSON.parse(response);
      // 检查基本响应结构
      return data.success && data.interpretation && data.suggestions;
    }
  },
  {
    name: 'Empty Result Handling',
    query: 'find NonExistentProjectXYZ123',
    expectedIntent: 'search',
    expectedTool: 'search_web3_entities',
    checkResponse: (response) => {
      const data = JSON.parse(response);
      // 检查空结果帮助
      return data.emptyResultHelp && data.emptyResultHelp.suggestions;
    }
  }
];

async function runIntegrationTest() {
  console.error('=== System Integration Test ===');
  console.error(`Start time: ${new Date().toISOString()}\n`);
  
  let passedTests = 0;
  let failedTests = 0;
  
  try {
    // 初始化服务器
    console.error('Initializing server...');
    const server = new McpServer({
      name: 'web3-data-mcp-test',
      version: '1.0.0'
    });
    
    await server.initialize({
      rootdata: {
        apiKey: process.env.ROOTDATA_API_KEY || 'test-key',
        baseUrl: 'https://api.rootdata.com',
        cacheEnabled: false
      }
    });
    
    console.error('✅ Server initialized\n');
    
    // 运行测试用例
    for (const testCase of testCases) {
      console.error(`\n📋 Test: ${testCase.name}`);
      console.error(`   Query: "${testCase.query}"`);
      
      try {
        // 1. 路由分析
        const routeResult = await server.toolRouter.routeQuery(testCase.query);
        console.error(`   Intent: ${routeResult.intent.type} (confidence: ${routeResult.intent.confidence})`);
        console.error(`   Tool: ${routeResult.tool}`);
        console.error(`   Entities: ${routeResult.entities.map(e => `${e.type}:${e.value}`).join(', ')}`);
        
        // 验证意图
        if (routeResult.intent.type !== testCase.expectedIntent) {
          throw new Error(`Expected intent: ${testCase.expectedIntent}, got: ${routeResult.intent.type}`);
        }
        
        // 验证工具选择
        if (routeResult.tool !== testCase.expectedTool) {
          throw new Error(`Expected tool: ${testCase.expectedTool}, got: ${routeResult.tool}`);
        }
        
        // 2. 模拟工具响应
        const mockResponse = createMockResponse(testCase, routeResult);
        
        // 3. 格式化响应
        const formattedResponse = server._formatToolResponse(mockResponse);
        console.error(`   Response enhanced: ${testCase.checkResponse(formattedResponse) ? '✅' : '❌'}`);
        
        if (!testCase.checkResponse(formattedResponse)) {
          throw new Error('Response check failed');
        }
        
        console.error(`   ✅ Test passed`);
        passedTests++;
        
      } catch (error) {
        console.error(`   ❌ Test failed: ${error.message}`);
        failedTests++;
      }
    }
    
    // 性能测试
    console.error('\n\n📊 Performance Test');
    const startTime = Date.now();
    const iterations = 100;
    
    for (let i = 0; i < iterations; i++) {
      await server.toolRouter.routeQuery('find ethereum defi projects');
    }
    
    const avgTime = (Date.now() - startTime) / iterations;
    console.error(`   Average routing time: ${avgTime.toFixed(2)}ms`);
    console.error(`   Performance: ${avgTime < 50 ? '✅ Good' : avgTime < 100 ? '⚠️ Acceptable' : '❌ Needs optimization'}`);
    
    // 缓存统计
    console.error('\n\n💾 Cache Statistics');
    const stats = server.promptManager.getStats();
    console.error(`   Cache size: ${stats.cacheSize}`);
    console.error(`   Cache hits: ${stats.hits}`);
    console.error(`   Cache misses: ${stats.misses}`);
    console.error(`   Hit rate: ${stats.cacheHitRate}`);
    
    // 最终结果
    console.error('\n\n=== Test Summary ===');
    console.error(`Total tests: ${testCases.length}`);
    console.error(`Passed: ${passedTests} ✅`);
    console.error(`Failed: ${failedTests} ❌`);
    console.error(`Success rate: ${((passedTests / testCases.length) * 100).toFixed(2)}%`);
    
    if (failedTests === 0) {
      console.error('\n🎉 All integration tests passed!');
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
  
  process.exit(failedTests > 0 ? 1 : 0);
}

// 创建模拟响应
function createMockResponse(testCase, routeResult) {
  const baseResponse = {
    success: true,
    provider: 'rootdata',
    tool: routeResult.tool,
    intent: routeResult.intent,
    entities: routeResult.entities,
    language: 'en',
    query: routeResult.params ? routeResult.params.query || '' : testCase.query
  };
  
  // 根据测试用例返回不同的模拟数据
  switch (testCase.name) {
    case 'Search Projects':
      return {
        ...baseResponse,
        data: [
          { id: 1, name: 'Uniswap', type: 'DEX', ecosystem: 'Ethereum' },
          { id: 2, name: 'Aave', type: 'Lending', ecosystem: 'Ethereum' }
        ]
      };
    
    case 'Get Project Details':
      return {
        ...baseResponse,
        data: {
          id: 11646,
          name: 'Sample Project',
          description: 'A test project',
          marketCap: 1000000000,
          ecosystem: 'Ethereum'
        }
      };
    
    case 'Check Credits':
      return {
        ...baseResponse,
        data: { remaining: 1990, used: 10, total: 2000 }
      };
    
    case 'Empty Result Handling':
      return {
        ...baseResponse,
        data: []
      };
    
    default:
      return {
        ...baseResponse,
        data: []
      };
  }
}

// 运行测试
runIntegrationTest(); 