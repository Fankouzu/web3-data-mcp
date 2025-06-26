/**
 * API客户端基类
 * 提供统一的HTTP请求处理和错误管理
 */

const https = require('https');
const { URL } = require('url');

/**
 * 自定义API错误类
 */
class ApiError extends Error {
  constructor(message, code, statusCode, provider) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.provider = provider;
  }
}

class ApiClient {
  /**
   * 初始化API客户端
   * @param {string} baseUrl - 基础URL
   * @param {string} apiKey - API密钥
   * @param {Object} options - 配置选项
   * @param {number} options.timeout - 请求超时时间（毫秒）
   * @param {number} options.retries - 重试次数
   * @param {Object} options.defaultHeaders - 默认请求头
   */
  constructor(baseUrl, apiKey, options = {}) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    this.apiKey = apiKey;
    this.timeout = options.timeout || 30000;
    this.retries = options.retries || 3;
    this.defaultHeaders = options.defaultHeaders || {};

    // 请求统计
    this.stats = {
      totalRequests:       0,
      successfulRequests:  0,
      failedRequests:      0,
      averageResponseTime: 0
    };
  }

  /**
   * 执行HTTP请求
   * @param {string} endpoint - API端点
   * @param {string} method - HTTP方法
   * @param {Object} data - 请求数据
   * @param {Object} headers - 额外的请求头
   * @returns {Promise<Object>} 响应结果
   */
  async request(endpoint, method = 'POST', data = {}, headers = {}) {
    const startTime = Date.now();
    let lastError = null;

    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        this.stats.totalRequests++;

        const response = await this._makeRequest(endpoint, method, data, headers);

        // 记录成功
        this.stats.successfulRequests++;
        this._updateAverageResponseTime(Date.now() - startTime);

        return response;
      } catch (error) {
        lastError = error;

        // 如果是最后一次尝试或不应该重试的错误，直接抛出
        if (attempt === this.retries || !this._shouldRetry(error)) {
          this.stats.failedRequests++;
          throw error;
        }

        // 等待后重试
        await this._delay(this._getRetryDelay(attempt));
      }
    }

    this.stats.failedRequests++;
    throw lastError;
  }

  /**
   * 执行单次HTTP请求
   * @private
   */
  async _makeRequest(endpoint, method, data, headers) {
    return new Promise((resolve, reject) => {
      // 简单的路径拼接，避免URL构造问题
      const fullPath = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
      const postData = method !== 'GET' ? JSON.stringify(data) : null;

      const requestHeaders = {
        'Content-Type': 'application/json',
        ...this.defaultHeaders,
        ...headers
      };

      if (postData) {
        requestHeaders['Content-Length'] = Buffer.byteLength(postData);
      }

      // 解析baseUrl
      const baseUrl = new URL(this.baseUrl);

      const options = {
        hostname: baseUrl.hostname,
        port:     baseUrl.port || (baseUrl.protocol === 'https:' ? 443 : 80),
        path:     baseUrl.pathname + fullPath,
        method,
        headers:  requestHeaders,
        timeout:  this.timeout
      };

      const req = https.request(options, res => {
        let body = '';

        res.on('data', chunk => {
          body += chunk;
        });

        res.on('end', () => {
          try {
            // 尝试解析JSON响应
            let result;
            try {
              result = JSON.parse(body);
            } catch (parseError) {
              // 如果不是JSON，返回原始文本
              result = body;
            }

            const response = {
              statusCode: res.statusCode,
              headers:    res.headers,
              data:       result
            };

            // 检查HTTP状态码
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(response);
            } else {
              const error = new ApiError(
                `HTTP ${res.statusCode}: ${result.message || result}`,
                result.code || res.statusCode,
                res.statusCode,
                this.constructor.name
              );
              reject(error);
            }
          } catch (error) {
            reject(
              new ApiError(
                `Response processing error: ${error.message}`,
                'RESPONSE_PARSE_ERROR',
                res.statusCode,
                this.constructor.name
              )
            );
          }
        });
      });

      req.on('error', error => {
        console.error(`🌐 Network request failed: ${method} ${endpoint}`);
        console.error(`❌ Network error: ${error.message}`);
        console.error(`🔍 Error code: ${error.code}`);
        reject(new ApiError(`Network request error: ${error.message}`, 'NETWORK_ERROR', null, this.constructor.name));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new ApiError(`Request timeout (${this.timeout}ms)`, 'TIMEOUT', null, this.constructor.name));
      });

      if (postData) {
        req.write(postData);
      }

      req.end();
    });
  }

  /**
   * 判断是否应该重试
   * @private
   */
  _shouldRetry(error) {
    // 网络错误和超时错误可以重试
    if (error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT') {
      return true;
    }

    // 5xx服务器错误可以重试
    if (error.statusCode && error.statusCode >= 500) {
      return true;
    }

    // 429 (Too Many Requests) 可以重试
    if (error.statusCode === 429) {
      return true;
    }

    return false;
  }

  /**
   * 获取重试延迟时间
   * @private
   */
  _getRetryDelay(attempt) {
    // 指数退避策略：1s, 2s, 4s...
    return Math.min(1000 * Math.pow(2, attempt - 1), 10000);
  }

  /**
   * 延迟执行
   * @private
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 更新平均响应时间
   * @private
   */
  _updateAverageResponseTime(responseTime) {
    const totalRequests = this.stats.successfulRequests;
    this.stats.averageResponseTime =
      (this.stats.averageResponseTime * (totalRequests - 1) + responseTime) / totalRequests;
  }

  /**
   * 获取客户端统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    return {
      ...this.stats,
      successRate:
        this.stats.totalRequests > 0
          ? ((this.stats.successfulRequests / this.stats.totalRequests) * 100).toFixed(2) + '%'
          : '0%'
    };
  }

  /**
   * 重置统计信息
   */
  resetStats() {
    this.stats = {
      totalRequests:       0,
      successfulRequests:  0,
      failedRequests:      0,
      averageResponseTime: 0
    };
  }

  /**
   * 设置默认请求头
   * @param {Object} headers - 请求头对象
   */
  setDefaultHeaders(headers) {
    this.defaultHeaders = { ...this.defaultHeaders, ...headers };
  }

  /**
   * 获取基础URL
   * @returns {string} 基础URL
   */
  getBaseUrl() {
    return this.baseUrl;
  }

  /**
   * 更新API密钥
   * @param {string} newApiKey - 新的API密钥
   */
  updateApiKey(newApiKey) {
    this.apiKey = newApiKey;
  }
}

module.exports = { ApiClient, ApiError };
