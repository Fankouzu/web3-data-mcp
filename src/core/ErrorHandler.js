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
      message: `Credits不足，需要 ${required}，当前仅有 ${available}`,
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
        suggestion: `请充值您的${provider}账户，或使用较少credits的功能`,
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
      message: `权限不足，需要 ${requiredLevel} 级别，当前为 ${currentLevel}`,
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
        suggestion: `请升级您的${provider}账户到 ${requiredLevel} 级别以使用此功能`,
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
        suggestion: '请检查输入参数是否符合要求',
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
      message: error.message || '未知错误',
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
      [ErrorTypes.API_ERROR]: '数据查询失败，请稍后重试',
      [ErrorTypes.AUTHENTICATION_ERROR]: 'API认证失败，请检查您的访问密钥',
      [ErrorTypes.INSUFFICIENT_CREDITS]: `Credits余额不足，当前操作无法完成`,
      [ErrorTypes.INSUFFICIENT_PERMISSIONS]: '权限不足，需要更高级别的账户',
      [ErrorTypes.VALIDATION_ERROR]: '输入参数有误，请检查后重试',
      [ErrorTypes.NETWORK_ERROR]: '网络连接失败，请检查网络连接',
      [ErrorTypes.TIMEOUT_ERROR]: '请求超时，请稍后重试',
      [ErrorTypes.PROVIDER_ERROR]: '数据提供商服务异常',
      [ErrorTypes.SYSTEM_ERROR]: '系统内部错误，请稍后重试'
    };

    return messageMap[errorInfo.type] || errorInfo.message;
  }

  /**
   * 获取错误建议
   * @private
   */
  _getErrorSuggestion(errorInfo) {
    const suggestionMap = {
      [ErrorTypes.API_ERROR]: '请稍后重试，如果问题持续存在，请联系技术支持',
      [ErrorTypes.AUTHENTICATION_ERROR]: '请检查API密钥是否正确且有效',
      [ErrorTypes.INSUFFICIENT_CREDITS]: '请充值账户或使用消耗较少credits的功能',
      [ErrorTypes.INSUFFICIENT_PERMISSIONS]: '请升级账户等级以获得更多功能',
      [ErrorTypes.VALIDATION_ERROR]: '请查看API文档确认正确的参数格式',
      [ErrorTypes.NETWORK_ERROR]: '请检查网络连接，确保可以访问外部API',
      [ErrorTypes.TIMEOUT_ERROR]: '请稍后重试，或联系服务提供商检查服务状态',
      [ErrorTypes.PROVIDER_ERROR]: '数据提供商可能正在维护，请稍后重试',
      [ErrorTypes.SYSTEM_ERROR]: '请重启应用或联系技术支持'
    };

    return suggestionMap[errorInfo.type] || '请联系技术支持获得帮助';
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