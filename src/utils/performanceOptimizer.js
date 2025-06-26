/**
 * 性能优化模块
 * 提供缓存、内存管理、请求优化等功能
 */

/**
 * LRU缓存实现
 */
class LRUCache {
  constructor(maxSize = 100, ttl = 300000) { // 默认5分钟TTL
    this.maxSize = maxSize;
    this.ttl = ttl;
    this.cache = new Map();
    this.timers = new Map();
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    // 检查是否过期
    if (Date.now() > item.expiry) {
      this.delete(key);
      return null;
    }

    // 移动到最后（LRU策略）
    this.cache.delete(key);
    this.cache.set(key, item);
    
    return item.value;
  }

  set(key, value) {
    // 清除现有的定时器
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    const expiry = Date.now() + this.ttl;
    
    // 如果缓存已满，删除最旧的项
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      this.delete(firstKey);
    }

    this.cache.set(key, { value, expiry });

    // 设置过期定时器
    const timer = setTimeout(() => {
      this.delete(key);
    }, this.ttl);
    
    this.timers.set(key, timer);
  }

  delete(key) {
    this.cache.delete(key);
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
  }

  clear() {
    this.timers.forEach(timer => clearTimeout(timer));
    this.cache.clear();
    this.timers.clear();
  }

  size() {
    return this.cache.size;
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl,
      keys: Array.from(this.cache.keys())
    };
  }
}

/**
 * 请求缓存管理器
 */
class RequestCacheManager {
  constructor(options = {}) {
    this.cache = new LRUCache(options.maxSize || 500, options.ttl || 300000);
    this.hitCount = 0;
    this.missCount = 0;
    this.enabled = options.enabled !== false;
  }

  generateKey(endpoint, params) {
    const sortedParams = Object.keys(params || {})
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {});
    
    return `${endpoint}:${JSON.stringify(sortedParams)}`;
  }

  get(endpoint, params) {
    if (!this.enabled) return null;

    const key = this.generateKey(endpoint, params);
    const result = this.cache.get(key);
    
    if (result) {
      this.hitCount++;
      console.log(`📋 Cache hit for ${endpoint}`);
    } else {
      this.missCount++;
    }
    
    return result;
  }

  set(endpoint, params, data) {
    if (!this.enabled) return;

    const key = this.generateKey(endpoint, params);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      endpoint,
      params
    });
    
    console.log(`💾 Cached response for ${endpoint}`);
  }

  invalidate(pattern) {
    const keys = Array.from(this.cache.cache.keys());
    const regex = new RegExp(pattern);
    
    keys.forEach(key => {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    });
  }

  getStats() {
    const total = this.hitCount + this.missCount;
    const hitRate = total > 0 ? (this.hitCount / total * 100).toFixed(2) : '0.00';
    
    return {
      enabled: this.enabled,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: `${hitRate}%`,
      cacheSize: this.cache.size(),
      cacheStats: this.cache.getStats()
    };
  }

  clear() {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }
}

/**
 * 请求限流器
 */
class RateLimiter {
  constructor(maxRequests = 100, windowMs = 60000) { // 默认每分钟100个请求
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }

  canMakeRequest() {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // 清除窗口外的请求
    this.requests = this.requests.filter(timestamp => timestamp > windowStart);
    
    return this.requests.length < this.maxRequests;
  }

  recordRequest() {
    if (this.canMakeRequest()) {
      this.requests.push(Date.now());
      return true;
    }
    return false;
  }

  getStats() {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const currentRequests = this.requests.filter(timestamp => timestamp > windowStart).length;
    
    return {
      currentRequests,
      maxRequests: this.maxRequests,
      windowMs: this.windowMs,
      remaining: this.maxRequests - currentRequests,
      resetTime: new Date(now + this.windowMs)
    };
  }
}

/**
 * 请求批处理器
 */
class RequestBatcher {
  constructor(options = {}) {
    this.batchSize = options.batchSize || 10;
    this.batchDelay = options.batchDelay || 100; // 100ms
    this.pendingRequests = [];
    this.batchTimer = null;
  }

  addRequest(request) {
    return new Promise((resolve, reject) => {
      this.pendingRequests.push({ request, resolve, reject });
      
      if (this.pendingRequests.length >= this.batchSize) {
        this.processBatch();
      } else if (!this.batchTimer) {
        this.batchTimer = setTimeout(() => {
          this.processBatch();
        }, this.batchDelay);
      }
    });
  }

  async processBatch() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    const batch = this.pendingRequests.splice(0, this.batchSize);
    if (batch.length === 0) return;

    console.log(`🔄 Processing batch of ${batch.length} requests`);

    // 并行处理批次中的所有请求
    const promises = batch.map(async ({ request, resolve, reject }) => {
      try {
        const result = await request();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });

    await Promise.allSettled(promises);
  }
}

/**
 * 内存监控器
 */
class MemoryMonitor {
  constructor(options = {}) {
    this.maxMemoryMB = options.maxMemoryMB || 500;
    this.checkInterval = options.checkInterval || 30000; // 30秒
    this.warnings = [];
    this.isMonitoring = false;
  }

  start() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.intervalId = setInterval(() => {
      this.checkMemory();
    }, this.checkInterval);
    
    console.log('📊 Memory monitoring started');
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isMonitoring = false;
    console.log('📊 Memory monitoring stopped');
  }

  checkMemory() {
    if (typeof process === 'undefined') return; // 浏览器环境
    
    const memUsage = process.memoryUsage();
    const usedMB = memUsage.rss / 1024 / 1024;
    
    if (usedMB > this.maxMemoryMB) {
      const warning = {
        timestamp: new Date(),
        usedMB: usedMB.toFixed(2),
        maxMB: this.maxMemoryMB,
        message: `Memory usage (${usedMB.toFixed(2)}MB) exceeds limit (${this.maxMemoryMB}MB)`
      };
      
      this.warnings.push(warning);
      console.warn('⚠️ ' + warning.message);
      
      // 触发垃圾回收（如果可用）
      if (global.gc) {
        console.log('🗑️ Triggering garbage collection');
        global.gc();
      }
    }
  }

  getStats() {
    if (typeof process === 'undefined') {
      return { available: false, reason: 'Browser environment' };
    }
    
    const memUsage = process.memoryUsage();
    return {
      available: true,
      rss: (memUsage.rss / 1024 / 1024).toFixed(2) + ' MB',
      heapTotal: (memUsage.heapTotal / 1024 / 1024).toFixed(2) + ' MB',
      heapUsed: (memUsage.heapUsed / 1024 / 1024).toFixed(2) + ' MB',
      external: (memUsage.external / 1024 / 1024).toFixed(2) + ' MB',
      maxMemoryMB: this.maxMemoryMB,
      warnings: this.warnings.slice(-10), // 最近10个警告
      isMonitoring: this.isMonitoring
    };
  }
}

/**
 * 性能优化器主类
 */
class PerformanceOptimizer {
  constructor(options = {}) {
    this.cacheManager = new RequestCacheManager(options.cache);
    this.rateLimiter = new RateLimiter(options.rateLimit?.maxRequests, options.rateLimit?.windowMs);
    this.batcher = new RequestBatcher(options.batch);
    this.memoryMonitor = new MemoryMonitor(options.memory);
    
    this.startTime = Date.now();
    this.requestCount = 0;
    this.errorCount = 0;
    
    // 启动内存监控
    if (options.memory?.enabled !== false) {
      this.memoryMonitor.start();
    }
  }

  /**
   * 优化API请求
   */
  async optimizeRequest(endpoint, params, requestFn) {
    this.requestCount++;
    
    try {
      // 1. 检查缓存
      const cached = this.cacheManager.get(endpoint, params);
      if (cached) {
        return cached.data;
      }

      // 2. 检查速率限制
      if (!this.rateLimiter.recordRequest()) {
        const stats = this.rateLimiter.getStats();
        throw new Error(`Rate limit exceeded. Try again after ${stats.resetTime.toISOString()}`);
      }

      // 3. 执行请求（可能通过批处理）
      const result = await requestFn();

      // 4. 缓存结果
      if (result && result.success) {
        this.cacheManager.set(endpoint, params, result);
      }

      return result;
    } catch (error) {
      this.errorCount++;
      throw error;
    }
  }

  /**
   * 批处理请求
   */
  async batchRequest(requestFn) {
    return this.batcher.addRequest(requestFn);
  }

  /**
   * 预热缓存
   */
  async warmupCache(endpoints) {
    console.log('🔥 Starting cache warmup...');
    
    for (const { endpoint, params, requestFn } of endpoints) {
      try {
        await this.optimizeRequest(endpoint, params, requestFn);
        console.log(`✅ Warmed up cache for ${endpoint}`);
      } catch (error) {
        console.warn(`⚠️ Failed to warm up cache for ${endpoint}:`, error.message);
      }
    }
    
    console.log('🔥 Cache warmup completed');
  }

  /**
   * 清理优化器
   */
  cleanup() {
    this.cacheManager.clear();
    this.memoryMonitor.stop();
  }

  /**
   * 获取性能统计
   */
  getStats() {
    const uptime = Date.now() - this.startTime;
    const averageRequestsPerMinute = this.requestCount > 0 ? 
      (this.requestCount / (uptime / 60000)).toFixed(2) : '0.00';
    const errorRate = this.requestCount > 0 ? 
      (this.errorCount / this.requestCount * 100).toFixed(2) : '0.00';

    return {
      uptime: `${(uptime / 1000).toFixed(2)} seconds`,
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      errorRate: `${errorRate}%`,
      averageRequestsPerMinute,
      cache: this.cacheManager.getStats(),
      rateLimit: this.rateLimiter.getStats(),
      memory: this.memoryMonitor.getStats()
    };
  }
}

module.exports = {
  PerformanceOptimizer,
  RequestCacheManager,
  RateLimiter,
  RequestBatcher,
  MemoryMonitor,
  LRUCache
}; 