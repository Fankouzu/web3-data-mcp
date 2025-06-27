#!/usr/bin/env node

/**
 * 调试测试脚本
 * 用于测试MCP服务器的详细日志功能
 */

const path = require('path');

// 设置环境变量
process.env.ROOTDATA_API_KEY = process.env.ROOTDATA_API_KEY || 'test-key';
process.env.NODE_ENV = 'development';

async function runDebugTest() {
  console.error('=== MCP Server Debug Test ===');
  console.error('Starting debug test at:', new Date().toISOString());

  try {
    // 导入必要的模块
    const McpServer = require('../src/core/McpServer');
    const ToolRouter = require('../src/core/ToolRouter');
    const RootDataProvider = require('../src/providers/rootdata/RootDataProvider');
    
    console.error('✅ Modules imported successfully');

    // 创建配置
    const config = {
      server: {
        name: 'web3-data-debug',
        version: '1.0.0',
        port: 3001
      },
      logging: {
        level: 'debug',
        enableConsole: true
      },
      providers: {
        rootdata: {
          enabled: true,
          apiKey: process.env.ROOTDATA_API_KEY,
          baseUrl: 'https://api.rootdata.com',
          timeout: 30000,
          retryAttempts: 3,
          retryDelay: 1000
        }
      }
    };

    console.error('✅ Configuration prepared');

    // 创建MCP服务器实例
    const mcpServer = new McpServer(config);
    console.error('✅ MCP Server instance created');

    // 初始化服务器（但不启动）
    console.error('📡 Initializing MCP Server...');
    await mcpServer.initialize(config.providers);
    console.error('✅ MCP Server initialized');

    // 获取状态信息
    const status = mcpServer.getStatus();
    console.error('📊 Server Status:', JSON.stringify(status, null, 2));

    // 测试工具路由器
    console.error('🔄 Testing ToolRouter...');
    const toolRouter = mcpServer.toolRouter;
    
    if (toolRouter) {
      const availableTools = toolRouter.getAvailableTools();
      console.error(`✅ Available tools count: ${availableTools.length}`);
      
      if (availableTools.length > 0) {
        console.error('🛠️ Available tools:');
        availableTools.forEach((tool, index) => {
          console.error(`  ${index + 1}. ${tool.name} (${tool.provider})`);
        });

        // 测试工具调用（模拟）
        console.error('🧪 Testing tool call simulation...');
        try {
          const testResult = await toolRouter.routeQuery('SAHARA', {
            toolName: 'search_web3_entities',
            params: {
              query: 'SAHARA'
            },
            requestId: 'debug-test-001'
          });

          console.error('✅ Tool call simulation result:', {
            success: testResult.success,
            provider: testResult.provider,
            hasData: !!testResult.data,
            error: testResult.error
          });
        } catch (testError) {
          console.error('❌ Tool call simulation failed:', testError.message);
        }
      } else {
        console.error('⚠️ No tools available - check provider configuration');
      }
    } else {
      console.error('❌ ToolRouter not available');
    }

    // 测试RootData提供商
    console.error('🌐 Testing RootData Provider...');
    const providers = mcpServer.providers;
    
    if (providers && providers.has('rootdata')) {
      const rootDataProvider = providers.get('rootdata');
      console.error('✅ RootData provider found');

      try {
        const providerStatus = rootDataProvider.getDetailedStatus();
        console.error('📈 RootData provider status:', JSON.stringify(providerStatus, null, 2));
      } catch (statusError) {
        console.error('⚠️ Could not get provider status:', statusError.message);
      }
    } else {
      console.error('❌ RootData provider not found');
      console.error('Available providers:', providers ? Array.from(providers.keys()) : 'none');
    }

    console.error('🏁 Debug test completed successfully');

  } catch (error) {
    console.error('❌ Debug test failed:', error.message);
    console.error('Error stack:', error.stack);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  runDebugTest().catch(error => {
    console.error('Fatal error in debug test:', error);
    process.exit(1);
  });
}

module.exports = { runDebugTest }; 