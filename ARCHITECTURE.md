# 多供应商MCP服务器架构设计

## 系统概述

本系统是一个可扩展的Web3数据MCP服务器，支持多个数据供应商，当前实现RootData API支持，为未来集成更多供应商提供灵活的架构基础。

## 核心架构原则

### 1. 可扩展性 (Extensibility)
- 插件化的供应商架构
- 统一的供应商接口
- 动态工具注册机制

### 2. 智能路由 (Smart Routing)
- 根据用户问题自动选择合适的API
- 基于用户等级的工具过滤
- 多供应商数据聚合

### 3. 可观测性 (Observability)
- Credits余额实时监控
- API调用状态追踪
- 详细的错误报告

## 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        MCP Client                           │
│              (Claude/其他MCP客户端)                         │
└─────────┬───────────────────────────────────────────────────┘
          │ MCP Protocol
          │
┌─────────▼───────────────────────────────────────────────────┐
│                     MCP Server Core                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Tool Router │  │Config Mgr   │  │Error Handler│        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────┬───────────────────────────────────────────────────┘
          │
┌─────────▼───────────────────────────────────────────────────┐
│                 Provider Manager                            │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│ │  RootData       │ │   Future        │ │   Future        │ │
│ │  Provider       │ │   Provider 2    │ │   Provider 3    │ │
│ │                 │ │                 │ │                 │ │
│ │ ├─API Client    │ │ ├─API Client    │ │ ├─API Client    │ │
│ │ ├─Tools         │ │ ├─Tools         │ │ ├─Tools         │ │
│ │ ├─Auth          │ │ ├─Auth          │ │ ├─Auth          │ │
│ │ └─Credits       │ │ └─Credits       │ │ └─Credits       │ │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘ │
└─────────┬───────────────────────────────────────────────────┘
          │
┌─────────▼───────────────────────────────────────────────────┐
│                    External APIs                            │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│ │   RootData      │ │     Future      │ │     Future      │ │
│ │     API         │ │     API 2       │ │     API 3       │ │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 核心组件设计

### 1. MCP Server Core (src/core/)

#### McpServer.js - 主服务器
```javascript
class McpServer {
  constructor(config) {
    this.providerManager = new ProviderManager();
    this.toolRouter = new ToolRouter();
    this.configManager = new ConfigManager(config);
    this.errorHandler = new ErrorHandler();
  }

  async initialize() {
    // 初始化所有供应商
    // 注册MCP工具
    // 启动服务器
  }

  async handleToolCall(toolName, parameters) {
    // 路由工具调用到对应供应商
  }
}
```

#### ToolRouter.js - 工具路由器
```javascript
class ToolRouter {
  constructor() {
    this.routes = new Map();
    this.userLevels = new Map();
  }

  async routeQuery(userQuery, availableProviders) {
    // 分析用户查询意图
    // 选择最合适的API端点
    // 返回路由决策
  }

  registerTool(toolDefinition) {
    // 注册新工具
  }

  getAvailableTools(userLevel, providerCredits) {
    // 根据用户等级和credits返回可用工具
  }
}
```

### 2. Provider System (src/providers/)

#### 基础抽象层 (src/providers/base/)

```javascript
// DataProvider.js - 供应商基类
class DataProvider {
  constructor(name, config) {
    this.name = name;
    this.config = config;
    this.client = null;
    this.userLevel = 'unknown';
    this.credits = 0;
  }

  // 必须实现的抽象方法
  async initialize() { throw new Error('Must implement initialize()'); }
  async checkCredits() { throw new Error('Must implement checkCredits()'); }
  async executeApiCall(endpoint, params) { throw new Error('Must implement executeApiCall()'); }
  getAvailableTools() { throw new Error('Must implement getAvailableTools()'); }
  
  // 通用方法
  async validateCredentials() {
    const result = await this.checkCredits();
    this.credits = result.credits;
    this.userLevel = result.level;
    return result;
  }
}

// ApiClient.js - API客户端基类
class ApiClient {
  constructor(baseUrl, apiKey) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.httpClient = this.createHttpClient();
  }

  async request(endpoint, method = 'POST', data = {}) {
    // 统一的HTTP请求处理
    // 错误处理和重试逻辑
    // 响应格式化
  }
}
```

#### RootData实现 (src/providers/rootdata/)

```javascript
// RootDataProvider.js
class RootDataProvider extends DataProvider {
  constructor(config) {
    super('rootdata', config);
    this.client = new RootDataClient(config.baseUrl, config.apiKey);
    this.endpoints = require('./endpoints');
  }

  async initialize() {
    await this.validateCredentials();
    this.registerTools();
  }

  async checkCredits() {
    return await this.client.request('/user/apikey/balance');
  }

  getAvailableTools() {
    return this.endpoints.filter(endpoint => 
      this.hasAccess(endpoint.requiredLevel) && 
      this.hasCredits(endpoint.creditsPerCall)
    );
  }

  // RootData特定的工具实现
  async searchProjects(params) {
    const language = detectLanguage(params.query);
    return await this.client.request('/search/project', 'POST', {
      ...params,
      lang: language
    });
  }
}
```

### 3. 智能路由系统

#### 查询意图分析
```javascript
class QueryAnalyzer {
  analyzeIntent(query) {
    const intent = {
      type: null,      // 'search', 'details', 'funding', 'token', etc.
      entities: [],    // 提取的实体
      language: 'en',  // 检测的语言
      confidence: 0    // 置信度
    };

    // 使用关键词匹配和模式识别
    // 例如：
    if (this.isSearchQuery(query)) {
      intent.type = 'search';
      intent.entities = this.extractSearchTerms(query);
    }

    return intent;
  }
}
```

#### 供应商选择策略
```javascript
class ProviderSelector {
  selectProviders(intent, availableProviders) {
    const candidates = [];

    availableProviders.forEach(provider => {
      const tools = provider.getAvailableTools();
      const matchingTools = tools.filter(tool => 
        this.toolMatchesIntent(tool, intent)
      );

      if (matchingTools.length > 0) {
        candidates.push({
          provider,
          tools: matchingTools,
          score: this.calculateRelevanceScore(intent, matchingTools)
        });
      }
    });

    return candidates.sort((a, b) => b.score - a.score);
  }
}
```

### 4. 错误处理和监控

#### 统一错误处理
```javascript
class ErrorHandler {
  handleApiError(error, provider, context) {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      provider: provider.name,
      errorType: error.constructor.name,
      message: error.message,
      context
    };

    // 记录错误日志
    logger.error('API调用失败', errorInfo);

    // 根据错误类型返回用户友好的消息
    if (error.code === 'INSUFFICIENT_CREDITS') {
      return {
        success: false,
        error: `Credits不足。当前剩余: ${provider.credits}`,
        suggestion: '请充值或联系管理员'
      };
    }

    return this.formatErrorResponse(error);
  }
}
```

#### Credits监控
```javascript
class CreditsMonitor {
  constructor() {
    this.thresholds = {
      warning: 100,   // 警告阈值
      critical: 20    // 严重警告阈值
    };
  }

  checkCreditsStatus(provider) {
    const status = {
      provider: provider.name,
      credits: provider.credits,
      level: provider.userLevel,
      status: 'ok'
    };

    if (provider.credits <= this.thresholds.critical) {
      status.status = 'critical';
      status.message = `Credits严重不足 (${provider.credits})，请立即充值`;
    } else if (provider.credits <= this.thresholds.warning) {
      status.status = 'warning';
      status.message = `Credits不足 (${provider.credits})，建议充值`;
    }

    return status;
  }
}
```

## 配置管理

### 启动参数配置
```json
{
  "server": {
    "name": "web3-data-mcp",
    "version": "1.0.0"
  },
  "providers": {
    "rootdata": {
      "enabled": true,
      "baseUrl": "https://api.rootdata.com",
      "apiKey": "${ROOTDATA_API_KEY}",
      "timeout": 30000,
      "retries": 3
    }
  },
  "monitoring": {
    "creditsWarningThreshold": 100,
    "creditsCriticalThreshold": 20
  }
}
```

### MCP客户端配置示例
```json
{
  "mcpServers": {
    "web3-data": {
      "command": "node",
      "args": ["src/index.js"],
      "env": {
        "ROOTDATA_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## 扩展性设计

### 添加新供应商
1. 在 `src/providers/` 下创建新目录
2. 继承 `DataProvider` 基类
3. 实现必需的抽象方法
4. 定义工具和端点
5. 在 `ProviderManager` 中注册

### 工具定义标准
```javascript
const toolSchema = {
  name: 'string',              // 工具名称
  description: 'string',       // 工具描述  
  provider: 'string',          // 供应商名称
  endpoint: 'string',          // API端点
  requiredLevel: 'string',     // 最低用户等级
  creditsPerCall: 'number',    // 消耗credits
  inputSchema: 'object',       // 输入参数schema
  category: 'string'           // 工具分类
};
```

这个架构确保了系统的可扩展性、可维护性，并为未来集成更多数据供应商提供了坚实的基础。