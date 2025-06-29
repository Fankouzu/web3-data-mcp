#!/usr/bin/env node

/**
 * Web3 Data MCP服务器入口点
 * 基于Model Context Protocol的Web3数据查询服务
 */

// 加载环境变量
require('dotenv').config();

const McpServer = require('./core/McpServer');
const ConfigManager = require('./core/ConfigManager');

/**
 * 主函数
 */
async function main() {
  try {
    // Debug logging for MCP connection issues
    const isDebug = process.env.DEBUG || process.env.MCP_DEBUG || process.argv.includes('--debug');
    if (isDebug) {
      console.error('[DEBUG] Starting Web3 Data MCP Server v2.0.0');
      console.error('[DEBUG] Node version:', process.version);
      console.error('[DEBUG] Current directory:', process.cwd());
      console.error('[DEBUG] Script path:', __filename);
      console.error('[DEBUG] Environment:', {
        hasRootDataKey: !!process.env.ROOTDATA_API_KEY,
        debug: process.env.DEBUG,
        mcpDebug: process.env.MCP_DEBUG
      });
    }
    // 检查命令行参数
    const args = process.argv.slice(2);

    if (args.includes('--help') || args.includes('-h')) {
      printHelp();
      return;
    }

    if (args.includes('--config-example')) {
          console.error('Example configuration file content:');
    console.error(ConfigManager.createExampleConfig());
      return;
    }

    if (args.includes('--env-help')) {
      console.error(ConfigManager.getEnvironmentVariablesHelp());
      return;
    }

    // 初始化配置管理器
    if (isDebug) {
      console.error('[DEBUG] Initializing ConfigManager...');
    }
    const configManager = new ConfigManager();

    // 加载配置
    const config = configManager.loadConfig();
    if (isDebug) {
      console.error('[DEBUG] Configuration loaded successfully');
      console.error('[DEBUG] Safe config:', JSON.stringify(configManager.exportSafeConfig(), null, 2));
    }

    // 检查是否有配置的供应商
    const configuredProviders = configManager.getConfiguredProviders();
    if (isDebug) {
      console.error('[DEBUG] Configured providers:', configuredProviders);
    }
    if (configuredProviders.length === 0) {
      console.error('Error: No data providers configured');
      console.error('');
      console.error('Please set environment variables or configuration file to configure at least one data provider.');
      console.error('');
      console.error('For RootData, please set: ROOTDATA_API_KEY=your-api-key');
      console.error('');
      console.error('Run --env-help to see all available environment variables');
      if (isDebug) {
        console.error('[DEBUG] Exiting due to no configured providers');
      }
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
    if (isDebug) {
      console.error('[DEBUG] Creating MCP server instance...');
    }
    const mcpServer = new McpServer(config.server);

    // 准备供应商配置
    const providerConfigs = {};
    configuredProviders.forEach(providerName => {
      providerConfigs[providerName] = configManager.getProviderConfig(providerName);
    });

    // 初始化服务器
    if (isDebug) {
      console.error('[DEBUG] Initializing MCP server with provider configs...');
    }
    const initSuccess = await mcpServer.initialize(providerConfigs);

    if (!initSuccess) {
      console.error('Server initialization failed');
      if (isDebug) {
        console.error('[DEBUG] Server initialization failed, exiting');
      }
      process.exit(1);
    }
    if (isDebug) {
      console.error('[DEBUG] MCP server initialized successfully');
    }

    // 启动服务器
    if (isDebug) {
      console.error('[DEBUG] Starting MCP server...');
    }
    await mcpServer.start();
    if (isDebug) {
      console.error('[DEBUG] MCP server started successfully');
      console.error('[DEBUG] Server is now listening for MCP client connections via stdio');
    }
  } catch (error) {
    console.error('Startup failed:', error.message);

    if (error.message.includes('Configuration validation failed')) {
      console.error('');
      console.error('Please check configuration file or environment variable settings.');
      console.error('Run --config-example to see example configuration.');
      console.error('Run --env-help to see environment variable configuration instructions.');
    }

    process.exit(1);
  }
}

/**
 * 打印帮助信息
 */
function printHelp() {
  console.error(`
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

更多信息: https://github.com/Fankouzu/web3-data-mcp

---

🌟 Web3 Data MCP Server

A Web3 data query service based on Model Context Protocol, supporting multiple data providers.

Usage:
  node src/index.js [options]

Options:
  --help, -h           Show this help message
  --config-example     Show example configuration file
  --env-help          Show environment variable configuration instructions
  --debug             Enable debug mode

Environment Variables:
  ROOTDATA_API_KEY     RootData API key (required)
  
Run --env-help to see other environment variable configurations.

Examples:
  # Start with environment variables
  ROOTDATA_API_KEY=your-key node src/index.js
  
  # Start in debug mode
  ROOTDATA_API_KEY=your-key node src/index.js --debug

Supported Data Providers:
  - RootData (rootdata.com) - Web3 projects, funding, token data

MCP Client Configuration Example:
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

More Information: https://github.com/Fankouzu/web3-data-mcp
`);
}

/**
 * 处理未捕获的异常
 */
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  if (process.env.DEBUG || process.env.MCP_DEBUG) {
    console.error('[DEBUG] Stack trace:', error.stack);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled promise rejection:', reason);
  if (process.env.DEBUG || process.env.MCP_DEBUG) {
    console.error('[DEBUG] Promise:', promise);
    if (reason && reason.stack) {
      console.error('[DEBUG] Stack trace:', reason.stack);
    }
  }
  process.exit(1);
});

// 启动应用
if (require.main === module) {
  main();
}

module.exports = { main };
