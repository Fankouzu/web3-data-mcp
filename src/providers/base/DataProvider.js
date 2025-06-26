/**
 * 数据供应商基类
 * 为所有数据供应商提供统一的接口和通用功能
 */

const { detectLanguage } = require('../../utils/language');

class DataProvider {
  /**
   * 初始化数据供应商
   * @param {string} name - 供应商名称
   * @param {Object} config - 配置对象
   * @param {string} config.apiKey - API密钥
   * @param {string} config.baseUrl - 基础URL
   * @param {number} config.timeout - 请求超时时间（毫秒）
   * @param {number} config.retries - 重试次数
   */
  constructor(name, config) {
    if (this.constructor === DataProvider) {
      throw new Error('DataProvider is an abstract class and cannot be instantiated directly');
    }

    this.name = name;
    this.config = config;
    this.isInitialized = false;
    
    // 用户状态
    this.userLevel = 'unknown';
    this.credits = 0;
    this.lastCreditsCheck = null;
    
    // 工具注册表
    this.tools = new Map();
    this.availableTools = [];
  }

  /**
   * 初始化供应商
   * 子类必须实现此方法
   * @returns {Promise<boolean>} 初始化是否成功
   */
  async initialize() {
    throw new Error('Subclass must implement initialize() method');
  }

  /**
   * 检查API Key余额和等级
   * 子类必须实现此方法
   * @returns {Promise<Object>} { credits, level, success }
   */
  async checkCredits() {
    throw new Error('Subclass must implement checkCredits() method');
  }

  /**
   * 执行API调用
   * 子类必须实现此方法
   * @param {string} endpoint - API端点
   * @param {Object} params - 请求参数
   * @returns {Promise<Object>} API响应结果
   */
  async executeApiCall(endpoint, params) {
    throw new Error('Subclass must implement executeApiCall() method');
  }

  /**
   * 获取可用工具列表
   * 子类必须实现此方法
   * @returns {Array} 工具定义数组
   */
  getAvailableTools() {
    throw new Error('Subclass must implement getAvailableTools() method');
  }

  /**
   * 验证API凭据
   * @returns {Promise<Object>} 验证结果
   */
  async validateCredentials() {
    try {
      const result = await this.checkCredits();
      this.credits = result.credits || 0;
      this.userLevel = result.level || 'unknown';
      this.lastCreditsCheck = new Date();
      
      return {
        success: true,
        credits: this.credits,
        level: this.userLevel,
        provider: this.name
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        provider: this.name
      };
    }
  }

  /**
   * 检查用户是否有权限访问特定等级的功能
   * @param {string} requiredLevel - 所需等级
   * @returns {boolean} 是否有权限
   */
  hasAccess(requiredLevel) {
    const levels = {
      'basic': 1,
      'plus': 2,
      'pro': 3
    };

    const userLevelNum = levels[this.userLevel.toLowerCase()] || 0;
    const requiredLevelNum = levels[requiredLevel.toLowerCase()] || 999;

    return userLevelNum >= requiredLevelNum;
  }

  /**
   * 检查是否有足够的credits
   * @param {number} requiredCredits - 所需credits
   * @returns {boolean} 是否有足够credits
   */
  hasCredits(requiredCredits) {
    return this.credits >= requiredCredits;
  }

  /**
   * 消耗credits
   * @param {number} amount - 消耗数量
   */
  consumeCredits(amount) {
    this.credits = Math.max(0, this.credits - amount);
  }

  /**
   * 检测查询语言
   * @param {string} query - 查询字符串
   * @returns {string} 语言代码
   */
  detectQueryLanguage(query) {
    return detectLanguage(query);
  }

  /**
   * 注册工具
   * @param {Object} toolDefinition - 工具定义
   */
  registerTool(toolDefinition) {
    const requiredFields = ['name', 'description', 'inputSchema', 'endpoint', 'requiredLevel', 'creditsPerCall'];
    
    for (const field of requiredFields) {
      if (toolDefinition[field] === undefined || toolDefinition[field] === null) {
        throw new Error(`Tool definition missing required field: ${field}`);
      }
    }

    // 添加供应商信息
    toolDefinition.provider = this.name;
    
    this.tools.set(toolDefinition.name, toolDefinition);
    this.updateAvailableTools();
  }

  /**
   * 更新可用工具列表（基于用户等级和credits）
   */
  updateAvailableTools() {
    this.availableTools = Array.from(this.tools.values()).filter(tool => {
      return this.hasAccess(tool.requiredLevel) && this.hasCredits(tool.creditsPerCall);
    });
  }

  /**
   * 获取工具定义
   * @param {string} toolName - 工具名称
   * @returns {Object|null} 工具定义
   */
  getTool(toolName) {
    return this.tools.get(toolName) || null;
  }

  /**
   * 检查credits状态并返回警告信息
   * @returns {Object} credits状态信息
   */
  getCreditsStatus() {
    const status = {
      provider: this.name,
      credits: this.credits,
      level: this.userLevel,
      status: 'ok',
      message: null
    };

    if (this.credits <= 20) {
      status.status = 'critical';
      status.message = `Critical credits shortage (${this.credits}), please recharge immediately`;
    } else if (this.credits <= 100) {
      status.status = 'warning';
      status.message = `Credits shortage (${this.credits}), please recharge`;
    }

    return status;
  }

  /**
   * 格式化API响应，添加credits信息
   * @param {Object} apiResponse - API原始响应
   * @param {number} creditsUsed - 本次使用的credits
   * @returns {Object} 格式化后的响应
   */
  formatResponse(apiResponse, creditsUsed = 0) {
    // 更新credits
    this.consumeCredits(creditsUsed);
    
    const creditsStatus = this.getCreditsStatus();
    
    return {
      success: true,
      data: apiResponse,
      provider: this.name,
      credits: {
        remaining: this.credits,
        used: creditsUsed,
        status: creditsStatus.status,
        message: creditsStatus.message
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 获取供应商状态信息
   * @returns {Object} 状态信息
   */
  getStatus() {
    return {
      provider: this.name,
      initialized: this.isInitialized,
      level: this.userLevel,
      credits: this.credits,
      lastCreditsCheck: this.lastCreditsCheck,
      availableToolsCount: this.availableTools.length,
      totalToolsCount: this.tools.size
    };
  }
}

module.exports = DataProvider;