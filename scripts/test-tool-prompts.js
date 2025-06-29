#!/usr/bin/env node

/**
 * 测试工具层提示词增强功能
 */

require('dotenv').config();
const McpServer = require('../src/core/McpServer');

async function testToolPrompts() {
  console.error('=== Testing Tool Layer Prompt Enhancement ===');
  console.error('Start time:', new Date().toISOString());
  
  try {
    // 1. 创建McpServer实例
    console.error('\n1. Creating McpServer instance...');
    const server = new McpServer({
      name: 'web3-data-mcp-test',
      version: '1.0.0',
      prompts: {
        defaultLanguage: 'en',
        cacheEnabled: true
      }
    });
    console.error('✅ Server instance created');
    
    // 2. 初始化服务器
    console.error('\n2. Initializing server...');
    const providerConfigs = {
      rootdata: {
        apiKey: process.env.ROOTDATA_API_KEY,
        baseUrl: process.env.ROOTDATA_BASE_URL || 'https://api.rootdata.com',
        cacheEnabled: true,
        cacheTTL: 300000
      }
    };
    
    const initResult = await server.initialize(providerConfigs);
    if (!initResult) {
      throw new Error('Server initialization failed');
    }
    console.error('✅ Server initialized successfully');
    
    // 3. 获取工具列表（模拟MCP调用）
    console.error('\n3. Getting tool list with prompts...');
    const availableTools = server.toolRouter.getAvailableTools({ checkCredits: true });
    console.error(`Total available tools: ${availableTools.length}`);
    
    // 4. 检查工具的提示词
    console.error('\n4. Checking tool prompts...');
    for (const tool of availableTools.slice(0, 3)) { // 只检查前3个工具
      console.error(`\n--- Tool: ${tool.name} ---`);
      
      // 获取各种类型的提示词
      const systemPrompt = server.promptManager.getToolPrompt(tool.name, 'system', { language: 'en' });
      const usagePrompt = server.promptManager.getToolPrompt(tool.name, 'usage', { language: 'en' });
      
      console.error('Has system prompt:', systemPrompt ? '✅ Yes' : '❌ No');
      console.error('Has usage prompt:', usagePrompt ? '✅ Yes' : '❌ No');
      
      if (systemPrompt) {
        console.error('System prompt preview:', systemPrompt.substring(0, 100) + '...');
      }
    }
    
    // 5. 测试多语言支持
    console.error('\n5. Testing multi-language support...');
    const searchToolName = 'search_web3_entities';
    
    const systemEn = server.promptManager.getToolPrompt(searchToolName, 'system', { language: 'en' });
    const systemZh = server.promptManager.getToolPrompt(searchToolName, 'system', { language: 'zh' });
    
    console.error('English prompt exists:', systemEn ? '✅ Yes' : '❌ No');
    console.error('Chinese prompt exists:', systemZh ? '✅ Yes' : '❌ No');
    console.error('Prompts are different:', systemEn !== systemZh ? '✅ Yes' : '❌ No');
    
    // 6. 检查提示词统计
    console.error('\n6. Checking prompt statistics...');
    const stats = server.promptManager.getStats();
    console.error('Prompt Manager Stats:');
    console.error(JSON.stringify(stats, null, 2));
    
    // 7. 测试工具注册表增强
    console.error('\n7. Testing tool registry enhancement...');
    // 这会模拟MCP的ListTools调用
    const handler = server.server._requestHandlers.get('tools/list');
    if (handler) {
      console.error('Tools/list handler registered: ✅ Yes');
      
      // 执行handler (传递正确的请求对象)
      const toolListResult = await handler({ method: 'tools/list' });
      console.error(`Tools returned: ${toolListResult.tools.length}`);
      
      // 检查第一个工具是否包含guidance字段
      if (toolListResult.tools.length > 0) {
        const firstTool = toolListResult.tools[0];
        console.error(`\nFirst tool: ${firstTool.name}`);
        console.error('Has guidance field:', firstTool.guidance ? '✅ Yes' : '❌ No');
        
        if (firstTool.guidance) {
          console.error('Guidance structure:');
          console.error('- system:', firstTool.guidance.system ? '✅ Present' : '❌ Missing');
          console.error('- usage:', firstTool.guidance.usage ? '✅ Present' : '❌ Missing');
          console.error('- examples:', firstTool.guidance.examples ? '✅ Present' : '❌ Missing');
        }
      }
    } else {
      console.error('Tools/list handler registered: ❌ No');
    }
    
    // 8. 测试路由器的提示词集成
    console.error('\n8. Testing ToolRouter prompt integration...');
    console.error('PromptManager in ToolRouter:', server.toolRouter.promptManager ? '✅ Injected' : '❌ Not injected');
    console.error('PromptManager in ErrorHandler:', server.errorHandler.promptManager ? '✅ Injected' : '❌ Not injected');
    
    console.error('\n✅ All tool prompt tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
  
  process.exit(0);
}

// 运行测试
testToolPrompts().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
}); 