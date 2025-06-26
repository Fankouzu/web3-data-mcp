/**
 * 配置管理器
 * 负责读取和验证MCP服务器配置
 */

class ConfigManager {
  constructor() {
    this.config = null;
    this.envConfig = {};
    this._loadEnvironmentConfig();
  }

  /**
   * 加载配置
   * @param {Object} userConfig - 用户提供的配置
   * @returns {Object} 完整的配置对象
   */
  loadConfig(userConfig = {}) {
    // 默认配置
    const defaultConfig = {
      server: {
        name: 'web3-data-mcp',
        version: '1.0.0',
        timeout: 30000,
        retries: 3
      },
      providers: {},
      monitoring: {
        creditsWarningThreshold: 100,
        creditsCriticalThreshold: 20,
        autoRefreshInterval: 300000, // 5分钟
        errorFrequencyThreshold: 10
      },
      logging: {
        level: 'info',
        enableStats: true,
        enableErrorTracking: true
      }
    };

    // 合并配置：默认配置 < 环境变量配置 < 用户配置
    this.config = this._deepMerge(
      defaultConfig,
      this.envConfig,
      userConfig
    );

    // 验证配置
    this._validateConfig();

    return this.config;
  }

  /**
   * 获取配置
   * @param {string} path - 配置路径，例如 'server.timeout'
   * @returns {any} 配置值
   */
  get(path) {
    if (!this.config) {
      throw new Error('Configuration not loaded, please call loadConfig() first');
    }

    return this._getNestedValue(this.config, path);
  }

  /**
   * 设置配置值
   * @param {string} path - 配置路径
   * @param {any} value - 配置值
   */
  set(path, value) {
    if (!this.config) {
      throw new Error('Configuration not loaded, please call loadConfig() first');
    }

    this._setNestedValue(this.config, path, value);
  }

  /**
   * 获取供应商配置
   * @param {string} providerName - 供应商名称
   * @returns {Object|null} 供应商配置
   */
  getProviderConfig(providerName) {
    const providers = this.get('providers') || {};
    return providers[providerName] || null;
  }

  /**
   * 验证API密钥是否存在
   * @param {string} providerName - 供应商名称
   * @returns {boolean} 密钥是否存在
   */
  hasApiKey(providerName) {
    const providerConfig = this.getProviderConfig(providerName);
    return !!(providerConfig && providerConfig.apiKey);
  }

  /**
   * 获取所有已配置的供应商
   * @returns {Array} 供应商名称列表
   */
  getConfiguredProviders() {
    const providers = this.get('providers') || {};
    return Object.keys(providers).filter(name => this.hasApiKey(name));
  }

  /**
   * 导出当前配置（隐藏敏感信息）
   * @returns {Object} 安全的配置对象
   */
  exportSafeConfig() {
    if (!this.config) {
      return null;
    }

    const safeConfig = JSON.parse(JSON.stringify(this.config));
    
    // 隐藏API密钥
    if (safeConfig.providers) {
      Object.keys(safeConfig.providers).forEach(providerName => {
        if (safeConfig.providers[providerName].apiKey) {
          const key = safeConfig.providers[providerName].apiKey;
          safeConfig.providers[providerName].apiKey = this._maskApiKey(key);
        }
      });
    }

    return safeConfig;
  }

  /**
   * 从环境变量加载配置
   * @private
   */
  _loadEnvironmentConfig() {
    // 服务器配置
    if (process.env.MCP_SERVER_NAME) {
      this.envConfig.server = { name: process.env.MCP_SERVER_NAME };
    }

    if (process.env.MCP_SERVER_TIMEOUT) {
      this.envConfig.server = { 
        ...this.envConfig.server,
        timeout: parseInt(process.env.MCP_SERVER_TIMEOUT, 10) 
      };
    }

    // 供应商配置
    this.envConfig.providers = {};

    // RootData配置
    if (process.env.ROOTDATA_API_KEY) {
      this.envConfig.providers.rootdata = {
        apiKey: process.env.ROOTDATA_API_KEY,
        baseUrl: process.env.ROOTDATA_BASE_URL || 'https://api.rootdata.com/open',
        timeout: process.env.ROOTDATA_TIMEOUT ? parseInt(process.env.ROOTDATA_TIMEOUT, 10) : undefined,
        retries: process.env.ROOTDATA_RETRIES ? parseInt(process.env.ROOTDATA_RETRIES, 10) : undefined
      };
    }

    // 监控配置
    if (process.env.CREDITS_WARNING_THRESHOLD) {
      this.envConfig.monitoring = {
        creditsWarningThreshold: parseInt(process.env.CREDITS_WARNING_THRESHOLD, 10)
      };
    }

    if (process.env.CREDITS_CRITICAL_THRESHOLD) {
      this.envConfig.monitoring = {
        ...this.envConfig.monitoring,
        creditsCriticalThreshold: parseInt(process.env.CREDITS_CRITICAL_THRESHOLD, 10)
      };
    }

    // 日志配置
    if (process.env.LOG_LEVEL) {
      this.envConfig.logging = {
        level: process.env.LOG_LEVEL.toLowerCase()
      };
    }
  }

  /**
   * 验证配置
   * @private
   */
  _validateConfig() {
    const errors = [];

    // 验证服务器配置
    if (!this.config.server.name) {
      errors.push('Server name cannot be empty');
    }

    if (this.config.server.timeout < 1000) {
      errors.push('Server timeout cannot be less than 1000 milliseconds');
    }

    if (this.config.server.retries < 0) {
      errors.push('Retry count cannot be negative');
    }

    // 验证供应商配置
    const configuredProviders = this.getConfiguredProviders();
    if (configuredProviders.length === 0) {
      errors.push('At least one data provider must be configured');
    }

    configuredProviders.forEach(providerName => {
      const providerConfig = this.getProviderConfig(providerName);
      
      if (!providerConfig.apiKey) {
        errors.push(`${providerName} provider missing API key`);
      }

      if (providerConfig.timeout && providerConfig.timeout < 1000) {
        errors.push(`${providerName} provider timeout cannot be less than 1000 milliseconds`);
      }
    });

    // 验证监控配置
    const monitoring = this.config.monitoring;
    if (monitoring.creditsWarningThreshold <= monitoring.creditsCriticalThreshold) {
      errors.push('Credits warning threshold must be greater than critical threshold');
    }

    if (monitoring.autoRefreshInterval < 60000) {
      errors.push('Auto refresh interval cannot be less than 60 seconds');
    }

    // 如果有错误，抛出异常
    if (errors.length > 0) {
      throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }
  }

  /**
   * 深度合并对象
   * @private
   */
  _deepMerge(target, ...sources) {
    if (!sources.length) return target;
    const source = sources.shift();

    if (this._isObject(target) && this._isObject(source)) {
      for (const key in source) {
        if (this._isObject(source[key])) {
          if (!target[key]) Object.assign(target, { [key]: {} });
          this._deepMerge(target[key], source[key]);
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      }
    }

    return this._deepMerge(target, ...sources);
  }

  /**
   * 检查是否为对象
   * @private
   */
  _isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  /**
   * 获取嵌套属性值
   * @private
   */
  _getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * 设置嵌套属性值
   * @private
   */
  _setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      return current[key];
    }, obj);
    
    target[lastKey] = value;
  }

  /**
   * 掩码API密钥
   * @private
   */
  _maskApiKey(apiKey) {
    if (!apiKey || apiKey.length < 8) {
      return '***';
    }
    
    const start = apiKey.substring(0, 4);
    const end = apiKey.substring(apiKey.length - 4);
    const middle = '*'.repeat(Math.max(4, apiKey.length - 8));
    
    return `${start}${middle}${end}`;
  }

  /**
   * 创建示例配置文件
   * @returns {string} 配置文件内容
   */
  static createExampleConfig() {
    const exampleConfig = {
      server: {
        name: 'web3-data-mcp',
        version: '1.0.0',
        timeout: 30000,
        retries: 3
      },
      providers: {
        rootdata: {
          apiKey: 'your-rootdata-api-key-here',
          baseUrl: 'https://api.rootdata.com/open',
          timeout: 30000,
          retries: 3
        }
        // 未来可以添加更多供应商
        // chainanalysis: {
        //   apiKey: 'your-chainanalysis-api-key-here',
        //   baseUrl: 'https://api.chainanalysis.com',
        //   timeout: 30000,
        //   retries: 3
        // }
      },
      monitoring: {
        creditsWarningThreshold: 100,
        creditsCriticalThreshold: 20,
        autoRefreshInterval: 300000, // 5分钟
        errorFrequencyThreshold: 10
      },
      logging: {
        level: 'info',
        enableStats: true,
        enableErrorTracking: true
      }
    };

    return JSON.stringify(exampleConfig, null, 2);
  }

  /**
   * 获取环境变量配置说明
   * @returns {string} 环境变量说明
   */
  static getEnvironmentVariablesHelp() {
    return `
环境变量配置说明:

服务器配置:
  MCP_SERVER_NAME              MCP服务器名称
  MCP_SERVER_TIMEOUT           请求超时时间（毫秒）

RootData供应商配置:
  ROOTDATA_API_KEY             RootData API密钥（必需）
  ROOTDATA_BASE_URL            RootData API基础URL
  ROOTDATA_TIMEOUT             RootData请求超时时间（毫秒）
  ROOTDATA_RETRIES             RootData请求重试次数

监控配置:
  CREDITS_WARNING_THRESHOLD    Credits警告阈值
  CREDITS_CRITICAL_THRESHOLD   Credits严重警告阈值

日志配置:
  LOG_LEVEL                    日志级别 (debug, info, warn, error)

示例:
  export ROOTDATA_API_KEY=your-api-key-here
  export CREDITS_WARNING_THRESHOLD=100
  export LOG_LEVEL=info

---

Environment Variables Configuration Guide:

Server Configuration:
  MCP_SERVER_NAME              MCP server name
  MCP_SERVER_TIMEOUT           Request timeout (milliseconds)

RootData Provider Configuration:
  ROOTDATA_API_KEY             RootData API key (required)
  ROOTDATA_BASE_URL            RootData API base URL
  ROOTDATA_TIMEOUT             RootData request timeout (milliseconds)
  ROOTDATA_RETRIES             RootData request retry count

Monitoring Configuration:
  CREDITS_WARNING_THRESHOLD    Credits warning threshold
  CREDITS_CRITICAL_THRESHOLD   Credits critical warning threshold

Logging Configuration:
  LOG_LEVEL                    Log level (debug, info, warn, error)

Examples:
  export ROOTDATA_API_KEY=your-api-key-here
  export CREDITS_WARNING_THRESHOLD=100
  export LOG_LEVEL=info
`;
  }
}

module.exports = ConfigManager;