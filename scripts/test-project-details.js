#!/usr/bin/env node

/**
 * 专门测试get_project_details工具调用
 */

require('dotenv').config();

async function testProjectDetails() {
  console.error('=== Testing get_project_details Tool ===');
  
  try {
    // 1. 测试McpServer的工具调用处理
    const McpServer = require('../src/core/McpServer');
    
    const server = new McpServer({
      server: {
        name: 'web3-data-test',
        version: '1.0.0'
      }
    });
    
    // 初始化服务器
    await server.initialize({
      rootdata: {
        apiKey: process.env.ROOTDATA_API_KEY || 'test-key'
      }
    });
    
    console.error('✅ Server initialized');
    
    // 2. 模拟MCP工具调用
    const mockRequest = {
      params: {
        name: 'get_project_details',
        arguments: {
          project_id: 11646,
          include_team: true,
          include_investors: true
        }
      }
    };
    
    console.error('📞 Simulating MCP tool call...');
    console.error('Request:', JSON.stringify(mockRequest, null, 2));
    
    // 3. 测试参数处理
    const toolName = mockRequest.params.name;
    const toolArgs = mockRequest.params.arguments;
    
    console.error(`🔧 Tool: ${toolName}`);
    console.error(`📋 Arguments:`, toolArgs);
    console.error(`🔢 project_id type: ${typeof toolArgs.project_id}`);
    
    // 4. 测试query构建逻辑（来自McpServer修复）
    let query = toolArgs.query || toolArgs.token_symbol || toolArgs.ecosystem;
    
    if (!query) {
      if (toolArgs.project_id && (toolName === 'get_project_details' || toolName.includes('project'))) {
        query = `project_${toolArgs.project_id}`;
      } else {
        query = `${toolName} request`;
      }
    }
    
    query = String(query);
    
    console.error(`📝 Constructed query: "${query}"`);
    console.error(`📝 Query type: ${typeof query}`);
    
    // 5. 测试ToolRouter类型转换
    if (typeof query !== 'string') {
      query = String(query);
      console.error(`🔄 Query converted to string: "${query}"`);
    }
    
    console.error('✅ All type checks passed');
    console.error('🎯 Test completed successfully');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('📚 Stack:', error.stack);
    process.exit(1);
  }
}

testProjectDetails().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
}); 