/**
 * RootData API客户端
 * 专门处理RootData API的请求和响应
 * 严格按照官方API文档实现
 */

const { ApiClient, ApiError } = require('../base/ApiClient');

class RootDataClient extends ApiClient {
  /**
   * 初始化RootData API客户端
   * @param {string} apiKey - RootData API密钥
   * @param {Object} options - 配置选项
   */
  constructor(apiKey, options = {}) {
    const baseUrl = 'https://api.rootdata.com/open';
    
    // RootData特定的默认头部
    const defaultHeaders = {
      'apikey': apiKey,
      'language': 'en',
      'Content-Type': 'application/json',
      ...options.defaultHeaders
    };

    super(baseUrl, apiKey, {
      timeout: 30000,
      retries: 3,
      defaultHeaders,
      ...options
    });
  }

  /**
   * 查询API Key余额和等级
   * @returns {Promise<Object>} 余额信息
   */
  async checkCredits() {
    try {
      const response = await this.request('/quotacredits', 'POST', {});
      
      if (response.data.result === 200) {
        return {
          success: true,
          data: response.data.data
        };
      } else {
        throw new ApiError(
          response.data.message || '查询余额失败',
          response.data.result,
          response.statusCode,
          'RootDataClient'
        );
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        `查询余额失败: ${error.message}`,
        'CREDITS_CHECK_ERROR',
        null,
        'RootDataClient'
      );
    }
  }

  /**
   * 搜索项目/组织/人员
   * @param {string} query - 搜索关键词
   * @param {string} language - 语言设置 ('en' | 'zh')
   * @param {boolean} preciseXSearch - 是否精确搜索X账号
   * @returns {Promise<Object>} 搜索结果
   */
  async searchEntities(query, language = 'en', preciseXSearch = false) {
    try {
      const requestData = {
        query: query
      };

      if (preciseXSearch) {
        requestData.precise_x_search = true;
      }

      const headers = {
        'language': language
      };

      const response = await this.request('/ser_inv', 'POST', requestData, headers);
      
      if (response.data.result === 200) {
        return {
          success: true,
          data: response.data.data || [],
          query: query,
          language: language
        };
      } else {
        throw new ApiError(
          response.data.message || '搜索失败',
          response.data.result,
          response.statusCode,
          'RootDataClient'
        );
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        `搜索失败: ${error.message}`,
        'SEARCH_ERROR',
        null,
        'RootDataClient'
      );
    }
  }

  /**
   * 获取项目详情
   * @param {number|string} projectId - 项目ID
   * @param {string} contractAddress - 合约地址（可选）
   * @param {boolean} includeTeam - 是否包含团队信息
   * @param {boolean} includeInvestors - 是否包含投资方信息
   * @param {string} language - 语言设置
   * @returns {Promise<Object>} 项目详情
   */
  async getProject(projectId, contractAddress = null, includeTeam = false, includeInvestors = false, language = 'en') {
    try {
      const requestData = {};

      if (projectId) {
        requestData.project_id = parseInt(projectId);
      }
      if (contractAddress) {
        requestData.contract_address = contractAddress;
      }
      if (includeTeam) {
        requestData.include_team = true;
      }
      if (includeInvestors) {
        requestData.include_investors = true;
      }

      const headers = {
        'language': language
      };

      const response = await this.request('/get_item', 'POST', requestData, headers);
      
      if (response.data.result === 200) {
        return {
          success: true,
          data: response.data.data
        };
      } else {
        throw new ApiError(
          response.data.message || 'Failed to get project details',
          response.data.result,
          response.statusCode,
          'RootDataClient'
        );
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        `Failed to get project details: ${error.message}`,
        'PROJECT_DETAILS_ERROR',
        null,
        'RootDataClient'
      );
    }
  }

  /**
   * 获取机构详情
   * @param {number} orgId - 机构ID
   * @param {boolean} includeTeam - 是否包含团队信息
   * @param {boolean} includeInvestments - 是否包含投资项目信息
   * @param {string} language - 语言设置
   * @returns {Promise<Object>} 机构详情
   */
  async getOrganization(orgId, includeTeam = false, includeInvestments = false, language = 'en') {
    try {
      const requestData = {
        org_id: parseInt(orgId)
      };

      if (includeTeam) {
        requestData.include_team = true;
      }
      if (includeInvestments) {
        requestData.include_investments = true;
      }

      const headers = {
        'language': language
      };

      const response = await this.request('/get_org', 'POST', requestData, headers);
      
      if (response.data.result === 200) {
        return {
          success: true,
          data: response.data.data
        };
      } else {
        throw new ApiError(
          response.data.message || 'Failed to get organization details',
          response.data.result,
          response.statusCode,
          'RootDataClient'
        );
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        `Failed to get organization details: ${error.message}`,
        'ORGANIZATION_ERROR',
        null,
        'RootDataClient'
      );
    }
  }

  /**
   * 获取人物详情 (Pro级别)
   * @param {number} peopleId - 人物ID
   * @param {string} language - 语言设置
   * @returns {Promise<Object>} 人物详情
   */
  async getPeople(peopleId, language = 'en') {
    try {
      const requestData = {
        people_id: parseInt(peopleId)
      };

      const headers = {
        'language': language
      };

      const response = await this.request('/get_people', 'POST', requestData, headers);
      
      if (response.data.result === 200) {
        return {
          success: true,
          data: response.data.data
        };
      } else {
        throw new ApiError(
          response.data.message || 'Failed to get people details',
          response.data.result,
          response.statusCode,
          'RootDataClient'
        );
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        `Failed to get people details: ${error.message}`,
        'PEOPLE_ERROR',
        null,
        'RootDataClient'
      );
    }
  }

  /**
   * 获取ID列表 (Plus级别)
   * @param {number} type - 类型: 1项目 2机构 3人物
   * @param {string} language - 语言设置
   * @returns {Promise<Object>} ID列表
   */
  async getIdMap(type, language = 'en') {
    try {
      const requestData = {
        type: parseInt(type)
      };

      const headers = {
        'language': language
      };

      const response = await this.request('/id_map', 'POST', requestData, headers);
      
      if (response.data.result === 200) {
        return {
          success: true,
          data: response.data.data || []
        };
      } else {
        throw new ApiError(
          response.data.message || 'Failed to get ID map',
          response.data.result,
          response.statusCode,
          'RootDataClient'
        );
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        `Failed to get ID map: ${error.message}`,
        'ID_MAP_ERROR',
        null,
        'RootDataClient'
      );
    }
  }

  /**
   * 批量获取投资轮次信息 (Plus级别)
   * @param {Object} params - 查询参数
   * @param {string} language - 语言设置
   * @returns {Promise<Object>} 融资信息
   */
  async getFundingRounds(params = {}, language = 'en') {
    try {
      const headers = {
        'language': language
      };

      const response = await this.request('/get_fac', 'POST', params, headers);
      
      if (response.data.result === 200) {
        return {
          success: true,
          data: response.data.data || {}
        };
      } else {
        throw new ApiError(
          response.data.message || 'Failed to get funding rounds',
          response.data.result,
          response.statusCode,
          'RootDataClient'
        );
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        `Failed to get funding rounds: ${error.message}`,
        'FUNDING_ERROR',
        null,
        'RootDataClient'
      );
    }
  }

  /**
   * 批量获取投资者信息 (Plus级别)
   * @param {number} page - 页码
   * @param {number} pageSize - 每页条数
   * @param {string} language - 语言设置
   * @returns {Promise<Object>} 投资者信息
   */
  async getInvestors(page = 1, pageSize = 10, language = 'en') {
    try {
      const requestData = {
        page: parseInt(page),
        page_size: parseInt(pageSize)
      };

      const headers = {
        'language': language
      };

      const response = await this.request('/get_invest', 'POST', requestData, headers);
      
      if (response.data.result === 200) {
        return {
          success: true,
          data: response.data.data || {}
        };
      } else {
        throw new ApiError(
          response.data.message || 'Failed to get investors',
          response.data.result,
          response.statusCode,
          'RootDataClient'
        );
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        `Failed to get investors: ${error.message}`,
        'INVESTORS_ERROR',
        null,
        'RootDataClient'
      );
    }
  }

  /**
   * 批量导出X数据 (Plus级别)
   * @param {number} type - 类型: 1项目 2机构 3人物
   * @param {string} language - 语言设置
   * @returns {Promise<Object>} X数据
   */
  async getTwitterMap(type, language = 'en') {
    try {
      const requestData = {
        type: parseInt(type)
      };

      const headers = {
        'language': language
      };

      const response = await this.request('/twitter_map', 'POST', requestData, headers);
      
      if (response.data.result === 200) {
        return {
          success: true,
          data: response.data.data || []
        };
      } else {
        throw new ApiError(
          response.data.message || 'Failed to get Twitter map',
          response.data.result,
          response.statusCode,
          'RootDataClient'
        );
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        `Failed to get Twitter map: ${error.message}`,
        'TWITTER_MAP_ERROR',
        null,
        'RootDataClient'
      );
    }
  }

  /**
   * 根据生态系统获取项目 (Pro级别)
   * @param {string} ecosystemIds - 生态ID，多个生态逗号分隔
   * @param {string} language - 语言设置
   * @returns {Promise<Object>} 项目列表
   */
  async getProjectsByEcosystems(ecosystemIds, language = 'en') {
    try {
      const requestData = {
        ecosystem_ids: ecosystemIds
      };

      const headers = {
        'language': language
      };

      const response = await this.request('/projects_by_ecosystems', 'POST', requestData, headers);
      
      if (response.data.result === 200) {
        return {
          success: true,
          data: response.data.data || []
        };
      } else {
        throw new ApiError(
          response.data.message || 'Failed to get projects by ecosystems',
          response.data.result,
          response.statusCode,
          'RootDataClient'
        );
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        `Failed to get projects by ecosystems: ${error.message}`,
        'PROJECTS_BY_ECOSYSTEMS_ERROR',
        null,
        'RootDataClient'
      );
    }
  }

  /**
   * 根据标签获取项目 (Pro级别)
   * @param {string} tagIds - 标签ID，多个标签逗号分隔
   * @param {string} language - 语言设置
   * @returns {Promise<Object>} 项目列表
   */
  async getProjectsByTags(tagIds, language = 'en') {
    try {
      const requestData = {
        tag_ids: tagIds
      };

      const headers = {
        'language': language
      };

      const response = await this.request('/projects_by_tags', 'POST', requestData, headers);
      
      if (response.data.result === 200) {
        return {
          success: true,
          data: response.data.data || []
        };
      } else {
        throw new ApiError(
          response.data.message || 'Failed to get projects by tags',
          response.data.result,
          response.statusCode,
          'RootDataClient'
        );
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        `Failed to get projects by tags: ${error.message}`,
        'PROJECTS_BY_TAGS_ERROR',
        null,
        'RootDataClient'
      );
    }
  }

  /**
   * 更新API Key和默认头部
   * @param {string} newApiKey - 新的API密钥
   */
  updateApiKey(newApiKey) {
    super.updateApiKey(newApiKey);
    this.setDefaultHeaders({ 'apikey': newApiKey });
  }

  /**
   * 设置默认语言
   * @param {string} language - 语言代码
   */
  setDefaultLanguage(language) {
    this.setDefaultHeaders({ 'language': language });
  }
}

module.exports = RootDataClient;