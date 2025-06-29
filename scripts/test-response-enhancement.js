#!/usr/bin/env node

/**
 * 测试响应优化功能
 */

require('dotenv').config();
const McpServer = require('../src/core/McpServer');
const { ErrorTypes } = require('../src/core/ErrorHandler');

async function testResponseEnhancement() {
  console.error('=== Testing Response Enhancement ===');
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
    
    // 2. 测试成功响应格式化
    console.error('\n2. Testing successful response formatting...');
    
    // 模拟成功的搜索结果
    const searchResult = {
      success: true,
      provider: 'rootdata',
      tool: 'search_web3_entities',
      data: [
        { id: 1, name: 'Uniswap', type: 'DEX', marketCap: 5000000000 },
        { id: 2, name: 'Uniswap V3', type: 'DEX', marketCap: 3000000000 }
      ],
      intent: { type: 'search', confidence: 0.9 },
      entities: [{ type: 'PROJECT', value: 'Uniswap' }],
      language: 'en',
      credits: { remaining: 1990, used: 1, status: 'normal' }
    };
    
    const formattedResponse = server._formatToolResponse(searchResult);
    const response = JSON.parse(formattedResponse);
    
    console.error('Formatted response includes:');
    console.error('- Interpretation:', response.interpretation ? '✅' : '❌');
    console.error('- Suggestions:', response.suggestions ? '✅' : '❌');
    console.error('- Data Quality:', response.dataQuality ? '✅' : '❌');
    console.error('- Credits Info:', response.credits ? '✅' : '❌');
    
    if (response.interpretation) {
      console.error(`\nInterpretation summary: ${response.interpretation.summary}`);
    }
    
    if (response.suggestions && response.suggestions.length > 0) {
      console.error(`\nSuggestions (${response.suggestions.length}):`);
      response.suggestions.forEach(s => {
        console.error(`  - ${s.description}`);
      });
    }
    
    // 3. 测试空结果处理
    console.error('\n3. Testing empty result handling...');
    
    const emptyResult = {
      success: true,
      provider: 'rootdata',
      tool: 'search_web3_entities',
      data: [],
      intent: { type: 'search', confidence: 0.8 },
      entities: [{ type: 'PROJECT', value: 'NonExistentProject' }],
      language: 'en'
    };
    
    const emptyResponse = JSON.parse(server._formatToolResponse(emptyResult));
    console.error('Empty result help provided:', emptyResponse.emptyResultHelp ? '✅' : '❌');
    
    if (emptyResponse.emptyResultHelp) {
      console.error('Help message:', emptyResponse.emptyResultHelp.message);
      console.error('Suggestions:', emptyResponse.emptyResultHelp.suggestions.join('; '));
    }
    
    // 4. 测试项目详情响应
    console.error('\n4. Testing project details response...');
    
    const projectResult = {
      success: true,
      provider: 'rootdata',
      tool: 'get_project_details',
      data: {
        id: 11646,
        name: 'Uniswap',
        description: 'Decentralized trading protocol',
        marketCap: 5000000000,
        fundingTotal: 176000000,
        token: { symbol: 'UNI', price: 7.5 },
        ecosystem: 'Ethereum',
        updatedAt: new Date().toISOString()
      },
      intent: { type: 'project_details', confidence: 0.95 },
      entities: [{ type: 'NUMBER', value: '11646' }],
      language: 'en'
    };
    
    const projectResponse = JSON.parse(server._formatToolResponse(projectResult));
    console.error('Project interpretation:', projectResponse.interpretation.summary);
    console.error('Data quality level:', projectResponse.dataQuality.level);
    console.error('Quality indicators:', projectResponse.dataQuality.indicators.join(', '));
    
    // 5. 测试错误处理增强
    console.error('\n5. Testing enhanced error handling...');
    
    // 测试积分不足错误
    const creditsError = server.errorHandler.handleInsufficientCredits(10, 5, 'rootdata');
    console.error('\nInsufficient credits error:');
    console.error('Message:', creditsError.error.message);
    console.error('Suggestion:', creditsError.error.suggestion);
    
    // 测试验证错误
    const validationError = server.errorHandler.handleValidationError(
      'Invalid project ID format',
      { project_id: 'abc123' }
    );
    console.error('\nValidation error:');
    console.error('Message:', validationError.error.message);
    console.error('Suggestion:', validationError.error.suggestion);
    
    // 6. 测试多语言支持
    console.error('\n6. Testing multi-language support...');
    
    const chineseResult = {
      ...searchResult,
      language: 'zh'
    };
    
    const chineseResponse = JSON.parse(server._formatToolResponse(chineseResult));
    console.error('Chinese response has interpretation:', chineseResponse.interpretation ? '✅' : '❌');
    
    // 7. 测试数字格式化
    console.error('\n7. Testing number formatting...');
    const numbers = [1234, 12345, 1234567, 1234567890, 1234567890123];
    numbers.forEach(num => {
      console.error(`${num} → ${server._formatNumber(num)}`);
    });
    
    // 8. 检查提示词统计
    console.error('\n8. Checking prompt statistics...');
    const promptStats = server.promptManager.getStats();
    console.error('Response prompts loaded:', 
      promptStats.promptsLoaded >= 40 ? '✅' : '❌',
      `(${promptStats.promptsLoaded} total)`
    );
    
    // 9. 测试频繁错误检测
    console.error('\n9. Testing frequent error detection...');
    
    // 模拟多个错误
    for (let i = 0; i < 6; i++) {
      server.errorHandler.handleApiError(
        new Error('Test error'),
        'test-provider',
        {}
      );
    }
    
    const hasFrequentErrors = server.errorHandler.hasFrequentErrors(60000, 5);
    console.error('Frequent errors detected:', hasFrequentErrors ? '✅' : '❌');
    
    const errorStats = server.errorHandler.getErrorStats();
    console.error('Total errors recorded:', errorStats.totalErrors);
    console.error('Recent errors:', errorStats.recentErrors.length);
    
    console.error('\n✅ All response enhancement tests completed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
  
  process.exit(0);
}

// 运行测试
testResponseEnhancement().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
}); 