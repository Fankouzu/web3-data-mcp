/**
 * MCP服务器核心
 * 基于Model Context Protocol SDK构建的Web3数据服务器
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError
} = require('@modelcontextprotocol/sdk/types.js');

const RootDataProvider = require('../providers/rootdata/RootDataProvider');
const { ErrorHandler } = require('./ErrorHandler');
const { CreditsMonitor } = require('./CreditsMonitor');
const { ToolRouter } = require('./ToolRouter');

class McpServer {
  constructor(config = {}) {
    this.config = {
      name:    'web3-data-mcp',
      version: '1.0.0',
      ...config
    };

    // 初始化核心组件
    this.server = new Server(
      {
        name:    this.config.name,
        version: this.config.version
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    this.errorHandler = new ErrorHandler();
    this.creditsMonitor = new CreditsMonitor();
    this.toolRouter = new ToolRouter();

    // 供应商管理
    this.providers = new Map();
    this.isInitialized = false;

    // 服务器统计
    this.stats = {
      startTime:          new Date(),
      totalRequests:      0,
      successfulRequests: 0,
      failedRequests:     0,
      toolUsage:          {}
    };

    this._setupEventHandlers();
  }

  /**
   * 初始化MCP服务器
   * @param {Object} providerConfigs - 供应商配置
   */
  async initialize(providerConfigs = {}) {
    try {
      console.error('🚀 Initializing Web3 Data MCP Server...');

      // 初始化数据供应商
      await this._initializeProviders(providerConfigs);

      // 设置MCP处理器
      this._setupMcpHandlers();

      // 启动Credits监控
      this.creditsMonitor.startAutoMonitoring();

      this.isInitialized = true;
      console.error('✅ MCP Server initialization completed');
      console.error(`📊 Registered ${this.providers.size} data providers`);
      console.error(`🔧 Total available tools: ${this._getTotalToolsCount()}`);

      return true;
    } catch (error) {
      console.error('❌ MCP Server initialization failed:', error.message);
      return false;
    }
  }

  /**
   * 启动MCP服务器
   */
  async start() {
    if (!this.isInitialized) {
      throw new Error('Server not initialized, please call initialize() first');
    }

    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);

      console.error('🌟 Web3 Data MCP Server started');
      console.error('📡 Waiting for MCP client connections...');

      // 设置优雅关闭
      process.on('SIGINT', () => this.shutdown());
      process.on('SIGTERM', () => this.shutdown());
    } catch (error) {
      console.error('❌ Failed to start MCP Server:', error.message);
      throw error;
    }
  }

  /**
   * 关闭服务器
   */
  async shutdown() {
    console.error('\n🛑 Shutting down MCP Server...');

    // 停止监控
    this.creditsMonitor.stopAutoMonitoring();

    // 打印统计信息
    this._printFinalStats();

    // 关闭服务器
    await this.server.close();

    console.error('👋 MCP Server shutdown complete');
    process.exit(0);
  }

  /**
   * 获取服务器状态
   */
  getStatus() {
    const creditsOverview = this.creditsMonitor.getOverview();
    const routingStats = this.toolRouter.getRoutingStats();
    const errorStats = this.errorHandler.getErrorStats();

    return {
      server: {
        name:          this.config.name,
        version:       this.config.version,
        initialized:   this.isInitialized,
        uptime:        Date.now() - this.stats.startTime.getTime(),
        totalRequests: this.stats.totalRequests,
        successRate:
          this.stats.totalRequests > 0
            ? ((this.stats.successfulRequests / this.stats.totalRequests) * 100).toFixed(2) + '%'
            : '0%'
      },
      providers: Array.from(this.providers.keys()),
      credits:   creditsOverview,
      routing:   routingStats,
      errors:    {
        total:        errorStats.totalErrors,
        byType:       errorStats.errorsByType,
        recentErrors: errorStats.recentErrors.length
      },
      tools: this._getToolsSummary()
    };
  }

  /**
   * 初始化数据供应商
   * @private
   */
  async _initializeProviders(providerConfigs) {
    // 初始化RootData供应商
    if (providerConfigs.rootdata) {
      console.error('🔧 Initializing RootData provider...');

      const rootDataProvider = new RootDataProvider(providerConfigs.rootdata);
      const initResult = await rootDataProvider.initialize();

      if (initResult) {
        this.providers.set('rootdata', rootDataProvider);
        this.toolRouter.registerProvider('rootdata', rootDataProvider);
        this.creditsMonitor.registerProvider('rootdata', rootDataProvider);

        console.error('✅ RootData provider initialized successfully');
      } else {
        throw new Error('RootData provider initialization failed');
      }
    }

    // 未来可以在这里添加更多供应商
    // if (providerConfigs.otherProvider) { ... }
  }

  /**
   * 设置MCP处理器
   * @private
   */
  _setupMcpHandlers() {
    // 列出可用工具
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      try {
        const availableTools = this.toolRouter.getAvailableTools({ checkCredits: true });

        return {
          tools: availableTools.map(tool => ({
            name:        tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema
          }))
        };
      } catch (error) {
        console.error('❌ Failed to list tools:', error.message);
        throw new McpError(ErrorCode.InternalError, `Failed to list tools: ${error.message}`);
      }
    });

    // 执行工具调用
    this.server.setRequestHandler(CallToolRequestSchema, async request => {
      const { name: toolName, arguments: toolArgs } = request.params;

      try {
        this.stats.totalRequests++;
        this._updateToolUsageStats(toolName);

        console.error(`🔧 Executing tool call: ${toolName}`);
        console.error(`📝 Parameters:`, JSON.stringify(toolArgs, null, 2));
        console.error(`⏰ Request time: ${new Date().toISOString()}`);

        // 构建查询字符串
        const query =
          toolArgs.query || toolArgs.token_symbol || toolArgs.ecosystem || toolArgs.project_id || `${toolName} request`;

        // 通过智能路由执行查询
        console.error(`🎯 Routing query: "${query}" using tool: ${toolName}`);
        const result = await this.toolRouter.routeQuery(query, {
          params:         toolArgs,
          toolName,
          includeDetails: true
        });

        console.error(`📊 Query result: ${result.success ? 'Success' : 'Failed'}`);
        if (!result.success) {
          console.error(`❌ Error details: ${result.error}`);
          console.error(`🔍 Error stack:`, result.stack || 'No stack trace');
        }

        if (result.success) {
          this.stats.successfulRequests++;

          // 更新Credits监控
          if (result.credits) {
            this.creditsMonitor.updateCredits(result.provider, result.credits.remaining, result.credits.used);
          }

          console.error(`✅ Tool call successful: ${toolName}`);

          return {
            content: [
              {
                type: 'text',
                text: this._formatToolResponse(result)
              }
            ]
          };
        } else {
          this.stats.failedRequests++;
          console.error(`❌ Tool call failed: ${toolName} - ${result.error}`);

          throw new McpError(ErrorCode.InvalidRequest, result.error || 'Tool call failed');
        }
      } catch (error) {
        this.stats.failedRequests++;
        console.error(`💥 Tool call exception: ${toolName}`, error.message);

        // 记录错误
        const errorResponse = this.errorHandler.handleApiError(error, 'mcp-server', { toolName, toolArgs });

        throw new McpError(ErrorCode.InternalError, errorResponse.error.message);
      }
    });

    // 添加对缺失MCP方法的支持 - 这些是可选的MCP协议方法
    // 注意：MCP SDK可能不支持直接的method字符串注册，暂时注释掉
    // 如果Claude Desktop调用这些方法，会收到Method not found错误，但不影响核心功能

    /*
    // Resources list (资源列表)
    this.server.setRequestHandler({ method: 'resources/list' }, async () => {
      console.error('📋 Received resource list request - returning empty list');
      return { resources: [] };
    });

    // Prompts list (提示词列表)
    this.server.setRequestHandler({ method: 'prompts/list' }, async () => {
      console.error('📋 Received prompts list request - returning empty list');
      return { prompts: [] };
    });
    */
  }

  /**
   * 设置事件处理器
   * @private
   */
  _setupEventHandlers() {
    // Credits警告事件
    this.creditsMonitor.on('credits_warning', data => {
      console.error(`⚠️ Credits warning: ${data.provider} has ${data.credits} credits remaining`);
    });

    this.creditsMonitor.on('credits_critical', data => {
      console.error(`🚨 Credits critically low: ${data.provider} has ${data.credits} credits remaining`);
    });

    this.creditsMonitor.on('credits_exhausted', data => {
      console.error(`💀 Credits exhausted: ${data.provider}`);
    });

    // 错误频率监控
    setInterval(() => {
      if (this.errorHandler.hasFrequentErrors()) {
        console.error('⚠️ Frequent errors detected, please check system status');
      }
    }, 60000); // 每分钟检查一次
  }

  /**
   * 格式化工具响应
   * @private
   */
  _formatToolResponse(result) {
    const response = {
      success:  true,
      provider: result.provider,
      data:     result.data,
      metadata: {
        intent:    result.intent,
        entities:  result.entities,
        language:  result.language,
        timestamp: new Date().toISOString()
      }
    };

    // 添加Credits信息
    if (result.credits) {
      response.credits = {
        remaining: result.credits.remaining,
        used:      result.credits.used,
        status:    result.credits.status
      };

      if (result.credits.message) {
        response.credits.message = result.credits.message;
      }
    }

    return JSON.stringify(response, null, 2);
  }

  /**
   * 获取工具总数
   * @private
   */
  _getTotalToolsCount() {
    let totalTools = 0;
    for (const provider of this.providers.values()) {
      totalTools += provider.getAvailableTools().length;
    }
    return totalTools;
  }

  /**
   * 获取工具摘要
   * @private
   */
  _getToolsSummary() {
    const summary = {};

    for (const [providerName, provider] of this.providers) {
      const tools = provider.getAvailableTools();
      summary[providerName] = {
        total:      tools.length,
        categories: {}
      };

      tools.forEach(tool => {
        const category = tool.category || 'other';
        if (!summary[providerName].categories[category]) {
          summary[providerName].categories[category] = 0;
        }
        summary[providerName].categories[category]++;
      });
    }

    return summary;
  }

  /**
   * 更新工具使用统计
   * @private
   */
  _updateToolUsageStats(toolName) {
    if (!this.stats.toolUsage[toolName]) {
      this.stats.toolUsage[toolName] = 0;
    }
    this.stats.toolUsage[toolName]++;
  }

  /**
   * 打印最终统计信息
   * @private
   */
  _printFinalStats() {
    const uptime = Date.now() - this.stats.startTime.getTime();
    const uptimeHours = (uptime / (1000 * 60 * 60)).toFixed(2);

    console.error('\n📊 Server runtime statistics:');
    console.error(`⏰ Uptime: ${uptimeHours} hours`);
    console.error(`📞 Total requests: ${this.stats.totalRequests}`);
    console.error(`✅ Successful requests: ${this.stats.successfulRequests}`);
    console.error(`❌ Failed requests: ${this.stats.failedRequests}`);

    if (this.stats.totalRequests > 0) {
      const successRate = ((this.stats.successfulRequests / this.stats.totalRequests) * 100).toFixed(2);
      console.error(`📈 Success rate: ${successRate}%`);
    }

    // 工具使用统计
    if (Object.keys(this.stats.toolUsage).length > 0) {
      console.error('\n🔧 Tool usage statistics:');
      Object.entries(this.stats.toolUsage)
        .sort(([, a], [, b]) => b - a)
        .forEach(([tool, count]) => {
          console.error(`  ${tool}: ${count} times`);
        });
    }

    // Credits状态
    const creditsOverview = this.creditsMonitor.getOverview();
    console.error(`\n💰 Credits status: ${creditsOverview.totalCredits} remaining`);
  }
}

module.exports = McpServer;
