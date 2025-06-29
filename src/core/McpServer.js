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
const PromptManager = require('./PromptManager');

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
    
    // 初始化提示词管理器
    this.promptManager = new PromptManager(config.prompts || {});

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
      console.error('Initializing Web3 Data MCP Server...');

      // 初始化提示词管理器
      await this.promptManager.initialize();
      
      // 初始化数据供应商
      await this._initializeProviders(providerConfigs);

      // 设置MCP处理器
      this._setupMcpHandlers();

      // 启动Credits监控
      this.creditsMonitor.startAutoMonitoring();
      
      // 注入提示词管理器到其他组件
      this.toolRouter.setPromptManager(this.promptManager);
      this.errorHandler.setPromptManager(this.promptManager);

      this.isInitialized = true;
      console.error('MCP Server initialization completed');
      console.error(`Registered ${this.providers.size} data providers`);
      console.error(`Total available tools: ${this._getTotalToolsCount()}`);

      return true;
    } catch (error) {
      console.error('MCP Server initialization failed:', error.message);
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

      console.error('Web3 Data MCP Server started');
      console.error('Waiting for MCP client connections...');

      // 设置优雅关闭
      process.on('SIGINT', () => this.shutdown());
      process.on('SIGTERM', () => this.shutdown());
    } catch (error) {
      console.error('Failed to start MCP Server:', error.message);
      throw error;
    }
  }

  /**
   * 关闭服务器
   */
  async shutdown() {
    console.error('\nShutting down MCP Server...');

    // 停止监控
    this.creditsMonitor.stopAutoMonitoring();

    // 打印统计信息
    this._printFinalStats();

    // 关闭服务器
    await this.server.close();

    console.error('MCP Server shutdown complete');
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
      console.error('Initializing RootData provider...');

      const rootDataProvider = new RootDataProvider(providerConfigs.rootdata);
      const initResult = await rootDataProvider.initialize();

      if (initResult) {
        this.providers.set('rootdata', rootDataProvider);
        this.toolRouter.registerProvider('rootdata', rootDataProvider);
        this.creditsMonitor.registerProvider('rootdata', rootDataProvider);

        console.error('RootData provider initialized successfully');
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
          tools: availableTools.map(tool => {
            // 获取工具的提示词信息
            const systemPrompt = this.promptManager.getToolPrompt(
              tool.name, 
              'system', 
              { language: 'en' }
            );
            const usagePrompt = this.promptManager.getToolPrompt(
              tool.name, 
              'usage', 
              { language: 'en' }
            );
            const examples = this.promptManager.getToolPrompt(
              tool.name, 
              'examples', 
              { language: 'en' }
            );
            
            return {
              name:        tool.name,
              description: tool.description,
              inputSchema: tool.inputSchema,
              // 新增提示词相关字段
              guidance: {
                system: systemPrompt,
                usage: usagePrompt,
                examples: examples
              }
            };
          })
        };
      } catch (error) {
        console.error('Failed to list tools:', error.message);
        throw new McpError(ErrorCode.InternalError, `Failed to list tools: ${error.message}`);
      }
    });

    // 执行工具调用
    this.server.setRequestHandler(CallToolRequestSchema, async request => {
      const { name: toolName, arguments: toolArgs } = request.params;
      const requestId = Math.random().toString(36).substr(2, 9);

      try {
        this.stats.totalRequests++;
        this._updateToolUsageStats(toolName);

        console.error(`[${requestId}] Executing tool call: ${toolName}`);
        console.error(`[${requestId}] Parameters:`, JSON.stringify(toolArgs, null, 2));
        console.error(`[${requestId}] Request time: ${new Date().toISOString()}`);

        // 验证工具是否存在
        const availableTools = this.toolRouter.getAvailableTools();
        const toolExists = availableTools.some(tool => tool.name === toolName);
        
        if (!toolExists) {
          console.error(`[${requestId}] ERROR: Tool ${toolName} not found in available tools`);
          console.error(`[${requestId}] Available tools:`, availableTools.map(t => t.name));
          throw new McpError(ErrorCode.InvalidRequest, `Tool ${toolName} is not available`);
        }

        console.error(`[${requestId}] Tool validated successfully`);

        // 构建查询字符串 - 确保query始终是字符串
        let query = toolArgs.query || toolArgs.token_symbol || toolArgs.ecosystem;
        
        // 对于特殊工具，处理非字符串参数
        if (!query) {
          if (toolArgs.project_id && (toolName === 'get_project_details' || toolName.includes('project'))) {
            query = `project_${toolArgs.project_id}`;
          } else if (toolArgs.org_id && (toolName === 'get_organization_details' || toolName.includes('organization'))) {
            query = `organization_${toolArgs.org_id}`;
          } else if (toolArgs.contract_address && toolName.includes('project')) {
            query = toolArgs.contract_address;
          } else {
            query = `${toolName} request`;
          }
        }
        
        // 确保query是字符串
        query = String(query);

        console.error(`[${requestId}] Built query: "${query}"`);
        console.error(`[${requestId}] Query type: ${typeof query}`);

        // 通过智能路由执行查询
        console.error(`[${requestId}] Starting route query with tool: ${toolName}`);
        
        let result;
        try {
          result = await this.toolRouter.routeQuery(query, {
            params:         toolArgs,
            toolName,
            includeDetails: true,
            requestId       // 传递requestId用于更详细的日志追踪
          });
          console.error(`[${requestId}] Route query completed`);
        } catch (routeError) {
          console.error(`[${requestId}] Route query FAILED:`, routeError.message);
          console.error(`[${requestId}] Route error stack:`, routeError.stack);
          throw routeError;
        }

        console.error(`[${requestId}] Query result: ${result.success ? 'Success' : 'Failed'}`);
        
        if (!result.success) {
          console.error(`[${requestId}] Error details: ${result.error}`);
          console.error(`[${requestId}] Result object:`, JSON.stringify(result, null, 2));
          
          // 检查是否是credits问题
          if (result.error && result.error.includes('credit')) {
            console.error(`[${requestId}] Credits-related error detected`);
          }
          
          // 检查是否是API问题
          if (result.error && (result.error.includes('API') || result.error.includes('HTTP'))) {
            console.error(`[${requestId}] API-related error detected`);
          }
        }

        if (result.success) {
          this.stats.successfulRequests++;

          // 更新Credits监控
          if (result.credits) {
            console.error(`[${requestId}] Updating credits monitor:`, result.credits);
            this.creditsMonitor.updateCredits(result.provider, result.credits.remaining, result.credits.used);
          }

          console.error(`[${requestId}] Tool call successful: ${toolName}`);

          const formattedResponse = this._formatToolResponse(result);
          console.error(`[${requestId}] Response formatted successfully, size: ${formattedResponse.length} chars`);

          return {
            content: [
              {
                type: 'text',
                text: formattedResponse
              }
            ]
          };
        } else {
          this.stats.failedRequests++;
          console.error(`[${requestId}] Tool call failed: ${toolName} - ${result.error}`);

          throw new McpError(ErrorCode.InvalidRequest, result.error || 'Tool call failed');
        }
      } catch (error) {
        this.stats.failedRequests++;
        console.error(`[${requestId}] Tool call EXCEPTION: ${toolName}`);
        console.error(`[${requestId}] Exception message: ${error.message}`);
        console.error(`[${requestId}] Exception stack:`, error.stack);
        console.error(`[${requestId}] Exception type: ${error.constructor.name}`);
        
        // 检查是否是MCP错误
        if (error instanceof McpError) {
          console.error(`[${requestId}] This is already an MCP error, re-throwing`);
          throw error;
        }

        // 记录错误
        try {
          const errorResponse = this.errorHandler.handleApiError(error, 'mcp-server', { toolName, toolArgs, requestId });
          console.error(`[${requestId}] Error handler response:`, errorResponse);
          throw new McpError(ErrorCode.InternalError, errorResponse.error.message);
        } catch (handlerError) {
          console.error(`[${requestId}] Error handler FAILED:`, handlerError.message);
          throw new McpError(ErrorCode.InternalError, `System internal error, please try again later`);
        }
      }
    });

    // 添加对缺失MCP方法的支持 - 这些是可选的MCP协议方法
    // 注意：MCP SDK可能不支持直接的method字符串注册，暂时注释掉
    // 如果Claude Desktop调用这些方法，会收到Method not found错误，但不影响核心功能

    /*
    // Resources list (资源列表)
    this.server.setRequestHandler({ method: 'resources/list' }, async () => {
      console.error('Received resource list request - returning empty list');
      return { resources: [] };
    });

    // Prompts list (提示词列表)
    this.server.setRequestHandler({ method: 'prompts/list' }, async () => {
      console.error('Received prompts list request - returning empty list');
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
      console.error(`Credits warning: ${data.provider} has ${data.credits} credits remaining`);
    });

    this.creditsMonitor.on('credits_critical', data => {
      console.error(`Credits critically low: ${data.provider} has ${data.credits} credits remaining`);
    });

    this.creditsMonitor.on('credits_exhausted', data => {
      console.error(`Credits exhausted: ${data.provider}`);
    });

    // 错误频率监控
    setInterval(() => {
      if (this.errorHandler.hasFrequentErrors()) {
        console.error('Frequent errors detected, please check system status');
      }
    }, 60000); // 每分钟检查一次
  }

  /**
   * 格式化工具响应
   * @private
   */
  _formatToolResponse(result) {
    // 获取响应提示词
    const language = result.language || 'en';
    const formatGuidance = this.promptManager.getResponsePrompt('data_formatting', { language });
    const interpretGuidance = this.promptManager.getResponsePrompt('data_interpretation', { language });
    const suggestionGuidance = this.promptManager.getResponsePrompt('suggestions', { language });
    
    // 基础响应结构
    const response = {
      success:  true,
      provider: result.provider,
      tool:     result.tool,
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

    // 使用提示词增强响应
    if (this.promptManager) {
      // 添加数据解释
      response.interpretation = this._generateDataInterpretation(result, interpretGuidance);
      
      // 添加建议
      response.suggestions = this._generateSuggestions(result, suggestionGuidance);
      
      // 添加数据质量指标
      response.dataQuality = this._assessDataQuality(result);
      
      // 如果是空结果，提供更友好的处理
      if (!result.data || (Array.isArray(result.data) && result.data.length === 0)) {
        const emptyGuidance = this.promptManager.getResponsePrompt('empty_results', { language });
        response.emptyResultHelp = this._generateEmptyResultHelp(result, emptyGuidance);
      }
    }

    return JSON.stringify(response, null, 2);
  }

  /**
   * 生成数据解释
   * @private
   */
  _generateDataInterpretation(result, guidance) {
    const interpretation = {
      summary: '',
      highlights: [],
      insights: []
    };

    if (!result.data) return interpretation;

    // 根据工具类型生成解释
    switch (result.tool) {
      case 'search_web3_entities':
        if (Array.isArray(result.data)) {
          interpretation.summary = `Found ${result.data.length} matching entities`;
          if (result.data.length > 0) {
            interpretation.highlights.push(`Top result: ${result.data[0].name || result.data[0].title}`);
          }
        }
        break;
        
      case 'get_project_details':
        if (result.data.name) {
          interpretation.summary = `Details for ${result.data.name}`;
          if (result.data.marketCap) {
            interpretation.highlights.push(`Market Cap: $${this._formatNumber(result.data.marketCap)}`);
          }
          if (result.data.fundingTotal) {
            interpretation.highlights.push(`Total Funding: $${this._formatNumber(result.data.fundingTotal)}`);
          }
        }
        break;
        
      default:
        interpretation.summary = 'Data retrieved successfully';
    }

    return interpretation;
  }

  /**
   * 生成建议
   * @private
   */
  _generateSuggestions(result, guidance) {
    const suggestions = [];

    // 根据工具和结果生成建议
    if (result.tool === 'search_web3_entities' && Array.isArray(result.data) && result.data.length > 0) {
      suggestions.push({
        action: 'get_details',
        description: `Get detailed information about ${result.data[0].name || 'the first result'}`,
        query: `get_project_details for project_id ${result.data[0].id}`
      });
      
      if (result.data.length > 1) {
        suggestions.push({
          action: 'compare',
          description: 'Compare the top results',
          query: `compare ${result.data.slice(0, 3).map(d => d.name).join(', ')}`
        });
      }
    }

    if (result.tool === 'get_project_details' && result.data) {
      if (result.data.token) {
        suggestions.push({
          action: 'token_info',
          description: `Get token information for ${result.data.token.symbol}`,
          query: `get_token_info ${result.data.token.symbol}`
        });
      }
      
      if (result.data.ecosystem) {
        suggestions.push({
          action: 'ecosystem_projects',
          description: `Explore other ${result.data.ecosystem} projects`,
          query: `get_projects_by_ecosystem ${result.data.ecosystem}`
        });
      }
    }

    return suggestions;
  }

  /**
   * 评估数据质量
   * @private
   */
  _assessDataQuality(result) {
    const quality = {
      score: 0,
      indicators: [],
      level: 'unknown'
    };

    if (!result.data) {
      quality.level = 'no_data';
      return quality;
    }

    // 数据完整性检查
    let completeness = 0;
    let totalFields = 0;
    
    if (typeof result.data === 'object' && !Array.isArray(result.data)) {
      const importantFields = ['name', 'description', 'website', 'social'];
      importantFields.forEach(field => {
        totalFields++;
        if (result.data[field]) completeness++;
      });
      
      const completenessRatio = totalFields > 0 ? completeness / totalFields : 0;
      quality.score = completenessRatio * 100;
      
      if (completenessRatio >= 0.8) {
        quality.level = 'high';
        quality.indicators.push('🟢 High data completeness');
      } else if (completenessRatio >= 0.5) {
        quality.level = 'medium';
        quality.indicators.push('🟡 Medium data completeness');
      } else {
        quality.level = 'low';
        quality.indicators.push('🔴 Low data completeness');
      }
    }

    // 数据新鲜度（如果有时间戳）
    if (result.data.updatedAt || result.data.lastUpdated) {
      const updateTime = new Date(result.data.updatedAt || result.data.lastUpdated);
      const daysSinceUpdate = (Date.now() - updateTime) / (1000 * 60 * 60 * 24);
      
      if (daysSinceUpdate < 1) {
        quality.indicators.push('🟢 Updated recently');
      } else if (daysSinceUpdate < 7) {
        quality.indicators.push('🟡 Updated this week');
      } else {
        quality.indicators.push('🔴 Older data');
      }
    }

    return quality;
  }

  /**
   * 生成空结果帮助
   * @private
   */
  _generateEmptyResultHelp(result, guidance) {
    const help = {
      message: result.language === 'zh' ? '未找到相关数据' : 'No data found',
      possibleReasons: [],
      suggestions: []
    };

    // 可能的原因
    if (result.intent.type === 'search') {
      help.possibleReasons.push(
        result.language === 'zh' 
          ? '搜索词可能拼写错误或过于具体'
          : 'Search term might be misspelled or too specific'
      );
    }

    // 建议
    help.suggestions.push(
      result.language === 'zh'
        ? '尝试使用更通用的搜索词'
        : 'Try using more general search terms'
    );

    if (result.entities.length > 0) {
      help.suggestions.push(
        result.language === 'zh'
          ? '尝试搜索单个关键词而不是完整短语'
          : 'Try searching for individual keywords instead of full phrases'
      );
    }

    return help;
  }

  /**
   * 格式化数字
   * @private
   */
  _formatNumber(num) {
    if (typeof num !== 'number') return num;
    
    if (num >= 1e9) {
      return (num / 1e9).toFixed(2) + 'B';
    } else if (num >= 1e6) {
      return (num / 1e6).toFixed(2) + 'M';
    } else if (num >= 1e3) {
      return (num / 1e3).toFixed(2) + 'K';
    } else {
      return num.toLocaleString();
    }
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

    console.error('\nServer runtime statistics:');
    console.error(`Uptime: ${uptimeHours} hours`);
    console.error(`Total requests: ${this.stats.totalRequests}`);
    console.error(`Successful requests: ${this.stats.successfulRequests}`);
    console.error(`Failed requests: ${this.stats.failedRequests}`);

    if (this.stats.totalRequests > 0) {
      const successRate = ((this.stats.successfulRequests / this.stats.totalRequests) * 100).toFixed(2);
      console.error(`Success rate: ${successRate}%`);
    }

    // 工具使用统计
    if (Object.keys(this.stats.toolUsage).length > 0) {
      console.error('\nTool usage statistics:');
      Object.entries(this.stats.toolUsage)
        .sort(([, a], [, b]) => b - a)
        .forEach(([tool, count]) => {
          console.error(`  ${tool}: ${count} times`);
        });
    }

    // Credits状态
    const creditsOverview = this.creditsMonitor.getOverview();
    console.error(`\nCredits status: ${creditsOverview.totalCredits} remaining`);
  }
}

module.exports = McpServer;
