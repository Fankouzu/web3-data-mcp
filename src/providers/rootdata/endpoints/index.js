/**
 * RootData API端点定义
 * 严格按照官方API文档定义所有真实可用的API端点及其配置
 */

const endpoints = [
  // ========== Basic级别端点 ==========
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
    creditsPerCall: 0, // 文档显示不限次数
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
          description: '基于X Handle（@…），精准搜索相应实体',
          default: false
        }
      },
      required: ['query']
    },
    outputDescription: '返回匹配的项目、组织和人员信息列表'
  },

  {
    id: 'get_project',
    name: 'get_project_details',
    description: '获取特定项目的详细信息',
    endpoint: '/get_item',
    method: 'POST',
    requiredLevel: 'basic',
    creditsPerCall: 2,
    category: 'project',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'integer',
          description: '项目的唯一标识符（与contract_address二选一）'
        },
        contract_address: {
          type: 'string',
          description: '项目的合约地址（与project_id二选一）'
        },
        include_team: {
          type: 'boolean',
          description: '是否包含团队成员信息',
          default: false
        },
        include_investors: {
          type: 'boolean',
          description: '是否包含投资方信息',
          default: false
        }
      },
      anyOf: [
        { required: ['project_id'] },
        { required: ['contract_address'] }
      ]
    },
    outputDescription: '返回项目的详细信息，包括基本介绍、团队成员、投资方等'
  },

  {
    id: 'get_organization',
    name: 'get_organization_details',
    description: '获取特定机构的详细信息',
    endpoint: '/get_org',
    method: 'POST',
    requiredLevel: 'basic',
    creditsPerCall: 2,
    category: 'organization',
    inputSchema: {
      type: 'object',
      properties: {
        org_id: {
          type: 'integer',
          description: '机构ID'
        },
        include_team: {
          type: 'boolean',
          description: '是否包含团队成员信息',
          default: false
        },
        include_investments: {
          type: 'boolean',
          description: '是否包含投资项目信息',
          default: false
        }
      },
      required: ['org_id']
    },
    outputDescription: '返回机构的详细信息，包括基本介绍、团队成员、投资组合等'
  },

  // ========== Plus级别端点 ==========
  {
    id: 'get_id_map',
    name: 'get_id_mapping',
    description: '获取所有项目、人物与VC的ID列表',
    endpoint: '/id_map',
    method: 'POST',
    requiredLevel: 'plus',
    creditsPerCall: 20,
    category: 'data',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'integer',
          description: '类型: 1项目 2机构 3人物',
          enum: [1, 2, 3]
        }
      },
      required: ['type']
    },
    outputDescription: '返回指定类型的所有实体ID和名称列表'
  },

  {
    id: 'get_investors',
    name: 'get_investor_details',
    description: '批量获取投资者的详细信息',
    endpoint: '/get_invest',
    method: 'POST',
    requiredLevel: 'plus',
    creditsPerCall: 2, // 2 credits/条
    category: 'investor',
    inputSchema: {
      type: 'object',
      properties: {
        page: {
          type: 'integer',
          description: '页码，默认1',
          minimum: 1,
          default: 1
        },
        page_size: {
          type: 'integer',
          description: '每页条数，默认10，最大100',
          minimum: 1,
          maximum: 100,
          default: 10
        }
      },
      required: []
    },
    outputDescription: '返回投资者详细信息，包括投资组合、数据分析等'
  },

  {
    id: 'get_twitter_map',
    name: 'get_twitter_data',
    description: '批量导出X数据',
    endpoint: '/twitter_map',
    method: 'POST',
    requiredLevel: 'plus',
    creditsPerCall: 50,
    category: 'social',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'integer',
          description: '类型: 1项目 2机构 3人物',
          enum: [1, 2, 3]
        }
      },
      required: ['type']
    },
    outputDescription: '返回实体的X(Twitter)数据，包括关注者、影响力等'
  },

  {
    id: 'get_funding_rounds',
    name: 'get_funding_information',
    description: '批量获取投融资轮次（限2018年至今）',
    endpoint: '/get_fac',
    method: 'POST',
    requiredLevel: 'plus',
    creditsPerCall: 2, // 2 credits/条
    category: 'funding',
    inputSchema: {
      type: 'object',
      properties: {
        page: {
          type: 'integer',
          description: '页码，默认1',
          minimum: 1,
          default: 1
        },
        page_size: {
          type: 'integer',
          description: '每页条数，默认10，最大200',
          minimum: 1,
          maximum: 200,
          default: 10
        },
        start_time: {
          type: 'string',
          description: '融资公布日期（起） yyyy-MM',
          pattern: '^\\d{4}-\\d{2}$'
        },
        end_time: {
          type: 'string',
          description: '融资公布日期（止） yyyy-MM',
          pattern: '^\\d{4}-\\d{2}$'
        },
        min_amount: {
          type: 'integer',
          description: '融资金额最小范围（美元）',
          minimum: 0
        },
        max_amount: {
          type: 'integer',
          description: '融资金额最大范围（美元）',
          minimum: 0
        },
        project_id: {
          type: 'integer',
          description: '项目Id'
        }
      },
      required: []
    },
    outputDescription: '返回融资轮次信息，包括融资金额、投资者、时间等'
  },

  // ========== Pro级别端点 ==========
  {
    id: 'get_people',
    name: 'get_people_details',
    description: '获取人物详细信息',
    endpoint: '/get_people',
    method: 'POST',
    requiredLevel: 'pro',
    creditsPerCall: 2,
    category: 'people',
    inputSchema: {
      type: 'object',
      properties: {
        people_id: {
          type: 'integer',
          description: '人物ID'
        }
      },
      required: ['people_id']
    },
    outputDescription: '返回人物详细信息，包括X影响力/热度指数、工作变动等'
  },

  {
    id: 'sync_updates',
    name: 'get_sync_updates',
    description: '获取单位时间内数据更新的项目列表',
    endpoint: '/ser_change',
    method: 'POST',
    requiredLevel: 'pro',
    creditsPerCall: 1, // 1 credits/条
    category: 'sync',
    inputSchema: {
      type: 'object',
      properties: {
        begin_time: {
          type: 'integer',
          description: '开始时间，时间戳'
        },
        end_time: {
          type: 'integer',
          description: '结束时间，时间戳'
        }
      },
      required: ['begin_time']
    },
    outputDescription: '返回在指定时间范围内更新的项目和机构列表'
  },

  {
    id: 'hot_projects',
    name: 'get_hot_projects_top100',
    description: '获取Top100项目列表及其基本信息',
    endpoint: '/hot_index',
    method: 'POST',
    requiredLevel: 'pro',
    creditsPerCall: 10,
    category: 'ranking',
    inputSchema: {
      type: 'object',
      properties: {
        days: {
          type: 'integer',
          description: '仅支持查询近1天/7天数据',
          enum: [1, 7]
        }
      },
      required: ['days']
    },
    outputDescription: '返回热门项目排行榜，包括项目信息和热度值'
  },

  {
    id: 'hot_projects_on_x',
    name: 'get_hot_projects_on_twitter',
    description: '获取X热门项目列表',
    endpoint: '/hot_project_on_x',
    method: 'POST',
    requiredLevel: 'pro',
    creditsPerCall: 10,
    category: 'social',
    inputSchema: {
      type: 'object',
      properties: {
        heat: {
          type: 'boolean',
          description: 'X 热度榜单'
        },
        influence: {
          type: 'boolean',
          description: 'X 影响力榜单'
        },
        followers: {
          type: 'boolean',
          description: 'X 关注者榜单'
        }
      },
      required: ['heat', 'influence', 'followers']
    },
    outputDescription: '返回X平台上的热门项目榜单'
  },

  {
    id: 'hot_people_on_x',
    name: 'get_hot_people_on_twitter',
    description: '获取当前X热门人物列表',
    endpoint: '/leading_figures_on_crypto_x',
    method: 'POST',
    requiredLevel: 'pro',
    creditsPerCall: 10,
    category: 'social',
    inputSchema: {
      type: 'object',
      properties: {
        page: {
          type: 'integer',
          description: '页码，默认1',
          minimum: 1,
          default: 1
        },
        page_size: {
          type: 'integer',
          description: '每页条数，默认10，最大100',
          minimum: 1,
          maximum: 100,
          default: 10
        },
        rank_type: {
          type: 'string',
          description: '榜单类型',
          enum: ['heat', 'influence']
        }
      },
      required: ['rank_type']
    },
    outputDescription: '返回X平台上的热门人物榜单'
  },

  {
    id: 'job_changes',
    name: 'get_job_changes',
    description: '获取人物职位动态数据',
    endpoint: '/job_changes',
    method: 'POST',
    requiredLevel: 'pro',
    creditsPerCall: 10,
    category: 'people',
    inputSchema: {
      type: 'object',
      properties: {
        recent_joinees: {
          type: 'boolean',
          description: '近期入职'
        },
        recent_resignations: {
          type: 'boolean',
          description: '近期离职'
        }
      },
      required: ['recent_joinees', 'recent_resignations']
    },
    outputDescription: '返回近期入职和离职的人物动态信息'
  },

  {
    id: 'new_tokens',
    name: 'get_new_tokens',
    description: '获取近三个月新发行的代币列表',
    endpoint: '/new_tokens',
    method: 'POST',
    requiredLevel: 'pro',
    creditsPerCall: 10,
    category: 'token',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    },
    outputDescription: '返回近期新发行代币的项目列表'
  },

  {
    id: 'ecosystem_map',
    name: 'get_ecosystem_map',
    description: '获取生态版图列表',
    endpoint: '/ecosystem_map',
    method: 'POST',
    requiredLevel: 'pro',
    creditsPerCall: 50,
    category: 'ecosystem',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    },
    outputDescription: '返回所有生态系统及其项目数量'
  },

  {
    id: 'tag_map',
    name: 'get_tag_map',
    description: '获取标签版图列表',
    endpoint: '/tag_map',
    method: 'POST',
    requiredLevel: 'pro',
    creditsPerCall: 50,
    category: 'tag',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    },
    outputDescription: '返回所有标签及其ID'
  },

  {
    id: 'projects_by_ecosystems',
    name: 'get_projects_by_ecosystems',
    description: '根据生态批量获取项目信息',
    endpoint: '/projects_by_ecosystems',
    method: 'POST',
    requiredLevel: 'pro',
    creditsPerCall: 20,
    category: 'ecosystem',
    inputSchema: {
      type: 'object',
      properties: {
        ecosystem_ids: {
          type: 'string',
          description: '生态ID，多个生态逗号分隔'
        }
      },
      required: ['ecosystem_ids']
    },
    outputDescription: '返回指定生态系统中的项目列表'
  },

  {
    id: 'projects_by_tags',
    name: 'get_projects_by_tags',
    description: '根据标签批量获取项目信息',
    endpoint: '/projects_by_tags',
    method: 'POST',
    requiredLevel: 'pro',
    creditsPerCall: 20,
    category: 'tag',
    inputSchema: {
      type: 'object',
      properties: {
        tag_ids: {
          type: 'string',
          description: '标签ID，多个标签逗号分隔'
        }
      },
      required: ['tag_ids']
    },
    outputDescription: '返回具有指定标签的项目列表'
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

/**
 * 获取不同等级的端点统计
 * @returns {Object} 各等级端点数量统计
 */
function getEndpointStatsByLevel() {
  const stats = {
    basic: 0,
    plus: 0,
    pro: 0,
    total: endpoints.length
  };

  endpoints.forEach(endpoint => {
    stats[endpoint.requiredLevel]++;
  });

  return stats;
}

module.exports = {
  endpoints,
  getAvailableEndpoints,
  getEndpointsByCategory,
  getEndpointById,
  getEndpointByName,
  getAllCategories,
  calculateTotalCredits,
  getEndpointStatsByLevel
};