/**
 * 提示词管理器 - 统一管理所有提示词配置
 * 支持多语言、缓存、版本控制等功能
 */

const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

class PromptManager {
  constructor(config = {}) {
    this.config = {
      defaultLanguage: 'en',
      cacheEnabled: true,
      cacheTTL: 3600000, // 1小时
      promptsPath: path.join(__dirname, '..', 'prompts'),
      fallbackEnabled: true,
      ...config
    };
    
    this.prompts = new Map();
    this.cache = new Map();
    this.version = null;
    this.initialized = false;
    
    // 缓存统计
    this.stats = {
      hits: 0,
      misses: 0,
      loads: 0
    };
  }

  /**
   * 初始化提示词管理器
   */
  async initialize() {
    try {
      console.error('Initializing PromptManager...');
      
      // 1. 加载配置文件
      await this._loadPromptConfigs();
      
      // 2. 验证配置
      await this._validateConfigs();
      
      // 3. 初始化缓存
      this._initializeCache();
      
      // 4. 注册热更新（开发环境）
      if (process.env.NODE_ENV === 'development') {
        this._watchConfigChanges();
      }
      
      this.initialized = true;
      console.error(`PromptManager initialized successfully. Loaded ${this.prompts.size} prompts.`);
      return true;
    } catch (error) {
      console.error('PromptManager initialization failed:', error.message);
      return false;
    }
  }

  /**
   * 获取工具提示词
   */
  getToolPrompt(toolName, promptType = 'system', context = {}) {
    if (!this.initialized) {
      console.error('PromptManager not initialized');
      return '';
    }
    
    const language = context.language || this.config.defaultLanguage;
    const cacheKey = `tool:${toolName}:${promptType}:${language}`;
    
    // 检查缓存
    if (this.config.cacheEnabled) {
      const cached = this._getFromCache(cacheKey);
      if (cached !== null) {
        return cached;
      }
    }
    
    // 构建提示词
    const prompt = this._buildToolPrompt(toolName, promptType, context);
    
    // 更新缓存
    if (this.config.cacheEnabled && prompt) {
      this._setCache(cacheKey, prompt);
    }
    
    return prompt;
  }

  /**
   * 获取路由提示词
   */
  getRoutingPrompt(routingType, context = {}) {
    if (!this.initialized) {
      console.error('PromptManager not initialized');
      return '';
    }
    
    const language = context.language || this.config.defaultLanguage;
    const promptKey = `routing:${routingType}:${language}`;
    
    return this._getPromptWithFallback(promptKey, context);
  }

  /**
   * 获取响应提示词
   */
  getResponsePrompt(responseType, context = {}) {
    if (!this.initialized) {
      console.error('PromptManager not initialized');
      return '';
    }
    
    const language = context.language || this.config.defaultLanguage;
    const promptKey = `response:${responseType}:${language}`;
    
    return this._getPromptWithFallback(promptKey, context);
  }

  /**
   * 获取错误提示词
   */
  getErrorPrompt(errorType, context = {}) {
    if (!this.initialized) {
      console.error('PromptManager not initialized');
      return '';
    }
    
    const language = context.language || this.config.defaultLanguage;
    const promptKey = `error:${errorType}:${language}`;
    
    return this._getPromptWithFallback(promptKey, context);
  }

  /**
   * 获取性能统计
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total * 100).toFixed(2) : 0;
    
    return {
      cacheSize: this.cache.size,
      promptsLoaded: this.prompts.size,
      version: this.version,
      cacheHitRate: `${hitRate}%`,
      totalRequests: total,
      hits: this.stats.hits,
      misses: this.stats.misses,
      loads: this.stats.loads
    };
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.cache.clear();
    this.stats.hits = 0;
    this.stats.misses = 0;
    console.error('PromptManager cache cleared');
  }

  /**
   * 重新加载提示词
   */
  async reload() {
    console.error('Reloading prompts...');
    this.prompts.clear();
    this.clearCache();
    await this._loadPromptConfigs();
    await this._validateConfigs();
    console.error('Prompts reloaded successfully');
  }

  // ==================== 私有方法 ====================

  /**
   * 加载所有提示词配置
   */
  async _loadPromptConfigs() {
    try {
      // 加载工具提示词
      await this._loadToolPrompts();
      
      // 加载路由提示词
      await this._loadRoutingPrompts();
      
      // 加载响应提示词
      await this._loadResponsePrompts();
      
      // 加载错误提示词
      await this._loadErrorPrompts();
      
      // 加载版本信息
      await this._loadVersion();
      
      this.stats.loads++;
    } catch (error) {
      console.error('Error loading prompt configs:', error.message);
      throw error;
    }
  }

  /**
   * 加载工具提示词
   */
  async _loadToolPrompts() {
    const toolsPath = path.join(this.config.promptsPath, 'config', 'tools.yaml');
    
    try {
      const content = await fs.readFile(toolsPath, 'utf8');
      const config = yaml.load(content);
      
      if (config.tools) {
        Object.entries(config.tools).forEach(([toolName, toolConfig]) => {
          // 存储每个工具的完整配置
          this.prompts.set(`tools:${toolName}`, toolConfig);
          
          // 存储各种类型的提示词
          if (toolConfig.system) {
            Object.entries(toolConfig.system).forEach(([lang, prompt]) => {
              this.prompts.set(`tool:${toolName}:system:${lang}`, prompt);
            });
          }
          
          if (toolConfig.usage) {
            Object.entries(toolConfig.usage).forEach(([lang, prompt]) => {
              this.prompts.set(`tool:${toolName}:usage:${lang}`, prompt);
            });
          }
          
          if (toolConfig.examples) {
            this.prompts.set(`tool:${toolName}:examples`, toolConfig.examples);
          }
        });
      }
      
      console.error(`Loaded ${Object.keys(config.tools || {}).length} tool prompts`);
    } catch (error) {
      // 如果文件不存在，使用默认配置
      if (error.code === 'ENOENT') {
        console.error('Tools config not found, using defaults');
        this._loadDefaultToolPrompts();
      } else {
        throw error;
      }
    }
  }

  /**
   * 加载默认工具提示词
   */
  _loadDefaultToolPrompts() {
    const defaults = {
      search_web3_entities: {
        system: {
          en: 'Search for Web3 projects, organizations, and tokens. Use full names or common abbreviations for best results.',
          zh: '搜索Web3项目、组织和代币。使用全名或常见缩写以获得最佳结果。'
        },
        usage: {
          en: 'Enter project name, token symbol, or organization name',
          zh: '输入项目名称、代币符号或组织名称'
        }
      },
      get_project_details: {
        system: {
          en: 'Get detailed information about a specific Web3 project. Requires project ID or contract address.',
          zh: '获取特定Web3项目的详细信息。需要项目ID或合约地址。'
        },
        usage: {
          en: 'Provide project_id (number) or contract_address (string)',
          zh: '提供project_id（数字）或contract_address（字符串）'
        }
      }
    };
    
    Object.entries(defaults).forEach(([toolName, config]) => {
      this.prompts.set(`tools:${toolName}`, config);
      Object.entries(config.system).forEach(([lang, prompt]) => {
        this.prompts.set(`tool:${toolName}:system:${lang}`, prompt);
      });
      Object.entries(config.usage).forEach(([lang, prompt]) => {
        this.prompts.set(`tool:${toolName}:usage:${lang}`, prompt);
      });
    });
  }

  /**
   * 加载路由提示词
   */
  async _loadRoutingPrompts() {
    const routingPath = path.join(this.config.promptsPath, 'config', 'routing.yaml');
    
    try {
      const content = await fs.readFile(routingPath, 'utf8');
      const config = yaml.load(content);
      
      if (config.routing) {
        Object.entries(config.routing).forEach(([routingType, routingConfig]) => {
          Object.entries(routingConfig).forEach(([lang, prompt]) => {
            this.prompts.set(`routing:${routingType}:${lang}`, prompt);
          });
        });
      }
      
      console.error(`Loaded ${Object.keys(config.routing || {}).length} routing prompts`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.error('Routing config not found, using defaults');
      }
    }
  }

  /**
   * 加载响应提示词
   */
  async _loadResponsePrompts() {
    const responsePath = path.join(this.config.promptsPath, 'config', 'responses.yaml');
    
    try {
      const content = await fs.readFile(responsePath, 'utf8');
      const config = yaml.load(content);
      
      if (config.responses) {
        Object.entries(config.responses).forEach(([responseType, responseConfig]) => {
          Object.entries(responseConfig).forEach(([lang, prompt]) => {
            this.prompts.set(`response:${responseType}:${lang}`, prompt);
          });
        });
      }
      
      console.error(`Loaded ${Object.keys(config.responses || {}).length} response prompts`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.error('Response config not found, using defaults');
      }
    }
  }

  /**
   * 加载错误提示词
   */
  async _loadErrorPrompts() {
    const errorPath = path.join(this.config.promptsPath, 'config', 'errors.yaml');
    
    try {
      const content = await fs.readFile(errorPath, 'utf8');
      const config = yaml.load(content);
      
      if (config.errors) {
        Object.entries(config.errors).forEach(([errorType, errorConfig]) => {
          Object.entries(errorConfig).forEach(([lang, prompt]) => {
            this.prompts.set(`error:${errorType}:${lang}`, prompt);
          });
        });
      }
      
      console.error(`Loaded ${Object.keys(config.errors || {}).length} error prompts`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.error('Error config not found, using defaults');
      }
    }
  }

  /**
   * 加载版本信息
   */
  async _loadVersion() {
    const versionPath = path.join(this.config.promptsPath, 'VERSION');
    
    try {
      this.version = await fs.readFile(versionPath, 'utf8');
      this.version = this.version.trim();
    } catch (error) {
      this.version = '1.0.0';
    }
  }

  /**
   * 验证配置
   */
  async _validateConfigs() {
    // 验证必要的提示词是否存在
    const requiredPrompts = [
      'tool:search_web3_entities:system:en',
      'tool:get_project_details:system:en'
    ];
    
    for (const promptKey of requiredPrompts) {
      if (!this.prompts.has(promptKey)) {
        console.error(`Warning: Required prompt missing: ${promptKey}`);
      }
    }
    
    return true;
  }

  /**
   * 初始化缓存
   */
  _initializeCache() {
    // 预热常用提示词
    const commonPrompts = [
      'tool:search_web3_entities:system:en',
      'tool:search_web3_entities:system:zh',
      'tool:get_project_details:system:en',
      'tool:get_project_details:system:zh'
    ];
    
    commonPrompts.forEach(key => {
      const prompt = this.prompts.get(key);
      if (prompt) {
        this.cache.set(key, {
          value: prompt,
          timestamp: Date.now()
        });
      }
    });
    
    console.error(`Cache initialized with ${this.cache.size} entries`);
  }

  /**
   * 监听配置文件变化（开发环境）
   */
  _watchConfigChanges() {
    const fs = require('fs');
    const configPath = path.join(this.config.promptsPath, 'config');
    
    fs.watch(configPath, async (eventType, filename) => {
      if (filename && filename.endsWith('.yaml')) {
        console.error(`Prompt config changed: ${filename}, reloading...`);
        await this.reload();
      }
    });
    
    console.error('Watching for prompt config changes...');
  }

  /**
   * 构建工具提示词
   */
  _buildToolPrompt(toolName, promptType, context) {
    const language = context.language || this.config.defaultLanguage;
    const promptKey = `tool:${toolName}:${promptType}:${language}`;
    
    let prompt = this.prompts.get(promptKey);
    
    // 如果找不到指定语言的提示词，尝试降级到默认语言
    if (!prompt && this.config.fallbackEnabled && language !== this.config.defaultLanguage) {
      const fallbackKey = `tool:${toolName}:${promptType}:${this.config.defaultLanguage}`;
      prompt = this.prompts.get(fallbackKey);
    }
    
    // 如果还是找不到，返回空字符串
    if (!prompt) {
      this.stats.misses++;
      return '';
    }
    
    // 模板变量替换
    return this._interpolateTemplate(prompt, context);
  }

  /**
   * 带降级的提示词获取
   */
  _getPromptWithFallback(promptKey, context) {
    let prompt = this.prompts.get(promptKey);
    
    if (prompt) {
      return this._interpolateTemplate(prompt, context);
    }
    
    // 降级到默认语言
    if (this.config.fallbackEnabled && context.language !== this.config.defaultLanguage) {
      const fallbackKey = promptKey.replace(`:${context.language}`, `:${this.config.defaultLanguage}`);
      const fallbackPrompt = this.prompts.get(fallbackKey);
      
      if (fallbackPrompt) {
        return this._interpolateTemplate(fallbackPrompt, context);
      }
    }
    
    this.stats.misses++;
    return '';
  }

  /**
   * 模板插值
   */
  _interpolateTemplate(template, context) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return context[key] !== undefined ? context[key] : match;
    });
  }

  /**
   * 从缓存获取
   */
  _getFromCache(key) {
    const cached = this.cache.get(key);
    
    if (!cached) {
      this.stats.misses++;
      return null;
    }
    
    // 检查是否过期
    if (Date.now() - cached.timestamp > this.config.cacheTTL) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }
    
    this.stats.hits++;
    return cached.value;
  }

  /**
   * 设置缓存
   */
  _setCache(key, value) {
    // 限制缓存大小
    if (this.cache.size >= 1000) {
      // 删除最老的缓存项
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }
}

module.exports = PromptManager; 