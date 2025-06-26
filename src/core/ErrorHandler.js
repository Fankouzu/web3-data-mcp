/**
 * 统一错误处理器
 * 处理系统中的各种错误并提供用户友好的错误消息
 */

const { ApiError } = require('../providers/base/ApiClient');

/**
 * 错误类型枚举
 */
const ErrorTypes = {
  API_ERROR: 'API_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  INSUFFICIENT_CREDITS: 'INSUFFICIENT_CREDITS',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  PROVIDER_ERROR: 'PROVIDER_ERROR',
  SYSTEM_ERROR: 'SYSTEM_ERROR'
};

/**
 * 错误严重性级别
 */
const ErrorSeverity = {
  LOW: 'low',
  MEDIUM: 'medium', 
  HIGH: 'high',
  CRITICAL: 'critical'
};

class ErrorHandler {
  constructor() {
    this.errorStats = {
      totalErrors: 0,
      errorsByType: {},
      errorsByProvider: {},
      recentErrors: []
    };
    
    // 保留最近100个错误记录
    this.maxRecentErrors = 100;
  }

  /**
   * 处理API错误
   * @param {Error} error - 原始错误
   * @param {string} provider - 提供商名称
   * @param {Object} context - 错误上下文
   * @returns {Object} 格式化后的错误响应
   */
  handleApiError(error, provider, context = {}) {
    const errorInfo = this._createErrorInfo(error, provider, context);
    this._recordError(errorInfo);

    // 根据错误类型返回用户友好的消息
    const userMessage = this._getUserFriendlyMessage(errorInfo);
    
    return {
      success: false,
      error: {
        type: errorInfo.type,
        message: userMessage,
        code: errorInfo.code,
        provider: provider,
        severity: errorInfo.severity,
        timestamp: errorInfo.timestamp,
        suggestion: this._getErrorSuggestion(errorInfo),
        details: context.includeDetails ? errorInfo.details : undefined
      }
    };
  }

  /**
   * 处理Credits不足错误
   * @param {number} required - 需要的credits
   * @param {number} available - 可用的credits
   * @param {string} provider - 提供商名称
   * @returns {Object} 错误响应
   */
  handleInsufficientCredits(required, available, provider) {
    const errorInfo = {
      type: ErrorTypes.INSUFFICIENT_CREDITS,
      severity: ErrorSeverity.HIGH,
      provider: provider,
      message: `Credits insufficient, requires ${required}, currently only ${available}`,
      required: required,
      available: available,
      timestamp: new Date().toISOString()
    };

    this._recordError(errorInfo);

    return {
      success: false,
      error: {
        type: errorInfo.type,
        message: errorInfo.message,
        provider: provider,
        severity: errorInfo.severity,
        timestamp: errorInfo.timestamp,
        suggestion: `Please recharge your ${provider} account, or use features that require fewer credits`,
        details: {
          required: required,
          available: available,
          deficit: required - available
        }
      }
    };
  }

  /**
   * 处理权限不足错误
   * @param {string} requiredLevel - 需要的权限等级
   * @param {string} currentLevel - 当前权限等级
   * @param {string} provider - 提供商名称
   * @returns {Object} 错误响应
   */
  handleInsufficientPermissions(requiredLevel, currentLevel, provider) {
    const errorInfo = {
      type: ErrorTypes.INSUFFICIENT_PERMISSIONS,
      severity: ErrorSeverity.MEDIUM,
      provider: provider,
      message: `Insufficient permissions, requires ${requiredLevel} level, currently ${currentLevel}`,
      requiredLevel: requiredLevel,
      currentLevel: currentLevel,
      timestamp: new Date().toISOString()
    };

    this._recordError(errorInfo);

    return {
      success: false,
      error: {
        type: errorInfo.type,
        message: errorInfo.message,
        provider: provider,
        severity: errorInfo.severity,
        timestamp: errorInfo.timestamp,
        suggestion: `Please upgrade your ${provider} account to ${requiredLevel} level to use this feature`,
        details: {
          requiredLevel: requiredLevel,
          currentLevel: currentLevel
        }
      }
    };
  }

  /**
   * 处理参数验证错误
   * @param {string} message - 错误消息
   * @param {Object} invalidParams - 无效参数信息
   * @returns {Object} 错误响应
   */
  handleValidationError(message, invalidParams = {}) {
    const errorInfo = {
      type: ErrorTypes.VALIDATION_ERROR,
      severity: ErrorSeverity.LOW,
      message: message,
      invalidParams: invalidParams,
      timestamp: new Date().toISOString()
    };

    this._recordError(errorInfo);

    return {
      success: false,
      error: {
        type: errorInfo.type,
        message: message,
        severity: errorInfo.severity,
        timestamp: errorInfo.timestamp,
        suggestion: 'Please check if the input parameters meet the requirements',
        details: invalidParams
      }
    };
  }

  /**
   * 创建错误信息对象
   * @private
   */
  _createErrorInfo(error, provider, context) {
    const timestamp = new Date().toISOString();
    
    if (error instanceof ApiError) {
      return {
        type: this._getErrorTypeFromApiError(error),
        severity: this._getErrorSeverity(error),
        provider: provider,
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        details: {
          originalError: error.message,
          context: context
        },
        timestamp: timestamp
      };
    }

    // 处理其他类型的错误
    return {
      type: ErrorTypes.SYSTEM_ERROR,
      severity: ErrorSeverity.MEDIUM,
      provider: provider,
      message: error.message || 'Unknown error',
      code: error.code || 'UNKNOWN_ERROR',
      details: {
        originalError: error.toString(),
        stack: error.stack,
        context: context
      },
      timestamp: timestamp
    };
  }

  /**
   * 从API错误确定错误类型
   * @private
   */
  _getErrorTypeFromApiError(apiError) {
    if (apiError.statusCode === 401 || apiError.statusCode === 403) {
      return ErrorTypes.AUTHENTICATION_ERROR;
    }
    
    if (apiError.statusCode === 429) {
      return ErrorTypes.INSUFFICIENT_CREDITS;
    }
    
    if (apiError.code === 'TIMEOUT') {
      return ErrorTypes.TIMEOUT_ERROR;
    }
    
    if (apiError.code === 'NETWORK_ERROR') {
      return ErrorTypes.NETWORK_ERROR;
    }
    
    return ErrorTypes.API_ERROR;
  }

  /**
   * 确定错误严重性
   * @private
   */
  _getErrorSeverity(error) {
    if (error.statusCode >= 500) {
      return ErrorSeverity.HIGH;
    }
    
    if (error.statusCode >= 400) {
      return ErrorSeverity.MEDIUM;
    }
    
    return ErrorSeverity.LOW;
  }

  /**
   * 获取用户友好的错误消息
   * @private
   */
  _getUserFriendlyMessage(errorInfo) {
    const messageMap = {
      [ErrorTypes.API_ERROR]: 'Data query failed, please try again later',
      [ErrorTypes.AUTHENTICATION_ERROR]: 'API authentication failed, please check your access key',
      [ErrorTypes.INSUFFICIENT_CREDITS]: `Credits balance insufficient, current operation cannot be completed`,
      [ErrorTypes.INSUFFICIENT_PERMISSIONS]: 'Insufficient permissions, requires a higher level account',
      [ErrorTypes.VALIDATION_ERROR]: 'Input parameters are incorrect, please check and try again',
      [ErrorTypes.NETWORK_ERROR]: 'Network connection failed, please check your network connection',
      [ErrorTypes.TIMEOUT_ERROR]: 'Request timed out, please try again later',
      [ErrorTypes.PROVIDER_ERROR]: 'Data provider service exception',
      [ErrorTypes.SYSTEM_ERROR]: 'System internal error, please try again later'
    };

    return messageMap[errorInfo.type] || errorInfo.message;
  }

  /**
   * 获取错误建议
   * @private
   */
  _getErrorSuggestion(errorInfo) {
    const suggestionMap = {
      [ErrorTypes.API_ERROR]: 'Please try again later, if the problem persists, please contact technical support',
      [ErrorTypes.AUTHENTICATION_ERROR]: 'Please check if the API key is correct and valid',
      [ErrorTypes.INSUFFICIENT_CREDITS]: 'Please recharge your account or use features that require fewer credits',
      [ErrorTypes.INSUFFICIENT_PERMISSIONS]: 'Please upgrade your account level to get more features',
      [ErrorTypes.VALIDATION_ERROR]: 'Please check the API documentation to confirm the correct parameter format',
      [ErrorTypes.NETWORK_ERROR]: 'Please check your network connection to ensure you can access the external API',
      [ErrorTypes.TIMEOUT_ERROR]: 'Please try again later, or contact the service provider to check the service status',
      [ErrorTypes.PROVIDER_ERROR]: 'The data provider may be under maintenance, please try again later',
      [ErrorTypes.SYSTEM_ERROR]: 'Please restart the application or contact technical support'
    };

    return suggestionMap[errorInfo.type] || 'Please contact technical support for help';
  }

  /**
   * 记录错误统计
   * @private
   */
  _recordError(errorInfo) {
    this.errorStats.totalErrors++;
    
    // 按类型统计
    if (!this.errorStats.errorsByType[errorInfo.type]) {
      this.errorStats.errorsByType[errorInfo.type] = 0;
    }
    this.errorStats.errorsByType[errorInfo.type]++;
    
    // 按提供商统计
    if (errorInfo.provider) {
      if (!this.errorStats.errorsByProvider[errorInfo.provider]) {
        this.errorStats.errorsByProvider[errorInfo.provider] = 0;
      }
      this.errorStats.errorsByProvider[errorInfo.provider]++;
    }
    
    // 记录最近错误
    this.errorStats.recentErrors.unshift({
      ...errorInfo,
      id: this._generateErrorId()
    });
    
    // 保持最近错误数量限制
    if (this.errorStats.recentErrors.length > this.maxRecentErrors) {
      this.errorStats.recentErrors = this.errorStats.recentErrors.slice(0, this.maxRecentErrors);
    }
  }

  /**
   * 生成错误ID
   * @private
   */
  _generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取错误统计信息
   * @returns {Object} 错误统计
   */
  getErrorStats() {
    return {
      ...this.errorStats,
      recentErrors: this.errorStats.recentErrors.slice(0, 10) // 只返回最近10个错误
    };
  }

  /**
   * 清理错误统计
   */
  clearErrorStats() {
    this.errorStats = {
      totalErrors: 0,
      errorsByType: {},
      errorsByProvider: {},
      recentErrors: []
    };
  }

  /**
   * 检查是否有频繁错误
   * @param {number} timeWindowMs - 时间窗口（毫秒）
   * @param {number} threshold - 错误阈值
   * @returns {boolean} 是否有频繁错误
   */
  hasFrequentErrors(timeWindowMs = 60000, threshold = 10) {
    const cutoffTime = new Date(Date.now() - timeWindowMs);
    const recentErrorsInWindow = this.errorStats.recentErrors.filter(
      error => new Date(error.timestamp) > cutoffTime
    );
    
    return recentErrorsInWindow.length >= threshold;
  }

  /**
   * 获取特定类型的错误数量
   * @param {string} errorType - 错误类型
   * @returns {number} 错误数量
   */
  getErrorCountByType(errorType) {
    return this.errorStats.errorsByType[errorType] || 0;
  }

  /**
   * 获取特定提供商的错误数量
   * @param {string} provider - 提供商名称
   * @returns {number} 错误数量
   */
  getErrorCountByProvider(provider) {
    return this.errorStats.errorsByProvider[provider] || 0;
  }
}

module.exports = { ErrorHandler, ErrorTypes, ErrorSeverity };