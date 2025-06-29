/**
 * 统一错误处理器
 * 处理系统中的各种错误并提供用户友好的错误消息
 */

const { ApiError } = require('../providers/base/ApiClient');

/**
 * 错误类型枚举
 */
const ErrorTypes = {
  API_ERROR:                'API_ERROR',
  AUTHENTICATION_ERROR:     'AUTHENTICATION_ERROR',
  INSUFFICIENT_CREDITS:     'INSUFFICIENT_CREDITS',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  VALIDATION_ERROR:         'VALIDATION_ERROR',
  NETWORK_ERROR:            'NETWORK_ERROR',
  TIMEOUT_ERROR:            'TIMEOUT_ERROR',
  PROVIDER_ERROR:           'PROVIDER_ERROR',
  SYSTEM_ERROR:             'SYSTEM_ERROR'
};

/**
 * 错误严重性级别
 */
const ErrorSeverity = {
  LOW:      'low',
  MEDIUM:   'medium',
  HIGH:     'high',
  CRITICAL: 'critical'
};

class ErrorHandler {
  constructor() {
    this.errorStats = {
      totalErrors:      0,
      errorsByType:     {},
      errorsByProvider: {},
      recentErrors:     []
    };

    // 保留最近100个错误记录
    this.maxRecentErrors = 100;
    
    // 提示词管理器（将在初始化后注入）
    this.promptManager = null;
  }

  /**
   * 设置提示词管理器
   * @param {PromptManager} promptManager - 提示词管理器实例
   */
  setPromptManager(promptManager) {
    this.promptManager = promptManager;
    console.error('PromptManager injected into ErrorHandler');
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
      error:   {
        type:       errorInfo.type,
        message:    userMessage,
        code:       errorInfo.code,
        provider,
        severity:   errorInfo.severity,
        timestamp:  errorInfo.timestamp,
        suggestion: this._getErrorSuggestion(errorInfo),
        details:    context.includeDetails ? errorInfo.details : undefined
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
      type:      ErrorTypes.INSUFFICIENT_CREDITS,
      severity:  ErrorSeverity.HIGH,
      provider,
      message:   `Credits insufficient, requires ${required}, currently only ${available}`,
      required,
      available,
      timestamp: new Date().toISOString()
    };

    this._recordError(errorInfo);

    return {
      success: false,
      error:   {
        type:       errorInfo.type,
        message:    errorInfo.message,
        provider,
        severity:   errorInfo.severity,
        timestamp:  errorInfo.timestamp,
        suggestion: `Please recharge your ${provider} account, or use features that require fewer credits`,
        details:    {
          required,
          available,
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
      type:      ErrorTypes.INSUFFICIENT_PERMISSIONS,
      severity:  ErrorSeverity.MEDIUM,
      provider,
      message:   `Insufficient permissions, requires ${requiredLevel} level, currently ${currentLevel}`,
      requiredLevel,
      currentLevel,
      timestamp: new Date().toISOString()
    };

    this._recordError(errorInfo);

    return {
      success: false,
      error:   {
        type:       errorInfo.type,
        message:    errorInfo.message,
        provider,
        severity:   errorInfo.severity,
        timestamp:  errorInfo.timestamp,
        suggestion: `Please upgrade your ${provider} account to ${requiredLevel} level to use this feature`,
        details:    {
          requiredLevel,
          currentLevel
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
      type:      ErrorTypes.VALIDATION_ERROR,
      severity:  ErrorSeverity.LOW,
      message,
      invalidParams,
      timestamp: new Date().toISOString()
    };

    this._recordError(errorInfo);

    return {
      success: false,
      error:   {
        type:       errorInfo.type,
        message,
        severity:   errorInfo.severity,
        timestamp:  errorInfo.timestamp,
        suggestion: 'Please check if the input parameters meet the requirements',
        details:    invalidParams
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
        type:       this._getErrorTypeFromApiError(error),
        severity:   this._getErrorSeverity(error),
        provider,
        message:    error.message,
        code:       error.code,
        statusCode: error.statusCode,
        details:    {
          originalError: error.message,
          context
        },
        timestamp
      };
    }

    // 处理其他类型的错误
    return {
      type:     ErrorTypes.SYSTEM_ERROR,
      severity: ErrorSeverity.MEDIUM,
      provider,
      message:  error.message || 'Unknown error',
      code:     error.code || 'UNKNOWN_ERROR',
      details:  {
        originalError: error.toString(),
        stack:         error.stack,
        context
      },
      timestamp
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
    // 如果有提示词管理器，使用提示词增强的消息
    if (this.promptManager) {
      const errorTypeMap = {
        [ErrorTypes.API_ERROR]: 'api_error',
        [ErrorTypes.AUTHENTICATION_ERROR]: 'authentication_error',
        [ErrorTypes.INSUFFICIENT_CREDITS]: 'insufficient_credits',
        [ErrorTypes.INSUFFICIENT_PERMISSIONS]: 'authentication_error',
        [ErrorTypes.VALIDATION_ERROR]: 'validation_error',
        [ErrorTypes.NETWORK_ERROR]: 'network_error',
        [ErrorTypes.TIMEOUT_ERROR]: 'timeout_error',
        [ErrorTypes.PROVIDER_ERROR]: 'api_error',
        [ErrorTypes.SYSTEM_ERROR]: 'api_error'
      };
      
      const promptType = errorTypeMap[errorInfo.type];
      if (promptType) {
        const guidance = this.promptManager.getErrorPrompt(promptType, {
          language: errorInfo.language || 'en'
        });
        
        // 如果获取到了提示词指导，使用它来生成更好的消息
        if (guidance) {
          return this._enhanceErrorMessage(errorInfo, guidance);
        }
      }
    }
    
    // 默认消息映射
    const messageMap = {
      [ErrorTypes.API_ERROR]:                'Data query failed, please try again later',
      [ErrorTypes.AUTHENTICATION_ERROR]:     'API authentication failed, please check your access key',
      [ErrorTypes.INSUFFICIENT_CREDITS]:     `Credits balance insufficient, current operation cannot be completed`,
      [ErrorTypes.INSUFFICIENT_PERMISSIONS]: 'Insufficient permissions, requires a higher level account',
      [ErrorTypes.VALIDATION_ERROR]:         'Input parameters are incorrect, please check and try again',
      [ErrorTypes.NETWORK_ERROR]:            'Network connection failed, please check your network connection',
      [ErrorTypes.TIMEOUT_ERROR]:            'Request timed out, please try again later',
      [ErrorTypes.PROVIDER_ERROR]:           'Data provider service exception',
      [ErrorTypes.SYSTEM_ERROR]:             'System internal error, please try again later'
    };

    return messageMap[errorInfo.type] || errorInfo.message;
  }

  /**
   * 获取错误建议
   * @private
   */
  _getErrorSuggestion(errorInfo) {
    // 如果有提示词管理器，生成更好的建议
    if (this.promptManager) {
      const errorRecoveryGuidance = this.promptManager.getErrorPrompt('error_recovery', {
        language: errorInfo.language || 'en'
      });
      
      if (errorRecoveryGuidance) {
        const enhancedSuggestion = this._generateEnhancedSuggestion(errorInfo, errorRecoveryGuidance);
        if (enhancedSuggestion) {
          return enhancedSuggestion;
        }
      }
    }
    
    // 默认建议映射
    const suggestionMap = {
      [ErrorTypes.API_ERROR]:                'Please try again later, if the problem persists, please contact technical support',
      [ErrorTypes.AUTHENTICATION_ERROR]:     'Please check if the API key is correct and valid',
      [ErrorTypes.INSUFFICIENT_CREDITS]:     'Please recharge your account or use features that require fewer credits',
      [ErrorTypes.INSUFFICIENT_PERMISSIONS]: 'Please upgrade your account level to get more features',
      [ErrorTypes.VALIDATION_ERROR]:         'Please check the API documentation to confirm the correct parameter format',
      [ErrorTypes.NETWORK_ERROR]:            'Please check your network connection to ensure you can access the external API',
      [ErrorTypes.TIMEOUT_ERROR]:            'Please try again later, or contact the service provider to check the service status',
      [ErrorTypes.PROVIDER_ERROR]:           'The data provider may be under maintenance, please try again later',
      [ErrorTypes.SYSTEM_ERROR]:             'Please restart the application or contact technical support'
    };

    return suggestionMap[errorInfo.type] || 'Please contact technical support for help';
  }

  /**
   * 使用提示词增强错误消息
   * @private
   */
  _enhanceErrorMessage(errorInfo, guidance) {
    // 根据错误类型生成增强消息
    switch (errorInfo.type) {
      case ErrorTypes.INSUFFICIENT_CREDITS:
        if (errorInfo.required && errorInfo.available) {
          return `You need ${errorInfo.required} credits for this operation, but only have ${errorInfo.available} credits available. ${errorInfo.required - errorInfo.available} more credits needed.`;
        }
        break;
        
      case ErrorTypes.VALIDATION_ERROR:
        if (errorInfo.invalidParams) {
          const params = Object.keys(errorInfo.invalidParams).join(', ');
          return `Invalid input detected in: ${params}. Please check the format and try again.`;
        }
        break;
        
      case ErrorTypes.TIMEOUT_ERROR:
        return 'The request took longer than expected. This might be due to a complex query or temporary server load. Please try again with a simpler query.';
        
      default:
        return errorInfo.message;
    }
    
    return errorInfo.message;
  }

  /**
   * 生成增强的错误建议
   * @private
   */
  _generateEnhancedSuggestion(errorInfo, guidance) {
    const suggestions = [];
    
    // 基于错误类型的具体建议
    switch (errorInfo.type) {
      case ErrorTypes.INSUFFICIENT_CREDITS:
        suggestions.push('Consider using search instead of detailed queries to save credits');
        suggestions.push('Check your credits balance before making bulk requests');
        break;
        
      case ErrorTypes.VALIDATION_ERROR:
        suggestions.push('Double-check the format of your input');
        suggestions.push('Refer to the examples in the tool description');
        break;
        
      case ErrorTypes.NETWORK_ERROR:
        suggestions.push('Check if you can access other websites');
        suggestions.push('Try disabling VPN if you\'re using one');
        break;
        
      case ErrorTypes.TIMEOUT_ERROR:
        suggestions.push('Break down complex queries into smaller parts');
        suggestions.push('Try searching for one item at a time');
        break;
    }
    
    // 如果检测到频繁错误，添加额外建议
    if (this.hasFrequentErrors(300000, 5)) { // 5分钟内5个错误
      suggestions.push('Multiple errors detected - the service might be experiencing issues');
      
      if (this.promptManager) {
        const frequentErrorsGuidance = this.promptManager.getErrorPrompt('frequent_errors', {
          language: errorInfo.language || 'en'
        });
        if (frequentErrorsGuidance) {
          suggestions.push('Consider waiting a few minutes before retrying');
        }
      }
    }
    
    return suggestions.length > 0 ? suggestions.join('. ') : null;
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
      totalErrors:      0,
      errorsByType:     {},
      errorsByProvider: {},
      recentErrors:     []
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
    const recentErrorsInWindow = this.errorStats.recentErrors.filter(error => new Date(error.timestamp) > cutoffTime);

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
