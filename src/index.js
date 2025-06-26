#!/usr/bin/env node

/**
 * Web3 Data MCP服务器入口点
 * 基于Model Context Protocol的Web3数据查询服务
 */

const McpServer = require('./core/McpServer');
const ConfigManager = require('./core/ConfigManager');

/**
 * 主函数
 */
async function main() {
  try {
    // 检查命令行参数
    const args = process.argv.slice(2);
    
    if (args.includes('--help') || args.includes('-h')) {
      printHelp();
      return;
    }

    if (args.includes('--config-example')) {
      console.log('📝 示例配置文件内容:');
      console.log(ConfigManager.createExampleConfig());
      return;
    }

    if (args.includes('--env-help')) {
      console.log(ConfigManager.getEnvironmentVariablesHelp());
      return;
    }

    // 初始化配置管理器
    const configManager = new ConfigManager();
    
    // 加载配置
    const config = configManager.loadConfig();
    
    // 检查是否有配置的供应商
    const configuredProviders = configManager.getConfiguredProviders();
    if (configuredProviders.length === 0) {
      console.error('❌ 错误: 没有配置任何数据供应商');
      console.error('');
      console.error('请设置环境变量或配置文件来配置至少一个数据供应商。');
      console.error('');
      console.error('对于RootData，请设置: ROOTDATA_API_KEY=your-api-key');
      console.error('');
      console.error('运行 --env-help 查看所有可用的环境变量');
      process.exit(1);
    }

    if (args.includes('--debug')) {
      console.error('Starting Web3 Data MCP Server...');
      console.error(`Configured providers: ${configuredProviders.join(', ')}`);
      console.error('Debug mode enabled');
      console.error('Current configuration:');
      console.error(JSON.stringify(configManager.exportSafeConfig(), null, 2));
    }

    // 创建并初始化MCP服务器
    const mcpServer = new McpServer(config.server);
    
    // 准备供应商配置
    const providerConfigs = {};
    configuredProviders.forEach(providerName => {
      providerConfigs[providerName] = configManager.getProviderConfig(providerName);
    });

    // 初始化服务器
    const initSuccess = await mcpServer.initialize(providerConfigs);
    
    if (!initSuccess) {
      console.error('❌ 服务器初始化失败');
      process.exit(1);
    }

    // 启动服务器
    await mcpServer.start();
    
  } catch (error) {
    console.error('💥 启动失败:', error.message);
    
    if (error.message.includes('配置验证失败')) {
      console.error('');
      console.error('请检查配置文件或环境变量设置。');
      console.error('运行 --config-example 查看示例配置。');
      console.error('运行 --env-help 查看环境变量配置说明。');
    }
    
    process.exit(1);
  }
}

/**
 * 打印帮助信息
 */
function printHelp() {
  console.log(`
🌟 Web3 Data MCP服务器

一个基于Model Context Protocol的Web3数据查询服务，支持多个数据供应商。

用法:
  node src/index.js [options]

选项:
  --help, -h           显示此帮助信息
  --config-example     显示示例配置文件
  --env-help          显示环境变量配置说明
  --debug             启用调试模式

环境变量:
  ROOTDATA_API_KEY     RootData API密钥（必需）
  
其他环境变量配置请运行 --env-help 查看。

示例:
  # 使用环境变量启动
  ROOTDATA_API_KEY=your-key node src/index.js
  
  # 调试模式启动
  ROOTDATA_API_KEY=your-key node src/index.js --debug

支持的数据供应商:
  - RootData (rootdata.com) - Web3项目、融资、代币数据

MCP客户端配置示例:
  {
    "mcpServers": {
      "web3-data": {
        "command": "node",
        "args": ["path/to/web3-data-mcp/src/index.js"],
        "env": {
          "ROOTDATA_API_KEY": "your-api-key-here"
        }
      }
    }
  }

更多信息: https://github.com/your-repo/web3-data-mcp
`);
}

/**
 * 处理未捕获的异常
 */
process.on('uncaughtException', (error) => {
  console.error('💥 未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 未处理的Promise拒绝:', reason);
  process.exit(1);
});

// 启动应用
if (require.main === module) {
  main();
}

module.exports = { main };