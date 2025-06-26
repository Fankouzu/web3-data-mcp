/**
 * RootData数据供应商实现
 * 继承DataProvider基类，实现RootData特定的功能
 */

const DataProvider = require('../base/DataProvider');
const RootDataClient = require('./RootDataClient');
const { getAvailableEndpoints, getEndpointById } = require('./endpoints');

class RootDataProvider extends DataProvider {
  /**
   * 初始化RootData供应商
   * @param {Object} config - 配置对象
   * @param {string} config.apiKey - RootData API密钥
   * @param {number} config.timeout - 请求超时时间
   * @param {number} config.retries - 重试次数
   */
  constructor(config) {
    super('rootdata', config);
    
    if (!config.apiKey) {
      throw new Error('RootData API Key is required');
    }

    this.client = new RootDataClient(config.apiKey, {
      timeout: config.timeout || 30000,
      retries: config.retries || 3
    });

    this.endpoints = getAvailableEndpoints('basic'); // 初始为basic级别
  }

  /**
   * 初始化供应商
   * @returns {Promise<boolean>} 初始化是否成功
   */
  async initialize() {
    try {
      // 直接调用checkCredits获取用户信息
      const creditsResult = await this.checkCredits();
      
      if (!creditsResult.success) {
        throw new Error(`API凭据验证失败: ${creditsResult.error}`);
      }

      // 手动设置用户状态
      this.credits = creditsResult.credits;
      this.userLevel = creditsResult.level;
      this.lastCreditsCheck = new Date();

      // 更新可用端点
      this.endpoints = getAvailableEndpoints(this.userLevel);
      
      // 注册MCP工具
      this.registerTools();
      
      this.isInitialized = true;
      
      console.error(`✅ RootData供应商初始化成功 (等级: ${this.userLevel}, Credits: ${this.credits})`);
      return true;
    } catch (error) {
      console.error(`❌ RootData供应商初始化失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 检查API Key余额和等级
   * @returns {Promise<Object>} { credits, level, success }
   */
  async checkCredits() {
    try {
      const result = await this.client.checkCredits();
      return {
        success: true,
        credits: result.credits,
        level: result.level,
        totalCredits: result.totalCredits,
        lastMonthCredits: result.lastMonthCredits
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        credits: 0,
        level: 'unknown'
      };
    }
  }

  /**
   * 执行API调用
   * @param {string} endpointId - 端点ID
   * @param {Object} params - 请求参数
   * @returns {Promise<Object>} API响应结果
   */
  async executeApiCall(endpointId, params) {
    const endpoint = getEndpointById(endpointId);
    
    if (!endpoint) {
      throw new Error(`未知的端点ID: ${endpointId}`);
    }

    // 检查用户等级权限
    if (!this.hasAccess(endpoint.requiredLevel)) {
      throw new Error(`权限不足，需要 ${endpoint.requiredLevel} 级别，当前为 ${this.userLevel}`);
    }

    // 检查credits余额
    if (!this.hasCredits(endpoint.creditsPerCall)) {
      throw new Error(`Credits不足，需要 ${endpoint.creditsPerCall}，当前剩余 ${this.credits}`);
    }

    try {
      let result;
      const language = this.detectQueryLanguage(params.query || '') || 'en';
      
      console.error(`🌐 执行RootData API调用: ${endpointId}`);
      console.error(`📤 请求参数:`, JSON.stringify(params, null, 2));
      console.error(`🔤 检测语言: ${language}`);

      switch (endpointId) {
        case 'credits_check':
          result = await this.client.checkCredits();
          break;

        case 'search_entities':
          result = await this.client.searchEntities(
            params.query, 
            language, 
            params.precise_x_search
          );
          break;

        case 'project_details':
          result = await this.client.getProjectDetails(params.project_id, language);
          break;

        case 'funding_rounds':
          result = await this.client.getFundingRounds(params, language);
          break;

        case 'token_info':
          result = await this.client.getTokenInfo(params.token_symbol, language);
          break;

        case 'projects_by_ecosystem':
          result = await this.client.getProjectsByEcosystem(params.ecosystem, language);
          break;

        default:
          throw new Error(`端点 ${endpointId} 暂未实现`);
      }

      console.error(`📥 API调用成功，端点: ${endpointId}`);
      
      // 格式化响应并更新credits
      return this.formatResponse(result, endpoint.creditsPerCall);

    } catch (error) {
      console.error(`💥 API调用失败，端点: ${endpointId}`);
      console.error(`❌ 错误信息: ${error.message}`);
      console.error(`🔍 错误堆栈:`, error.stack);
      throw new Error(`API调用失败: ${error.message}`);
    }
  }

  /**
   * 获取可用工具列表
   * @returns {Array} 工具定义数组
   */
  getAvailableTools() {
    this.updateAvailableTools();
    return this.availableTools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      endpoint: tool.endpoint,
      requiredLevel: tool.requiredLevel,
      creditsPerCall: tool.creditsPerCall,
      category: tool.category,
      outputDescription: tool.outputDescription
    }));
  }

  /**
   * 注册MCP工具
   * @private
   */
  registerTools() {
    this.endpoints.forEach(endpoint => {
      const toolDefinition = {
        name: endpoint.name,
        description: endpoint.description,
        inputSchema: endpoint.inputSchema,
        endpoint: endpoint.id,
        requiredLevel: endpoint.requiredLevel,
        creditsPerCall: endpoint.creditsPerCall,
        category: endpoint.category,
        outputDescription: endpoint.outputDescription
      };

      this.registerTool(toolDefinition);
    });

    console.error(`📝 已注册 ${this.tools.size} 个RootData工具`);
  }

  /**
   * 搜索Web3实体（智能路由入口）
   * @param {string} query - 搜索查询
   * @param {Object} options - 搜索选项
   * @returns {Promise<Object>} 搜索结果
   */
  async searchWeb3Entities(query, options = {}) {
    return await this.executeApiCall('search_entities', {
      query,
      precise_x_search: options.preciseXSearch || false
    });
  }

  /**
   * 获取项目详情
   * @param {string} projectId - 项目ID
   * @returns {Promise<Object>} 项目详情
   */
  async getProjectDetails(projectId) {
    return await this.executeApiCall('project_details', { project_id: projectId });
  }

  /**
   * 获取融资信息
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} 融资信息
   */
  async getFundingRounds(params) {
    return await this.executeApiCall('funding_rounds', params);
  }

  /**
   * 获取代币信息
   * @param {string} tokenSymbol - 代币符号
   * @returns {Promise<Object>} 代币信息
   */
  async getTokenInfo(tokenSymbol) {
    return await this.executeApiCall('token_info', { token_symbol: tokenSymbol });
  }

  /**
   * 按生态系统搜索项目
   * @param {string} ecosystem - 生态系统名称
   * @returns {Promise<Object>} 项目列表
   */
  async getProjectsByEcosystem(ecosystem) {
    return await this.executeApiCall('projects_by_ecosystem', { ecosystem });
  }

  /**
   * 智能查询路由
   * 根据查询内容自动选择最合适的API端点
   * @param {string} query - 用户查询
   * @returns {Promise<Object>} 查询结果
   */
  async smartQuery(query) {
    const queryLower = query.toLowerCase();
    
    // 简单的意图识别
    if (queryLower.includes('funding') || queryLower.includes('投资') || queryLower.includes('融资')) {
      // 先搜索实体，然后获取融资信息
      const searchResult = await this.searchWeb3Entities(query);
      if (searchResult.success && searchResult.data.data.length > 0) {
        const firstEntity = searchResult.data.data[0];
        if (firstEntity.project_id) {
          return await this.getFundingRounds({ project_id: firstEntity.project_id });
        }
      }
      return searchResult;
    }
    
    if (queryLower.includes('token') || queryLower.includes('代币') || queryLower.includes('币价')) {
      // 尝试提取代币符号
      const tokenMatch = query.match(/\b([A-Z]{2,10})\b/);
      if (tokenMatch) {
        return await this.getTokenInfo(tokenMatch[1]);
      }
    }
    
    if (queryLower.includes('ecosystem') || queryLower.includes('生态') || 
        queryLower.includes('ethereum') || queryLower.includes('solana') || 
        queryLower.includes('polygon')) {
      // 生态系统查询
      const ecosystems = ['ethereum', 'solana', 'polygon', 'avalanche', 'arbitrum'];
      const matchedEcosystem = ecosystems.find(eco => queryLower.includes(eco));
      if (matchedEcosystem) {
        return await this.getProjectsByEcosystem(matchedEcosystem);
      }
    }
    
    // 默认使用通用搜索
    return await this.searchWeb3Entities(query);
  }

  /**
   * 更新供应商状态
   * 重新检查credits和等级，更新可用工具
   */
  async refreshStatus() {
    const credentialsResult = await this.validateCredentials();
    
    if (credentialsResult.success) {
      this.endpoints = getAvailableEndpoints(this.userLevel);
      this.updateAvailableTools();
      
      console.error(`🔄 RootData状态已更新 (等级: ${this.userLevel}, Credits: ${this.credits})`);
    }
    
    return credentialsResult;
  }

  /**
   * 获取供应商的详细状态信息
   * @returns {Object} 详细状态
   */
  getDetailedStatus() {
    const baseStatus = this.getStatus();
    const clientStats = this.client.getStats();
    
    return {
      ...baseStatus,
      apiStats: clientStats,
      creditsStatus: this.getCreditsStatus(),
      availableEndpoints: this.endpoints.length,
      endpoints: this.endpoints.map(ep => ({
        id: ep.id,
        name: ep.name,
        category: ep.category,
        creditsPerCall: ep.creditsPerCall,
        available: this.hasAccess(ep.requiredLevel) && this.hasCredits(ep.creditsPerCall)
      }))
    };
  }
}

module.exports = RootDataProvider;