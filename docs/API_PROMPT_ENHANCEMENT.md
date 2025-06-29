# API 文档：系统提示词增强功能

## 概述

系统提示词增强功能通过在 MCP Server 的各个层级添加智能提示词，显著提升了 LLM 与 API 的交互准确性。本文档详细说明了如何使用和配置这些增强功能。

## 架构概览

```
┌─────────────────┐
│   LLM Client    │
└────────┬────────┘
         │
┌────────▼────────┐
│   MCP Server    │◄── PromptManager
├─────────────────┤
│   ToolRouter    │◄── Routing Prompts
├─────────────────┤
│ ResponseFormatter│◄── Response Prompts
├─────────────────┤
│  ErrorHandler   │◄── Error Prompts
└────────┬────────┘
         │
┌────────▼────────┐
│   RootData API  │
└─────────────────┘
```

## 核心组件

### 1. PromptManager

管理所有提示词的核心组件，提供缓存、多语言支持和热更新功能。

#### 初始化

```javascript
const { PromptManager } = require('./core/PromptManager');

const promptManager = new PromptManager({
  promptsDir: './src/prompts',     // 提示词目录
  defaultLanguage: 'en',           // 默认语言
  cacheEnabled: true,              // 启用缓存
  cacheTTL: 3600000,              // 缓存过期时间（毫秒）
  hotReload: true                  // 开发环境热更新
});

await promptManager.initialize();
```

#### 方法

##### getToolPrompt(toolName, promptType, options)
获取工具相关的提示词。

参数：
- `toolName` (string): 工具名称
- `promptType` (string): 提示词类型 ('system', 'usage', 'examples')
- `options` (object): 选项
  - `language` (string): 语言代码 ('en', 'zh')
  - `variables` (object): 模板变量

返回：
- (string): 处理后的提示词文本

示例：
```javascript
const systemPrompt = promptManager.getToolPrompt(
  'search_web3_entities', 
  'system',
  { language: 'en' }
);
```

##### getRoutingPrompt(promptType, options)
获取路由相关的提示词。

参数：
- `promptType` (string): 提示词类型 ('intent_analysis', 'entity_extraction', 'param_building', 'route_selection')
- `options` (object): 选项

##### getResponsePrompt(promptType, options)
获取响应格式化相关的提示词。

##### getErrorPrompt(errorType, options)
获取错误处理相关的提示词。

### 2. 增强的 MCP Server

#### 初始化配置

```javascript
const server = new McpServer({
  name: 'web3-data-mcp',
  version: '1.0.0',
  prompts: {
    enabled: true,              // 启用提示词增强
    defaultLanguage: 'en',      // 默认语言
    cacheEnabled: true,         // 启用缓存
    cacheTTL: 3600000          // 缓存过期时间
  }
});

await server.initialize(providerConfigs);
```

#### 工具定义增强

所有工具定义现在包含 `guidance` 字段：

```json
{
  "name": "search_web3_entities",
  "description": "搜索Web3项目、组织和人员",
  "inputSchema": { ... },
  "guidance": {
    "system": "When searching for Web3 entities...",
    "usage": "Use this tool to search for projects...",
    "examples": [
      {
        "query": "search for DeFi projects",
        "params": { "query": "DeFi" }
      }
    ]
  }
}
```

### 3. 路由增强

#### 意图分析增强

系统现在能更准确地理解查询意图：

```javascript
// 输入
"find uni protocol"

// 增强后的分析结果
{
  intent: {
    type: 'search',
    confidence: 0.95,
    keywords: ['find'],
    enhanced: true
  },
  entities: [
    {
      type: 'PROJECT',
      value: 'Uniswap',  // 自动扩展缩写
      confidence: 0.85,
      source: 'abbreviation_expansion'
    }
  ]
}
```

#### 支持的实体类型

- `PROJECT`: 项目名称
- `TOKEN`: 代币符号
- `ECOSYSTEM`: 生态系统
- `ADDRESS`: 合约地址
- `NUMBER`: 数字ID
- `X_HANDLE`: Twitter/X账号
- `ORGANIZATION`: 组织名称

### 4. 响应增强

#### 增强的响应格式

```json
{
  "success": true,
  "data": [ ... ],
  "interpretation": {
    "summary": "Found 5 DeFi projects on Ethereum",
    "language": "en"
  },
  "suggestions": [
    {
      "action": "get_project_details",
      "description": "Get detailed information about Uniswap",
      "params": { "project_id": 11646 }
    }
  ],
  "dataQuality": {
    "level": "high",
    "indicators": ["Recent updates", "Complete data"],
    "confidence": 0.95
  },
  "credits": {
    "remaining": 1990,
    "used": 1,
    "status": "normal"
  }
}
```

#### 空结果帮助

当查询返回空结果时，系统会提供帮助信息：

```json
{
  "emptyResultHelp": {
    "message": "No results found for your query",
    "suggestions": [
      "Try using more general search terms",
      "Check spelling of project names",
      "Use different keywords"
    ],
    "alternativeQueries": [
      "search DeFi projects",
      "find Ethereum projects"
    ]
  }
}
```

### 5. 错误处理增强

#### 智能错误响应

```json
{
  "error": {
    "code": "INSUFFICIENT_CREDITS",
    "message": "Credits insufficient, requires 10, currently only 5",
    "suggestion": "Please recharge your account or use features that require fewer credits",
    "alternativeTools": [
      {
        "tool": "search_web3_entities",
        "creditsRequired": 0
      }
    ],
    "documentation": "https://docs.rootdata.com/credits"
  }
}
```

## 配置文件结构

### 工具提示词 (tools.yaml)

```yaml
tools:
  search_web3_entities:
    system:
      en: |
        When searching for Web3 entities, follow these guidelines:
        1. Consider multiple variations of project names
        2. Use fuzzy matching for better results
      zh: |
        搜索Web3实体时，请遵循以下准则：
        1. 考虑项目名称的多种变体
        2. 使用模糊匹配以获得更好的结果
    
    usage:
      en: "Use this tool to search for Web3 projects, organizations, and people"
      zh: "使用此工具搜索Web3项目、组织和人员"
```

### 路由提示词 (routing.yaml)

```yaml
routing:
  intent_analysis:
    en: |
      Analyze the query intent:
      - Search: looking for projects or entities
      - Details: requesting specific information
      - Credits: checking account balance
```

### 响应提示词 (responses.yaml)

```yaml
responses:
  search_success:
    interpretation:
      en: "Found {count} matching {type} entities"
      zh: "找到 {count} 个匹配的{type}实体"
```

## 使用示例

### 基本查询流程

```javascript
// 1. LLM 发送查询
const query = "find DeFi projects on Ethereum";

// 2. 路由分析（带提示词增强）
const routing = await server.toolRouter.routeQuery(query, {
  language: 'en',
  requestId: 'req-123'
});

// 3. API 调用
const result = await provider.executeApiCall(
  routing.endpoint,
  routing.params
);

// 4. 响应格式化（带提示词增强）
const formattedResponse = server._formatToolResponse({
  ...result,
  intent: routing.intent,
  entities: routing.entities,
  language: 'en'
});

// 5. 返回给 LLM
return formattedResponse;
```

### 多语言支持

```javascript
// 中文查询
const query = "查找以太坊上的DeFi项目";

const routing = await server.toolRouter.routeQuery(query, {
  language: 'zh'  // 自动检测或指定语言
});
```

### 错误处理

```javascript
try {
  const result = await server.executeToolCall(toolName, params);
} catch (error) {
  // 错误处理器会自动使用提示词增强
  const enhancedError = server.errorHandler.handle(error, {
    tool: toolName,
    language: userLanguage
  });
  
  return enhancedError;
}
```

## 性能优化

### 缓存策略

```yaml
# performance.yaml
cache:
  strategies:
    prompts:
      ttl: 7200  # 2小时
      priority: high
    
    routing:
      ttl: 1800  # 30分钟
      priority: medium
```

### 预热建议

```javascript
// 启动时预热常用查询
const commonQueries = [
  'search ethereum projects',
  'get project details',
  'check credits'
];

for (const query of commonQueries) {
  await server.toolRouter.routeQuery(query, { dryRun: true });
}
```

## 监控和调试

### 获取统计信息

```javascript
const stats = server.promptManager.getStats();
console.log(stats);
// {
//   cacheSize: 150,
//   promptsLoaded: 66,
//   cacheHitRate: "75.5%",
//   totalRequests: 1000,
//   hits: 755,
//   misses: 245
// }
```

### 调试模式

```javascript
// 启用详细日志
process.env.DEBUG_PROMPTS = 'true';

// 查看路由决策过程
const routing = await server.toolRouter.routeQuery(query, {
  debug: true,
  includeDetails: true
});
```

## 最佳实践

1. **缓存配置**
   - 生产环境启用缓存
   - 根据使用模式调整 TTL
   - 监控缓存命中率

2. **语言处理**
   - 优先使用自动语言检测
   - 为每种语言提供完整的提示词
   - 实现优雅的降级策略

3. **错误处理**
   - 总是提供有用的建议
   - 包含替代方案
   - 保持错误消息的一致性

4. **性能优化**
   - 预热常用查询
   - 使用批处理
   - 监控响应时间

## 版本兼容性

- MCP SDK: >= 0.2.0
- Node.js: >= 14.0.0
- 支持的语言: en, zh

## 故障排除

### 常见问题

1. **提示词未加载**
   - 检查文件路径
   - 验证 YAML 语法
   - 查看初始化日志

2. **缓存命中率低**
   - 增加缓存 TTL
   - 预热更多查询
   - 检查缓存键生成

3. **响应时间慢**
   - 启用缓存
   - 优化提示词长度
   - 使用批处理

## 更多资源

- [开发计划](./PROMPT_ENHANCEMENT_PLAN.md)
- [技术规范](./PROMPT_ENHANCEMENT_TECHNICAL_SPEC.md)
- [测试报告](./PHASE5_TEST_REPORT.md) 