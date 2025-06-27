#!/usr/bin/env node

/**
 * 快速测试MCP工具调用
 */

require('dotenv').config();

async function quickTest() {
  console.error('=== Quick MCP Tool Test ===');
  
  try {
    // 导入必要的模块
    const { ToolRouter } = require('../src/core/ToolRouter');
    const RootDataProvider = require('../src/providers/rootdata/RootDataProvider');
    
    // 创建提供商
    const provider = new RootDataProvider({
      apiKey: process.env.ROOTDATA_API_KEY
    });
    
    await provider.initialize();
    console.error('✅ Provider initialized');
    
    // 创建路由器
    const router = new ToolRouter();
    router.registerProvider('rootdata', provider);
    console.error('✅ Router created and provider registered');
    
    // 模拟MCP工具调用
    const testParams = {
      project_id: 11646,
      include_team: true,
      include_investors: true
    };
    
    console.error('Testing with params:', testParams);
    
    // 直接调用routeQuery，模拟MCP的调用方式
    const result = await router.routeQuery('get project details', {
      params: testParams,
      toolName: 'get_project_details',
      requestId: 'test-001'
    });
    
    console.error('✅ Test completed');
    console.error('Result:', {
      success: result.success,
      hasData: !!result.data,
      error: result.error,
      provider: result.provider
    });
    
    if (result.success && result.data) {
      console.error('Data preview:', {
        project_name: result.data.project_name,
        project_id: result.data.project_id,
        has_investors: !!(result.data.investors && result.data.investors.length > 0)
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Error stack:', error.stack);
  }
}

quickTest().catch(console.error); 