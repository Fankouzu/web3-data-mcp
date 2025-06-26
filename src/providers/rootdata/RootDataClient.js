/**
 * RootData API客户端
 * 专门处理RootData API的请求和响应
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
      const response = await this.request('/quotacredits');
      
      if (response.data.result === 200) {
        return {
          success: true,
          credits: response.data.data.credits,
          level: response.data.data.level,
          totalCredits: response.data.data.total_credits,
          lastMonthCredits: response.data.data.last_mo_credits,
          startTime: response.data.data.start
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
   * @param {string} projectId - 项目ID
   * @param {string} language - 语言设置
   * @returns {Promise<Object>} 项目详情
   */
  async getProjectDetails(projectId, language = 'en') {
    try {
      const requestData = {
        project_id: projectId
      };

      const headers = {
        'language': language
      };

      const response = await this.request('/project_details', 'POST', requestData, headers);
      
      if (response.data.result === 200) {
        return {
          success: true,
          data: response.data.data,
          projectId: projectId
        };
      } else {
        throw new ApiError(
          response.data.message || '获取项目详情失败',
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
        `获取项目详情失败: ${error.message}`,
        'PROJECT_DETAILS_ERROR',
        null,
        'RootDataClient'
      );
    }
  }

  /**
   * 获取融资轮次信息
   * @param {Object} params - 查询参数
   * @param {string} params.project_id - 项目ID
   * @param {string} params.organization_id - 组织ID  
   * @param {string} language - 语言设置
   * @returns {Promise<Object>} 融资信息
   */
  async getFundingRounds(params, language = 'en') {
    try {
      const headers = {
        'language': language
      };

      const response = await this.request('/funding_rounds', 'POST', params, headers);
      
      if (response.data.result === 200) {
        return {
          success: true,
          data: response.data.data || [],
          params: params
        };
      } else {
        throw new ApiError(
          response.data.message || '获取融资信息失败',
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
        `获取融资信息失败: ${error.message}`,
        'FUNDING_ERROR',
        null,
        'RootDataClient'
      );
    }
  }

  /**
   * 获取代币信息
   * @param {string} tokenSymbol - 代币符号
   * @param {string} language - 语言设置
   * @returns {Promise<Object>} 代币信息
   */
  async getTokenInfo(tokenSymbol, language = 'en') {
    try {
      const requestData = {
        token_symbol: tokenSymbol
      };

      const headers = {
        'language': language
      };

      const response = await this.request('/token_info', 'POST', requestData, headers);
      
      if (response.data.result === 200) {
        return {
          success: true,
          data: response.data.data,
          tokenSymbol: tokenSymbol
        };
      } else {
        throw new ApiError(
          response.data.message || '获取代币信息失败',
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
        `获取代币信息失败: ${error.message}`,
        'TOKEN_ERROR',
        null,
        'RootDataClient'
      );
    }
  }

  /**
   * 按生态系统搜索项目
   * @param {string} ecosystem - 生态系统名称
   * @param {string} language - 语言设置
   * @returns {Promise<Object>} 项目列表
   */
  async getProjectsByEcosystem(ecosystem, language = 'en') {
    try {
      const requestData = {
        ecosystem: ecosystem
      };

      const headers = {
        'language': language
      };

      const response = await this.request('/projects_by_ecosystems', 'POST', requestData, headers);
      
      if (response.data.result === 200) {
        return {
          success: true,
          data: response.data.data || [],
          ecosystem: ecosystem
        };
      } else {
        throw new ApiError(
          response.data.message || '按生态系统搜索失败',
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
        `按生态系统搜索失败: ${error.message}`,
        'ECOSYSTEM_SEARCH_ERROR',
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