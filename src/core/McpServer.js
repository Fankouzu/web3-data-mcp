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
  McpError,
} = require('@modelcontextprotocol/sdk/types.js');

const RootDataProvider = require('../providers/rootdata/RootDataProvider');
const { ErrorHandler } = require('./ErrorHandler');
const { CreditsMonitor } = require('./CreditsMonitor');
const { ToolRouter } = require('./ToolRouter');

class McpServer {
  constructor(config = {}) {
    this.config = {
      name: 'web3-data-mcp',
      version: '1.0.0',
      ...config
    };
    
    // 初始化核心组件
    this.server = new Server(
      {
        name: this.config.name,
        version: this.config.version,
      },
      {
        capabilities: {
          tools: {},
        },
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
      startTime: new Date(),
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      toolUsage: {}
    };

    this._setupEventHandlers();
  }

  /**
   * 初始化MCP服务器
   * @param {Object} providerConfigs - 供应商配置
   */
  async initialize(providerConfigs = {}) {
    try {
      console.error('🚀 正在初始化Web3 Data MCP服务器...');
      
      // 初始化数据供应商
      await this._initializeProviders(providerConfigs);
      
      // 设置MCP处理器
      this._setupMcpHandlers();
      
      // 启动Credits监控
      this.creditsMonitor.startAutoMonitoring();
      
      this.isInitialized = true;
      console.error('✅ MCP服务器初始化完成');
      console.error(`📊 已注册 ${this.providers.size} 个数据供应商`);
      console.error(`🔧 可用工具总数: ${this._getTotalToolsCount()}`);
      
      return true;
    } catch (error) {
      console.error('❌ MCP服务器初始化失败:', error.message);
      return false;
    }
  }

  /**
   * 启动MCP服务器
   */
  async start() {
    if (!this.isInitialized) {
      throw new Error('服务器未初始化，请先调用 initialize()');
    }

    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      
      console.error('🌟 Web3 Data MCP服务器已启动');
      console.error('📡 等待MCP客户端连接...');
      
      // 设置优雅关闭
      process.on('SIGINT', () => this.shutdown());
      process.on('SIGTERM', () => this.shutdown());
      
    } catch (error) {
      console.error('❌ 启动MCP服务器失败:', error.message);
      throw error;
    }
  }

  /**
   * 关闭服务器
   */
  async shutdown() {
    console.error('\n🛑 正在关闭MCP服务器...');
    
    // 停止监控
    this.creditsMonitor.stopAutoMonitoring();
    
    // 打印统计信息
    this._printFinalStats();
    
    // 关闭服务器
    await this.server.close();
    
    console.error('👋 MCP服务器已关闭');
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
        name: this.config.name,
        version: this.config.version,
        initialized: this.isInitialized,
        uptime: Date.now() - this.stats.startTime.getTime(),
        totalRequests: this.stats.totalRequests,
        successRate: this.stats.totalRequests > 0 
          ? (this.stats.successfulRequests / this.stats.totalRequests * 100).toFixed(2) + '%'
          : '0%'
      },
      providers: Array.from(this.providers.keys()),
      credits: creditsOverview,
      routing: routingStats,
      errors: {
        total: errorStats.totalErrors,
        byType: errorStats.errorsByType,
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
      console.error('🔧 正在初始化RootData供应商...');
      
      const rootDataProvider = new RootDataProvider(providerConfigs.rootdata);
      const initResult = await rootDataProvider.initialize();
      
      if (initResult) {
        this.providers.set('rootdata', rootDataProvider);
        this.toolRouter.registerProvider('rootdata', rootDataProvider);
        this.creditsMonitor.registerProvider('rootdata', rootDataProvider);
        
        console.error('✅ RootData供应商初始化成功');
      } else {
        throw new Error('RootData供应商初始化失败');
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
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema
          }))
        };
      } catch (error) {
        console.error('❌ 列出工具失败:', error.message);
        throw new McpError(
          ErrorCode.InternalError,
          `获取工具列表失败: ${error.message}`
        );
      }
    });

    // 执行工具调用
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name: toolName, arguments: toolArgs } = request.params;
      
      try {
        this.stats.totalRequests++;
        this._updateToolUsageStats(toolName);
        
        console.error(`🔧 执行工具调用: ${toolName}`);
        console.error(`📝 参数:`, JSON.stringify(toolArgs, null, 2));
        console.error(`⏰ 请求时间: ${new Date().toISOString()}`);
        
        // 构建查询字符串
        const query = toolArgs.query || toolArgs.token_symbol || toolArgs.ecosystem || 
                     toolArgs.project_id || `${toolName} request`;
        
        // 通过智能路由执行查询
        console.error(`🎯 路由查询: "${query}" 使用工具: ${toolName}`);
        const result = await this.toolRouter.routeQuery(query, {
          params: toolArgs,
          toolName: toolName,
          includeDetails: true
        });
        
        console.error(`📊 查询结果: ${result.success ? '成功' : '失败'}`);
        if (!result.success) {
          console.error(`❌ 错误详情: ${result.error}`);
          console.error(`🔍 错误堆栈:`, result.stack || 'No stack trace');
        }

        if (result.success) {
          this.stats.successfulRequests++;
          
          // 更新Credits监控
          if (result.credits) {
            this.creditsMonitor.updateCredits(
              result.provider, 
              result.credits.remaining, 
              result.credits.used
            );
          }

          console.error(`✅ 工具调用成功: ${toolName}`);
          
          return {
            content: [
              {
                type: "text",
                text: this._formatToolResponse(result)
              }
            ]
          };
        } else {
          this.stats.failedRequests++;
          console.error(`❌ 工具调用失败: ${toolName} - ${result.error}`);
          
          throw new McpError(
            ErrorCode.InvalidRequest,
            result.error || '工具调用失败'
          );
        }
        
      } catch (error) {
        this.stats.failedRequests++;
        console.error(`💥 工具调用异常: ${toolName}`, error.message);
        
        // 记录错误
        const errorResponse = this.errorHandler.handleApiError(
          error, 
          'mcp-server', 
          { toolName, toolArgs }
        );
        
        throw new McpError(
          ErrorCode.InternalError,
          errorResponse.error.message
        );
      }
    });

    // 添加对缺失MCP方法的支持 - 这些是可选的MCP协议方法
    // 注意：MCP SDK可能不支持直接的method字符串注册，暂时注释掉
    // 如果Claude Desktop调用这些方法，会收到Method not found错误，但不影响核心功能
    
    /*
    // Resources list (资源列表)
    this.server.setRequestHandler({ method: 'resources/list' }, async () => {
      console.error('📋 收到资源列表请求 - 返回空列表');
      return { resources: [] };
    });

    // Prompts list (提示词列表)  
    this.server.setRequestHandler({ method: 'prompts/list' }, async () => {
      console.error('📋 收到提示词列表请求 - 返回空列表');
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
    this.creditsMonitor.on('credits_warning', (data) => {
      console.error(`⚠️ Credits警告: ${data.provider} 剩余 ${data.credits} credits`);
    });

    this.creditsMonitor.on('credits_critical', (data) => {
      console.error(`🚨 Credits严重不足: ${data.provider} 剩余 ${data.credits} credits`);
    });

    this.creditsMonitor.on('credits_exhausted', (data) => {
      console.error(`💀 Credits已耗尽: ${data.provider}`);
    });

    // 错误频率监控
    setInterval(() => {
      if (this.errorHandler.hasFrequentErrors()) {
        console.error('⚠️ 检测到频繁错误，请检查系统状态');
      }
    }, 60000); // 每分钟检查一次
  }

  /**
   * 格式化工具响应
   * @private
   */
  _formatToolResponse(result) {
    const response = {
      success: true,
      provider: result.provider,
      data: result.data,
      metadata: {
        intent: result.intent,
        entities: result.entities,
        language: result.language,
        timestamp: new Date().toISOString()
      }
    };

    // 添加Credits信息
    if (result.credits) {
      response.credits = {
        remaining: result.credits.remaining,
        used: result.credits.used,
        status: result.credits.status
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
        total: tools.length,
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
    
    console.error('\n📊 服务器运行统计:');
    console.error(`⏰ 运行时间: ${uptimeHours} 小时`);
    console.error(`📞 总请求数: ${this.stats.totalRequests}`);
    console.error(`✅ 成功请求: ${this.stats.successfulRequests}`);
    console.error(`❌ 失败请求: ${this.stats.failedRequests}`);
    
    if (this.stats.totalRequests > 0) {
      const successRate = (this.stats.successfulRequests / this.stats.totalRequests * 100).toFixed(2);
      console.error(`📈 成功率: ${successRate}%`);
    }
    
    // 工具使用统计
    if (Object.keys(this.stats.toolUsage).length > 0) {
      console.error('\n🔧 工具使用统计:');
      Object.entries(this.stats.toolUsage)
        .sort(([,a], [,b]) => b - a)
        .forEach(([tool, count]) => {
          console.error(`  ${tool}: ${count} 次`);
        });
    }
    
    // Credits状态
    const creditsOverview = this.creditsMonitor.getOverview();
    console.error(`\n💰 Credits状态: ${creditsOverview.totalCredits} 剩余`);
  }
}

module.exports = McpServer;