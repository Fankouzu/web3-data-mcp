/**
 * RootData API端点定义
 * 定义所有可用的API端点及其配置
 */

const endpoints = [
  {
    id: 'credits_check',
    name: 'check_credits',
    description: '查询API Key余额和等级信息',
    endpoint: '/quotacredits',
    method: 'POST',
    requiredLevel: 'basic',
    creditsPerCall: 0, // 查询余额不消耗credits
    category: 'account',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    },
    outputDescription: '返回当前账户的credits余额、等级和其他账户信息'
  },

  {
    id: 'search_entities',
    name: 'search_web3_entities',
    description: '搜索Web3项目、组织和人员',
    endpoint: '/ser_inv',
    method: 'POST',
    requiredLevel: 'basic',
    creditsPerCall: 5,
    category: 'search',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: '搜索关键词（项目名称、组织名称、代币符号等）',
          minLength: 1
        },
        precise_x_search: {
          type: 'boolean',
          description: '是否进行精确的X(Twitter)账号搜索',
          default: false
        }
      },
      required: ['query']
    },
    outputDescription: '返回匹配的项目、组织和人员信息列表'
  },

  {
    id: 'project_details',
    name: 'get_project_details',
    description: '获取特定项目的详细信息',
    endpoint: '/project_details',
    method: 'POST',
    requiredLevel: 'basic',
    creditsPerCall: 10,
    category: 'project',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: '项目的唯一标识符'
        }
      },
      required: ['project_id']
    },
    outputDescription: '返回项目的详细信息，包括描述、团队、技术栈等'
  },

  {
    id: 'funding_rounds',
    name: 'get_funding_rounds',
    description: '获取项目或组织的融资轮次信息',
    endpoint: '/funding_rounds',
    method: 'POST',
    requiredLevel: 'plus',
    creditsPerCall: 15,
    category: 'funding',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: '项目ID（与organization_id二选一）'
        },
        organization_id: {
          type: 'string',
          description: '组织ID（与project_id二选一）'
        }
      },
      anyOf: [
        { required: ['project_id'] },
        { required: ['organization_id'] }
      ]
    },
    outputDescription: '返回融资轮次信息，包括融资金额、投资者、时间等'
  },

  {
    id: 'token_info',
    name: 'get_token_info',
    description: '获取代币的详细信息',
    endpoint: '/token_info',
    method: 'POST',
    requiredLevel: 'basic',
    creditsPerCall: 8,
    category: 'token',
    inputSchema: {
      type: 'object',
      properties: {
        token_symbol: {
          type: 'string',
          description: '代币符号（如BTC、ETH等）'
        }
      },
      required: ['token_symbol']
    },
    outputDescription: '返回代币的基本信息、价格数据和相关项目信息'
  },

  {
    id: 'projects_by_ecosystem',
    name: 'get_projects_by_ecosystem',
    description: '按生态系统查找项目',
    endpoint: '/projects_by_ecosystems',
    method: 'POST',
    requiredLevel: 'basic',
    creditsPerCall: 12,
    category: 'ecosystem',
    inputSchema: {
      type: 'object',
      properties: {
        ecosystem: {
          type: 'string',
          description: '生态系统名称（如Ethereum、Solana、Polygon等）'
        }
      },
      required: ['ecosystem']
    },
    outputDescription: '返回指定生态系统中的项目列表'
  },

  {
    id: 'projects_by_tags',
    name: 'get_projects_by_tags',
    description: '按标签查找项目',
    endpoint: '/projects_by_tags',
    method: 'POST',
    requiredLevel: 'basic',
    creditsPerCall: 10,
    category: 'search',
    inputSchema: {
      type: 'object',
      properties: {
        tags: {
          type: 'array',
          items: {
            type: 'string'
          },
          description: '标签列表（如DeFi、NFT、Gaming等）',
          minItems: 1
        }
      },
      required: ['tags']
    },
    outputDescription: '返回具有指定标签的项目列表'
  },

  {
    id: 'investment_analysis',
    name: 'get_investment_analysis',
    description: '获取投资分析数据',
    endpoint: '/investment_analysis',
    method: 'POST',
    requiredLevel: 'pro',
    creditsPerCall: 25,
    category: 'analysis',
    inputSchema: {
      type: 'object',
      properties: {
        analysis_type: {
          type: 'string',
          enum: ['market_trends', 'investor_activity', 'sector_analysis'],
          description: '分析类型'
        },
        time_period: {
          type: 'string',
          enum: ['1M', '3M', '6M', '1Y'],
          description: '分析时间段',
          default: '3M'
        }
      },
      required: ['analysis_type']
    },
    outputDescription: '返回投资分析报告和趋势数据'
  },

  {
    id: 'social_data',
    name: 'get_social_data',
    description: '获取项目的社交媒体数据',
    endpoint: '/social_data',
    method: 'POST',
    requiredLevel: 'plus',
    creditsPerCall: 20,
    category: 'social',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: '项目ID'
        },
        platforms: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['twitter', 'discord', 'telegram', 'github']
          },
          description: '要获取数据的社交平台',
          default: ['twitter']
        }
      },
      required: ['project_id']
    },
    outputDescription: '返回项目在各社交平台的数据和活跃度指标'
  }
];

/**
 * 根据用户等级过滤可用端点
 * @param {string} userLevel - 用户等级
 * @returns {Array} 可用端点列表
 */
function getAvailableEndpoints(userLevel) {
  const levels = {
    'basic': 1,
    'plus': 2,
    'pro': 3
  };

  const userLevelNum = levels[userLevel.toLowerCase()] || 0;

  return endpoints.filter(endpoint => {
    const requiredLevelNum = levels[endpoint.requiredLevel.toLowerCase()] || 999;
    return userLevelNum >= requiredLevelNum;
  });
}

/**
 * 根据类别获取端点
 * @param {string} category - 端点类别
 * @returns {Array} 该类别的端点列表
 */
function getEndpointsByCategory(category) {
  return endpoints.filter(endpoint => endpoint.category === category);
}

/**
 * 根据ID获取端点定义
 * @param {string} endpointId - 端点ID
 * @returns {Object|null} 端点定义
 */
function getEndpointById(endpointId) {
  return endpoints.find(endpoint => endpoint.id === endpointId) || null;
}

/**
 * 根据名称获取端点定义
 * @param {string} name - 端点名称
 * @returns {Object|null} 端点定义
 */
function getEndpointByName(name) {
  return endpoints.find(endpoint => endpoint.name === name) || null;
}

/**
 * 获取所有端点类别
 * @returns {Array} 类别列表
 */
function getAllCategories() {
  const categories = [...new Set(endpoints.map(endpoint => endpoint.category))];
  return categories.sort();
}

/**
 * 计算查询所需的总credits
 * @param {Array} endpointIds - 要调用的端点ID列表
 * @returns {number} 总credits数
 */
function calculateTotalCredits(endpointIds) {
  return endpointIds.reduce((total, id) => {
    const endpoint = getEndpointById(id);
    return total + (endpoint ? endpoint.creditsPerCall : 0);
  }, 0);
}

module.exports = {
  endpoints,
  getAvailableEndpoints,
  getEndpointsByCategory,
  getEndpointById,
  getEndpointByName,
  getAllCategories,
  calculateTotalCredits
};