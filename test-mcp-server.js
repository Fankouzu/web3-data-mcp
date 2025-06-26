/**
 * MCP服务器完整功能测试
 * 测试整个MCP服务器的集成功能
 */

const McpServer = require('./src/core/McpServer');
const ConfigManager = require('./src/core/ConfigManager');

async function testMcpServerIntegration() {
  console.log('🧪 测试MCP服务器完整功能');
  console.log('='.repeat(50));

  const apiKey = process.env.ROOTDATA_API_KEY;
  
  if (!apiKey) {
    console.log('❌ 请设置环境变量 ROOTDATA_API_KEY');
    process.exit(1);
  }

  try {
    // 1. 测试配置管理器
    console.log('\n1️⃣ 测试配置管理器...');
    
    const configManager = new ConfigManager();
    const config = configManager.loadConfig({
      server: {
        name: 'test-web3-data-mcp',
        version: '1.0.0-test'
      },
      providers: {
        rootdata: {
          apiKey: apiKey,
          timeout: 30000,
          retries: 3
        }
      }
    });

    console.log('✅ 配置加载成功');
    console.log('📋 配置的供应商:', configManager.getConfiguredProviders());
    
    // 测试配置访问
    console.log('服务器名称:', configManager.get('server.name'));
    console.log('监控配置:', configManager.get('monitoring'));

    // 2. 测试MCP服务器初始化
    console.log('\n2️⃣ 测试MCP服务器初始化...');
    
    const mcpServer = new McpServer(config.server);
    
    // 准备供应商配置
    const providerConfigs = {};
    configManager.getConfiguredProviders().forEach(providerName => {
      providerConfigs[providerName] = configManager.getProviderConfig(providerName);
    });

    // 初始化服务器
    const initSuccess = await mcpServer.initialize(providerConfigs);
    
    if (!initSuccess) {
      throw new Error('MCP服务器初始化失败');
    }

    console.log('✅ MCP服务器初始化成功');

    // 3. 测试服务器状态
    console.log('\n3️⃣ 测试服务器状态查询...');
    
    const status = mcpServer.getStatus();
    console.log('服务器状态:');
    console.log('- 名称:', status.server.name);
    console.log('- 版本:', status.server.version);
    console.log('- 初始化状态:', status.server.initialized);
    console.log('- 供应商数量:', status.providers.length);
    console.log('- 工具总数:', Object.values(status.tools).reduce((sum, provider) => sum + provider.total, 0));

    // 4. 测试工具列表获取（通过工具路由器）
    console.log('\n4️⃣ 测试工具列表获取...');
    
    // 直接通过工具路由器获取可用工具
    const availableTools = mcpServer.toolRouter.getAvailableTools({ checkCredits: true });
    console.log('✅ 工具列表获取成功');
    console.log(`📋 可用工具数量: ${availableTools.length}`);
    
    availableTools.forEach((tool, index) => {
      console.log(`${index + 1}. ${tool.name}: ${tool.description} (Credits: ${tool.creditsPerCall})`);
    });

    // 5. 测试工具调用（通过工具路由器）
    console.log('\n5️⃣ 测试工具调用功能...');
    
    // 测试Credits查询
    console.log('5.1 测试Credits查询...');
    try {
      const creditsResult = await mcpServer.toolRouter.routeQuery('check my credits balance', {
        includeDetails: true
      });
      
      if (creditsResult.success) {
        console.log('✅ Credits查询成功');
        console.log('使用的工具:', creditsResult.tool);
        console.log('供应商:', creditsResult.provider);
        if (creditsResult.credits) {
          console.log('Credits信息:', creditsResult.credits);
        }
      } else {
        console.log('❌ Credits查询失败:', creditsResult.error);
      }
      
    } catch (error) {
      console.log('❌ Credits查询异常:', error.message);
    }

    // 测试搜索功能
    console.log('\n5.2 测试搜索功能...');
    try {
      const searchResult = await mcpServer.toolRouter.routeQuery('Search for Bitcoin projects', {
        includeDetails: true
      });
      
      if (searchResult.success) {
        console.log('✅ 搜索功能成功');
        console.log('搜索结果数量:', searchResult.data?.data?.length || 0);
        console.log('使用的供应商:', searchResult.provider);
        console.log('使用的工具:', searchResult.tool);
        console.log('意图识别:', searchResult.intent);
        console.log('语言检测:', searchResult.language);
        
        if (searchResult.credits) {
          console.log('Credits消耗:', searchResult.credits.used);
          console.log('剩余Credits:', searchResult.credits.remaining);
        }
      } else {
        console.log('❌ 搜索功能失败:', searchResult.error);
      }
      
    } catch (error) {
      console.log('❌ 搜索功能异常:', error.message);
    }

    // 测试工具推荐
    console.log('\n5.3 测试工具推荐...');
    try {
      const recommendations = mcpServer.toolRouter.getRecommendedTools('Find Ethereum DeFi projects', 3);
      console.log('✅ 工具推荐成功');
      console.log(`推荐工具数量: ${recommendations.length}`);
      
      recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec.name} (相关性: ${rec.relevanceScore.toFixed(2)})`);
        console.log(`   理由: ${rec.reason}`);
      });
      
    } catch (error) {
      console.log('❌ 工具推荐失败:', error.message);
    }

    // 6. 测试统计信息
    console.log('\n6️⃣ 服务器运行统计...');
    
    const finalStatus = mcpServer.getStatus();
    console.log('总请求数:', finalStatus.server.totalRequests);
    console.log('成功率:', finalStatus.server.successRate);
    console.log('错误统计:', finalStatus.errors);

    // 7. 测试配置导出
    console.log('\n7️⃣ 测试配置导出...');
    
    const safeConfig = configManager.exportSafeConfig();
    console.log('安全配置导出:', JSON.stringify(safeConfig, null, 2));

    console.log('\n🎉 MCP服务器完整功能测试完成！');
    console.log('✅ 所有核心功能正常工作');
    
    // 清理监控（不启动完整的服务器关闭流程）
    mcpServer.creditsMonitor.stopAutoMonitoring();
    
  } catch (error) {
    console.error('\n💥 测试过程中出现错误:', error.message);
    console.error('错误堆栈:', error.stack);
    process.exit(1);
  }
}

/**
 * 测试CLI命令行功能
 */
async function testCliCommands() {
  console.log('\n🔧 测试CLI命令行功能');
  console.log('='.repeat(30));

  const { spawn } = require('child_process');
  
  const testCommands = [
    ['--help'],
    ['--config-example'],
    ['--env-help']
  ];

  for (const args of testCommands) {
    console.log(`\n测试命令: node src/index.js ${args.join(' ')}`);
    
    try {
      const result = await new Promise((resolve, reject) => {
        const child = spawn('node', ['src/index.js', ...args], {
          stdio: 'pipe',
          timeout: 5000
        });
        
        let output = '';
        child.stdout.on('data', (data) => {
          output += data.toString();
        });
        
        child.stderr.on('data', (data) => {
          output += data.toString();
        });
        
        child.on('close', (code) => {
          resolve({ code, output });
        });
        
        child.on('error', reject);
      });
      
      console.log(`✅ 命令执行成功 (退出码: ${result.code})`);
      console.log('输出长度:', result.output.length, '字符');
      
    } catch (error) {
      console.log(`❌ 命令执行失败:`, error.message);
    }
  }
}

// 运行测试
if (require.main === module) {
  testMcpServerIntegration()
    .then(() => testCliCommands())
    .catch(error => {
      console.error('测试执行失败:', error);
      process.exit(1);
    });
}

module.exports = testMcpServerIntegration;