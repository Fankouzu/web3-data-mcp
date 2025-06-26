/**
 * RootData数据供应商实现
 * 继承DataProvider基类，实现RootData特定的功能
 */

const DataProvider = require('../base/DataProvider');
const RootDataClient = require('./RootDataClient');
const { getAvailableEndpoints, getEndpointById } = require('./endpoints');
const { PerformanceOptimizer } = require('../../utils/performanceOptimizer');
const { validateResponse, validateApiResponse } = require('../../validators/responseValidator');

class RootDataProvider extends DataProvider {
  /**
   * 初始化RootData供应商
   * @param {Object} config - 配置对象
   * @param {string} config.apiKey - RootData API密钥
   * @param {number} config.timeout - 请求超时时间
   * @param {number} config.retries - 重试次数
   */
  constructor(config = {}) {
    super('rootdata', config);

    this.apiKey = config.apiKey;
    this.isConfigured = false;

    // 初始化性能优化器
    this.performanceOptimizer = new PerformanceOptimizer({
      cache: {
        enabled: config.enableCache !== false,
        maxSize: config.cacheMaxSize || 500,
        ttl: config.cacheTtl || 300000 // 5分钟
      },
      rateLimit: {
        maxRequests: config.maxRequestsPerMinute || 60,
        windowMs: 60000
      },
      batch: {
        batchSize: config.batchSize || 5,
        batchDelay: config.batchDelay || 100
      },
      memory: {
        enabled: config.enableMemoryMonitoring !== false && process.env.NODE_ENV !== 'test' && typeof jest === 'undefined',
        maxMemoryMB: config.maxMemoryMB || 500
      }
    });

    if (config.apiKey) {
      this.configure(config);
    }
  }

  /**
   * 配置RootData供应商
   * @param {Object} config - 配置对象
   * @param {string} config.apiKey - RootData API密钥
   * @param {number} config.timeout - 请求超时时间
   * @param {number} config.retries - 重试次数
   */
  configure(config) {
    if (!config.apiKey) {
      throw new Error('RootData API密钥是必需的');
    }

    this.apiKey = config.apiKey;
    this.client = new RootDataClient(config.apiKey, {
      timeout: config.timeout || 30000,
      retries: config.retries || 3
    });

    this.endpoints = getAvailableEndpoints('basic'); // 初始为basic级别
    this.isConfigured = true;
  }

  /**
   * 初始化供应商
   * @returns {Promise<boolean>} 初始化是否成功
   */
  async initialize() {
    try {
      if (!this.isConfigured) {
        throw new Error('Provider must be configured before initialization');
      }

      // 直接调用checkCredits获取用户信息
      const creditsResult = await this.checkCredits();

      if (!creditsResult.success) {
        throw new Error(`API credentials validation failed: ${creditsResult.error}`);
      }

      // 手动设置用户状态
      this.credits = creditsResult.data.credits || 0;
      this.userLevel = creditsResult.data.level || 'basic';
      this.lastCreditsCheck = new Date();

      // 更新可用端点
      this.endpoints = getAvailableEndpoints(this.userLevel);

      // 注册MCP工具
      this.registerTools();

      this.isInitialized = true;

      console.log(`✅ RootData provider initialized successfully (Level: ${this.userLevel}, Credits: ${this.credits})`);
      return true;
    } catch (error) {
      console.error(`❌ RootData provider initialization failed: ${error.message}`);
      return false;
    }
  }

  /**
   * 检查API Key余额和等级
   * @returns {Promise<Object>} { credits, level, success }
   */
  async checkCredits() {
    try {
      if (!this.client) {
        throw new Error('Provider not configured');
      }

      const result = await this.client.checkCredits();
      return {
        success: true,
        data:    result.data
      };
    } catch (error) {
      return {
        success: false,
        error:   error.message,
        data:    {
          credits: 0,
          level:   'unknown'
        }
      };
    }
  }

  /**
   * 执行API调用（带性能优化和数据验证）
   * @param {string} endpointId - 端点ID
   * @param {Object} params - 请求参数
   * @param {Object} options - 执行选项
   * @returns {Promise<Object>} API响应结果
   */
  async executeApiCall(endpointId, params = {}, options = {}) {
    // 检查provider是否已配置
    if (!this.client) {
      throw new Error('Provider must be configured');
    }

    const endpoint = getEndpointById(endpointId);

    if (!endpoint) {
      throw new Error(`Unknown endpoint ID: ${endpointId}`);
    }

    // 检查用户等级权限
    if (!this.hasAccess(endpoint.requiredLevel)) {
      throw new Error(
        `Insufficient permissions, requires ${endpoint.requiredLevel} level, current is ${this.userLevel}`
      );
    }

    // 检查credits余额
    if (!this.hasCredits(endpoint.creditsPerCall)) {
      throw new Error(`Insufficient credits, requires ${endpoint.creditsPerCall}, current remaining ${this.credits}`);
    }

    // 使用性能优化器执行请求
    return await this.performanceOptimizer.optimizeRequest(
      endpointId,
      params,
      async () => {
        try {
          let result;
          const language = this.detectQueryLanguage(params.query || '') || 'en';

          console.log(`🌐 Executing RootData API call: ${endpointId}`);
          console.log(`📤 Request parameters:`, JSON.stringify(params, null, 2));
          console.log(`🔤 Detected language: ${language}`);

          switch (endpointId) {
            case 'credits_check':
              result = await this.client.checkCredits();
              break;

            case 'search_entities':
              result = await this.client.searchEntities(params.query, language, params.precise_x_search);
              break;

            case 'get_project':
              result = await this.client.getProject(
                params.project_id,
                params.contract_address,
                params.include_team,
                params.include_investors
              );
              break;

            case 'get_organization':
              result = await this.client.getOrganization(
                params.org_id,
                params.include_team,
                params.include_investments
              );
              break;

            case 'get_people':
              result = await this.client.getPeople(params.people_id, language);
              break;

            case 'get_id_map':
              result = await this.client.getIdMap(params.type, language);
              break;

            case 'get_funding_rounds':
              result = await this.client.getFundingRounds(params, language);
              break;

            case 'get_investors':
              result = await this.client.getInvestors(params.page, params.page_size, language);
              break;

            case 'get_twitter_map':
              result = await this.client.getTwitterMap(params.type, language);
              break;

            case 'projects_by_ecosystems':
              result = await this.client.getProjectsByEcosystems(params.ecosystem_ids, language);
              break;

            case 'projects_by_tags':
              result = await this.client.getProjectsByTags(params.tag_ids, language);
              break;

            case 'ecosystem_map':
              result = await this.client.getEcosystemMap(language);
              break;

            case 'tag_map':
              result = await this.client.getTagMap(language);
              break;

            default:
              throw new Error(`Endpoint ${endpointId} not yet implemented`);
          }

          console.log(`📥 API call successful, endpoint: ${endpointId}`);

          // 验证响应结构
          if (!validateApiResponse(result)) {
            console.warn(`⚠️ Invalid response structure for ${endpointId}`);
          }

          // 验证响应数据
          if (result.success && result.data) {
            try {
              result.data = validateResponse(endpointId, result.data, options);
              console.log(`✅ Response data validated for ${endpointId}`);
            } catch (validationError) {
              console.warn(`⚠️ Data validation warning for ${endpointId}:`, validationError.message);
            }
          }

          // 格式化响应并更新credits
          return this.formatResponse(result, endpoint.creditsPerCall);
        } catch (error) {
          console.error(`💥 API call failed, endpoint: ${endpointId}`);
          console.error(`❌ Error message: ${error.message}`);
          console.error(`🔍 Error stack:`, error.stack);
          throw new Error(`API call failed: ${error.message}`);
        }
      }
    );
  }

  /**
   * 获取可用工具列表
   * @returns {Array} 工具定义数组
   */
  getAvailableTools() {
    this.updateAvailableTools();
    return this.availableTools.map(tool => ({
      name:              tool.name,
      description:       tool.description,
      inputSchema:       tool.inputSchema,
      endpoint:          tool.endpoint,
      requiredLevel:     tool.requiredLevel,
      creditsPerCall:    tool.creditsPerCall,
      category:          tool.category,
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
        name:              endpoint.name,
        description:       endpoint.description,
        inputSchema:       endpoint.inputSchema,
        endpoint:          endpoint.id,
        requiredLevel:     endpoint.requiredLevel,
        creditsPerCall:    endpoint.creditsPerCall,
        category:          endpoint.category,
        outputDescription: endpoint.outputDescription
      };

      this.registerTool(toolDefinition);
    });

    console.log(`📝 Registered ${this.tools.size} RootData tools`);
  }

  // ========== 公共API方法 ==========

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
   * @param {string|number} projectId - 项目ID
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 项目详情
   */
  async getProjectDetails(projectId, options = {}) {
    return await this.executeApiCall('get_project', {
      project_id:        projectId,
      include_team:      options.includeTeam || false,
      include_investors: options.includeInvestors || false
    });
  }

  /**
   * 通过合约地址获取项目详情
   * @param {string} contractAddress - 合约地址
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 项目详情
   */
  async getProjectByContract(contractAddress, options = {}) {
    return await this.executeApiCall('get_project', {
      contract_address:  contractAddress,
      include_team:      options.includeTeam || false,
      include_investors: options.includeInvestors || false
    });
  }

  /**
   * 获取机构详情
   * @param {number} orgId - 机构ID
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 机构详情
   */
  async getOrganizationDetails(orgId, options = {}) {
    return await this.executeApiCall('get_organization', {
      org_id:              orgId,
      include_team:        options.includeTeam || false,
      include_investments: options.includeInvestments || false
    });
  }

  /**
   * 获取人物详情 (Pro级别)
   * @param {number} peopleId - 人物ID
   * @returns {Promise<Object>} 人物详情
   */
  async getPeopleDetails(peopleId) {
    return await this.executeApiCall('get_people', { people_id: peopleId });
  }

  /**
   * 获取ID映射 (Plus级别)
   * @param {number} type - 类型: 1项目 2机构 3人物
   * @returns {Promise<Object>} ID列表
   */
  async getIdMapping(type) {
    return await this.executeApiCall('get_id_map', { type });
  }

  /**
   * 获取融资轮次信息 (Plus级别)
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} 融资信息
   */
  async getFundingInformation(params = {}) {
    return await this.executeApiCall('get_funding_rounds', params);
  }

  /**
   * 获取投资者信息 (Plus级别)
   * @param {number} page - 页码
   * @param {number} pageSize - 每页条数
   * @returns {Promise<Object>} 投资者信息
   */
  async getInvestorDetails(page = 1, pageSize = 10) {
    return await this.executeApiCall('get_investors', { page, page_size: pageSize });
  }

  /**
   * 获取Twitter数据 (Plus级别)
   * @param {number} type - 类型: 1项目 2机构 3人物
   * @returns {Promise<Object>} Twitter数据
   */
  async getTwitterData(type) {
    return await this.executeApiCall('get_twitter_map', { type });
  }

  /**
   * 根据生态系统获取项目 (Pro级别)
   * @param {string} ecosystemIds - 生态ID，多个逗号分隔
   * @returns {Promise<Object>} 项目列表
   */
  async getProjectsByEcosystems(ecosystemIds) {
    return await this.executeApiCall('projects_by_ecosystems', { ecosystem_ids: ecosystemIds });
  }

  /**
   * 根据标签获取项目 (Pro级别)
   * @param {string} tagIds - 标签ID，多个逗号分隔
   * @returns {Promise<Object>} 项目列表
   */
  async getProjectsByTags(tagIds) {
    return await this.executeApiCall('projects_by_tags', { tag_ids: tagIds });
  }

  // ========== Pro级别特殊方法（需要添加到client中） ==========

  /**
   * 获取热门项目 (Pro级别)
   * @param {number} days - 天数: 1 或 7
   * @returns {Promise<Object>} 热门项目
   */
  async getHotProjects(days) {
    return await this.executeApiCall('hot_projects', { days });
  }

  /**
   * 获取生态系统映射 (Pro级别)
   * @returns {Promise<Object>} 生态系统列表
   */
  async getEcosystemMap() {
    return await this.executeApiCall('ecosystem_map', {});
  }

  /**
   * 获取标签映射 (Pro级别)
   * @returns {Promise<Object>} 标签列表
   */
  async getTagMap() {
    return await this.executeApiCall('tag_map', {});
  }

  /**
   * 智能查询路由
   * @param {string} query - 自然语言查询
   * @returns {Promise<Object>} 查询结果
   */
  async smartQuery(query) {
    try {
      const language = this.detectQueryLanguage(query);

      // 简单的查询意图识别
      if (query.toLowerCase().includes('project') || query.includes('项目')) {
        return await this.searchWeb3Entities(query, { language });
      }

      if (query.toLowerCase().includes('funding') || query.includes('融资')) {
        return await this.getFundingInformation();
      }

      if (query.toLowerCase().includes('ecosystem') || query.includes('生态')) {
        return await this.getEcosystemMap();
      }

      // 默认使用搜索
      return await this.searchWeb3Entities(query, { language });
    } catch (error) {
      return {
        success: false,
        error:   error.message,
        data:    null
      };
    }
  }

  /**
   * 刷新供应商状态
   * @returns {Promise<boolean>} 刷新是否成功
   */
  async refreshStatus() {
    try {
      const creditsResult = await this.checkCredits();

      if (creditsResult.success) {
        this.credits = creditsResult.data.credits;
        this.userLevel = creditsResult.data.level;
        this.lastCreditsCheck = new Date();

        // 更新可用端点
        this.endpoints = getAvailableEndpoints(this.userLevel);

        return true;
      }

      return false;
    } catch (error) {
      console.error(`刷新状态失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 获取详细状态信息
   * @returns {Object} 状态信息对象
   */
  getDetailedStatus() {
    return {
      provider:            'RootData',
      isInitialized:       this.isInitialized,
      level:               this.userLevel || 'unknown',
      credits:             this.credits || 0,
      lastCreditsCheck:    this.lastCreditsCheck,
      availableToolsCount: this.endpoints.length,
      totalToolsCount:     19, // 总共19个真实端点
      supportedLanguages:  ['en', 'zh'],
      apiEndpoint:         'https://api.rootdata.com/open'
    };
  }

  /**
   * 清理资源
   */
  cleanup() {
    if (this.performanceOptimizer) {
      this.performanceOptimizer.cleanup();
    }
  }

  /**
   * 获取性能统计
   */
  getPerformanceStats() {
    return this.performanceOptimizer.getStats();
  }
}

module.exports = RootDataProvider;
