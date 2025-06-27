/**
 * 工具路由器
 * 负责智能路由用户查询到合适的API端点和供应商
 */

const { detectLanguage } = require('../utils/language');

/**
 * 查询意图类型
 */
const IntentTypes = {
  SEARCH:              'search',
  PROJECT_DETAILS:     'project_details',
  FUNDING_INFO:        'funding_info',
  TOKEN_INFO:          'token_info',
  ECOSYSTEM_PROJECTS:  'ecosystem_projects',
  SOCIAL_DATA:         'social_data',
  INVESTMENT_ANALYSIS: 'investment_analysis',
  CREDITS_CHECK:       'credits_check',
  UNKNOWN:             'unknown'
};

/**
 * 查询实体类型
 */
const EntityTypes = {
  PROJECT:      'project',
  TOKEN:        'token',
  ECOSYSTEM:    'ecosystem',
  INVESTOR:     'investor',
  PERSON:       'person',
  ORGANIZATION: 'organization'
};

class ToolRouter {
  constructor() {
    // 注册的提供商
    this.providers = new Map();

    // 工具路由表
    this.routes = new Map();

    // 意图识别规则
    this.intentRules = this._initializeIntentRules();

    // 实体识别规则
    this.entityRules = this._initializeEntityRules();

    // 路由统计
    this.routingStats = {
      totalQueries:       0,
      intentDistribution: {},
      providerUsage:      {},
      successfulRoutes:   0,
      failedRoutes:       0
    };
  }

  /**
   * 注册数据供应商
   * @param {string} name - 供应商名称
   * @param {Object} provider - 供应商实例
   */
  registerProvider(name, provider) {
    this.providers.set(name, provider);

    // 注册提供商的工具
    const tools = provider.getAvailableTools();
    tools.forEach(tool => {
      this.registerTool(tool.name, name, tool);
    });

    console.error(`Registered provider: ${name} (${tools.length} tools)`);
  }

  /**
   * 注册工具
   * @param {string} toolName - 工具名称
   * @param {string} providerName - 供应商名称
   * @param {Object} toolDefinition - 工具定义
   */
  registerTool(toolName, providerName, toolDefinition) {
    if (!this.routes.has(toolName)) {
      this.routes.set(toolName, []);
    }

    this.routes.get(toolName).push({
      provider:   providerName,
      definition: {
        ...toolDefinition,
        // 确保端点ID存在
        endpoint: toolDefinition.endpoint || toolDefinition.name
      }
    });
  }

  /**
   * 智能路由查询
   * @param {string} query - 用户查询
   * @param {Object} options - 路由选项
   * @returns {Promise<Object>} 路由结果
   */
  async routeQuery(query, options = {}) {
    try {
      this.routingStats.totalQueries++;

      // 1. 分析查询意图
      const intent = this._analyzeIntent(query);

      // 2. 提取查询实体
      const entities = this._extractEntities(query);

      // 3. 检测语言
      const language = detectLanguage(query);

      // 4. 选择最佳路由
      const routing = this._selectBestRoute(intent, entities, options);

      if (!routing) {
        this.routingStats.failedRoutes++;
        return {
          success: false,
          error:   'No suitable processing tool found',
          intent,
          entities,
          language
        };
      }

      // 5. 执行路由
      const result = await this._executeRoute(routing, query, entities, language, options);

      // 6. 更新统计
      this._updateRoutingStats(intent.type, routing.provider, result.success);

      return {
        success:  result.success,
        data:     result.data,
        provider: routing.provider,
        tool:     routing.tool,
        intent,
        entities,
        language,
        credits:  result.credits,
        error:    result.error
      };
    } catch (error) {
      this.routingStats.failedRoutes++;
      return {
        success:  false,
        error:    `Routing processing failed: ${error.message}`,
        intent:   { type: IntentTypes.UNKNOWN, confidence: 0 },
        entities: [],
        language: detectLanguage(query)
      };
    }
  }

  /**
   * 获取可用工具列表
   * @param {Object} filters - 过滤条件
   * @returns {Array} 可用工具列表
   */
  getAvailableTools(filters = {}) {
    const availableTools = [];

    for (const [providerName, provider] of this.providers) {
      if (filters.provider && filters.provider !== providerName) {
        continue;
      }

      const tools = provider.getAvailableTools();
      tools.forEach(tool => {
        // 检查等级权限
        if (filters.userLevel && !provider.hasAccess(tool.requiredLevel || 'basic')) {
          return;
        }

        // 检查credits
        if (filters.checkCredits && !provider.hasCredits(tool.creditsPerCall || 0)) {
          return;
        }

        availableTools.push({
          ...tool,
          provider:  providerName,
          available: provider.hasAccess(tool.requiredLevel || 'basic') && provider.hasCredits(tool.creditsPerCall || 0)
        });
      });
    }

    return availableTools;
  }

  /**
   * 获取推荐工具
   * @param {string} query - 查询内容
   * @param {number} limit - 返回数量限制
   * @returns {Array} 推荐工具列表
   */
  getRecommendedTools(query, limit = 5) {
    const intent = this._analyzeIntent(query);
    const entities = this._extractEntities(query);

    const recommendations = [];
    const availableTools = this.getAvailableTools({ checkCredits: true });

    availableTools.forEach(tool => {
      const score = this._calculateToolRelevanceScore(tool, intent, entities);
      if (score > 0) {
        recommendations.push({
          ...tool,
          relevanceScore: score,
          reason:         this._getRecommendationReason(tool, intent, entities)
        });
      }
    });

    // 按相关性排序
    recommendations.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return recommendations.slice(0, limit);
  }

  /**
   * 获取路由统计信息
   * @returns {Object} 统计信息
   */
  getRoutingStats() {
    return {
      ...this.routingStats,
      successRate:
        this.routingStats.totalQueries > 0
          ? ((this.routingStats.successfulRoutes / this.routingStats.totalQueries) * 100).toFixed(2) + '%'
          : '0%'
    };
  }

  /**
   * 分析查询意图
   * @private
   */
  _analyzeIntent(query) {
    const queryLower = query.toLowerCase();
    let bestMatch = { type: IntentTypes.UNKNOWN, confidence: 0, keywords: [] };

    for (const [intentType, rules] of Object.entries(this.intentRules)) {
      let confidence = 0;
      const matchedKeywords = [];

      // 检查关键词匹配
      rules.keywords.forEach(keyword => {
        if (queryLower.includes(keyword.toLowerCase())) {
          confidence += keyword.length * 0.1;
          matchedKeywords.push(keyword);
        }
      });

      // 检查模式匹配
      rules.patterns.forEach(pattern => {
        if (pattern.test(queryLower)) {
          confidence += 0.5;
        }
      });

      // 应用权重
      confidence *= rules.weight;

      if (confidence > bestMatch.confidence) {
        bestMatch = {
          type:     intentType,
          confidence,
          keywords: matchedKeywords
        };
      }
    }

    return bestMatch;
  }

  /**
   * 提取查询实体
   * @private
   */
  _extractEntities(query) {
    const entities = [];

    for (const [entityType, rules] of Object.entries(this.entityRules)) {
      rules.patterns.forEach(pattern => {
        const matches = query.match(pattern);
        if (matches) {
          matches.forEach(match => {
            entities.push({
              type:       entityType,
              value:      match,
              confidence: 0.8
            });
          });
        }
      });
    }

    return entities;
  }

  /**
   * 选择最佳路由
   * @private
   */
  _selectBestRoute(intent, entities, options) {
    const candidates = [];

    // 根据意图选择候选工具
    const toolCandidates = this._getToolsByIntent(intent.type);

    toolCandidates.forEach(({ toolName, providerName, definition }) => {
      const provider = this.providers.get(providerName);

      if (!provider) return;

      // 检查可用性
      if (!provider.hasAccess(definition.requiredLevel || 'basic')) return;
      if (!provider.hasCredits(definition.creditsPerCall || 0)) return;

      // 计算匹配分数
      const score = this._calculateMatchScore(definition, intent, entities);

      candidates.push({
        provider: providerName,
        tool:     toolName,
        definition,
        score
      });
    });

    // 排序并选择最佳候选
    candidates.sort((a, b) => b.score - a.score);

    return candidates.length > 0 ? candidates[0] : null;
  }

  /**
   * 根据意图获取工具
   * @private
   */
  _getToolsByIntent(intentType) {
    const intentToTools = {
      [IntentTypes.SEARCH]:             ['search_web3_entities'],
      [IntentTypes.PROJECT_DETAILS]:    ['get_project_details'],
      [IntentTypes.FUNDING_INFO]:       ['get_funding_rounds'],
      [IntentTypes.TOKEN_INFO]:         ['get_token_info'],
      [IntentTypes.ECOSYSTEM_PROJECTS]: ['get_projects_by_ecosystem'],
      [IntentTypes.CREDITS_CHECK]:      ['check_credits']
    };

    const toolNames = intentToTools[intentType] || ['search_web3_entities']; // 默认使用搜索
    const tools = [];

    toolNames.forEach(toolName => {
      const routes = this.routes.get(toolName);
      if (routes) {
        routes.forEach(route => {
          tools.push({
            toolName,
            providerName: route.provider,
            definition:   route.definition
          });
        });
      }
    });

    return tools;
  }

  /**
   * 计算匹配分数
   * @private
   */
  _calculateMatchScore(toolDefinition, intent, entities) {
    let score = intent.confidence;

    // 工具类别匹配
    if (toolDefinition.category) {
      const categoryBonus = {
        search:    intent.type === IntentTypes.SEARCH ? 0.5 : 0,
        project:   intent.type === IntentTypes.PROJECT_DETAILS ? 0.5 : 0,
        funding:   intent.type === IntentTypes.FUNDING_INFO ? 0.5 : 0,
        token:     intent.type === IntentTypes.TOKEN_INFO ? 0.5 : 0,
        ecosystem: intent.type === IntentTypes.ECOSYSTEM_PROJECTS ? 0.5 : 0
      };

      score += categoryBonus[toolDefinition.category] || 0;
    }

    // 实体匹配
    entities.forEach(entity => {
      if (toolDefinition.name.includes(entity.type)) {
        score += entity.confidence * 0.3;
      }
    });

    return score;
  }

  /**
   * 执行路由
   * @private
   */
  async _executeRoute(routing, query, entities, language, options) {
    const provider = this.providers.get(routing.provider);

    if (!provider) {
      throw new Error(`Provider ${routing.provider} is not available`);
    }

    // 构建API调用参数
    const params = this._buildApiParams(routing.tool, query, entities, language, options);

    try {
      // 执行API调用
      const result = await provider.executeApiCall(routing.definition.endpoint, params);

      return {
        success: true,
        data:    result.data,
        credits: result.credits
      };
    } catch (error) {
      return {
        success: false,
        error:   error.message
      };
    }
  }

  /**
   * 构建API参数
   * @private
   */
  _buildApiParams(toolName, query, entities, language, options) {
    const params = { ...options.params };

    switch (toolName) {
      case 'search_web3_entities':
        params.query = query;
        if (options.preciseXSearch) {
          params.precise_x_search = true;
        }
        break;

      case 'get_project_details':
        const projectEntity = entities.find(e => e.type === EntityTypes.PROJECT);
        if (projectEntity) {
          params.project_id = projectEntity.value;
        } else {
          params.project_id = options.projectId || query;
        }
        break;

      case 'get_token_info':
        const tokenEntity = entities.find(e => e.type === EntityTypes.TOKEN);
        if (tokenEntity) {
          params.token_symbol = tokenEntity.value;
        } else {
          // 尝试从查询中提取代币符号
          const tokenMatch = query.match(/\b([A-Z]{2,10})\b/);
          params.token_symbol = tokenMatch ? tokenMatch[1] : query;
        }
        break;

      case 'get_projects_by_ecosystem':
        const ecosystemEntity = entities.find(e => e.type === EntityTypes.ECOSYSTEM);
        if (ecosystemEntity) {
          params.ecosystem = ecosystemEntity.value;
        } else {
          params.ecosystem = query;
        }
        break;

      default:
        params.query = query;
    }

    return params;
  }

  /**
   * 计算工具相关性分数
   * @private
   */
  _calculateToolRelevanceScore(tool, intent, entities) {
    let score = 0;

    // 基于意图的匹配
    const intentMatch = {
      [IntentTypes.SEARCH]:             tool.name.includes('search') ? 1.0 : 0.3,
      [IntentTypes.PROJECT_DETAILS]:    tool.name.includes('project') ? 1.0 : 0.2,
      [IntentTypes.FUNDING_INFO]:       tool.name.includes('funding') ? 1.0 : 0.2,
      [IntentTypes.TOKEN_INFO]:         tool.name.includes('token') ? 1.0 : 0.2,
      [IntentTypes.ECOSYSTEM_PROJECTS]: tool.name.includes('ecosystem') ? 1.0 : 0.2,
      [IntentTypes.CREDITS_CHECK]:      tool.name.includes('credits') ? 1.0 : 0.1
    };

    score += (intentMatch[intent.type] || 0.3) * intent.confidence;

    // 基于实体的匹配
    entities.forEach(entity => {
      if (tool.description.toLowerCase().includes(entity.type)) {
        score += entity.confidence * 0.2;
      }
    });

    return score;
  }

  /**
   * 获取推荐原因
   * @private
   */
  _getRecommendationReason(tool, intent, entities) {
    if (intent.type === IntentTypes.SEARCH && tool.name.includes('search')) {
      return '最适合搜索Web3项目和组织';
    }

    if (intent.type === IntentTypes.TOKEN_INFO && tool.name.includes('token')) {
      return '专门用于获取代币详细信息';
    }

    if (intent.type === IntentTypes.FUNDING_INFO && tool.name.includes('funding')) {
      return '提供融资轮次和投资数据';
    }

    return '基于查询内容匹配的推荐工具';
  }

  /**
   * 更新路由统计
   * @private
   */
  _updateRoutingStats(intentType, provider, success) {
    // 意图分布统计
    if (!this.routingStats.intentDistribution[intentType]) {
      this.routingStats.intentDistribution[intentType] = 0;
    }
    this.routingStats.intentDistribution[intentType]++;

    // 供应商使用统计
    if (!this.routingStats.providerUsage[provider]) {
      this.routingStats.providerUsage[provider] = 0;
    }
    this.routingStats.providerUsage[provider]++;

    // 成功率统计
    if (success) {
      this.routingStats.successfulRoutes++;
    } else {
      this.routingStats.failedRoutes++;
    }
  }

  /**
   * 初始化意图识别规则
   * @private
   */
  _initializeIntentRules() {
    return {
      [IntentTypes.SEARCH]: {
        keywords: ['search', 'find', 'look for', '搜索', '查找', '寻找'],
        patterns: [/search for/i, /find.*project/i, /查找.*项目/i],
        weight:   1.0
      },
      [IntentTypes.PROJECT_DETAILS]: {
        keywords: ['details', 'information', 'about', '详情', '信息', '关于'],
        patterns: [/details about/i, /information on/i, /.*的详情/i],
        weight:   1.0
      },
      [IntentTypes.FUNDING_INFO]: {
        keywords: ['funding', 'investment', 'raise', '融资', '投资', '轮次'],
        patterns: [/funding round/i, /investment/i, /融资.*轮/i],
        weight:   1.0
      },
      [IntentTypes.TOKEN_INFO]: {
        keywords: ['token', 'coin', 'price', '代币', '币价', '价格'],
        patterns: [/token.*info/i, /price of/i, /.*代币/i],
        weight:   1.0
      },
      [IntentTypes.ECOSYSTEM_PROJECTS]: {
        keywords: ['ecosystem', 'projects in', '生态系统', '生态项目'],
        patterns: [/projects.*in.*ecosystem/i, /.*生态.*项目/i],
        weight:   1.0
      },
      [IntentTypes.CREDITS_CHECK]: {
        keywords: ['credits', 'balance', 'quota', '余额', '配额'],
        patterns: [/check.*credits/i, /my.*balance/i, /查看.*余额/i],
        weight:   1.0
      }
    };
  }

  /**
   * 初始化实体识别规则
   * @private
   */
  _initializeEntityRules() {
    return {
      [EntityTypes.TOKEN]: {
        patterns: [/\b(BTC|ETH|USDT|USDC|BNB|XRP|ADA|SOL|DOT|AVAX|MATIC|LINK|UNI|AAVE|COMP)\b/gi, /\b[A-Z]{2,6}\b/g]
      },
      [EntityTypes.ECOSYSTEM]: {
        patterns: [/\b(Ethereum|Bitcoin|Solana|Polygon|Avalanche|Arbitrum|Optimism|BSC|Fantom)\b/gi]
      },
      [EntityTypes.PROJECT]: {
        patterns: [/\b(Uniswap|Aave|Compound|MakerDAO|Chainlink|OpenSea|Axie Infinity)\b/gi]
      }
    };
  }
}

module.exports = { ToolRouter, IntentTypes, EntityTypes };
