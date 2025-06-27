# 编码规范文档

## 项目概述
本项目是一个可扩展的多数据供应商MCP服务器，当前支持RootData API，未来将支持更多Web3数据供应商。

## 文件结构规范

```
web3-data-mcp/
├── src/
│   ├── index.js                    # MCP服务器入口
│   ├── providers/                  # 数据供应商模块
│   │   ├── base/                   # 供应商基础抽象类
│   │   │   ├── DataProvider.js     # 供应商基类
│   │   │   └── ApiClient.js        # API客户端基类
│   │   ├── rootdata/               # RootData供应商实现
│   │   │   ├── RootDataProvider.js # RootData主类
│   │   │   ├── RootDataClient.js   # RootData API客户端
│   │   │   ├── endpoints/          # API端点定义
│   │   │   └── tools/              # MCP工具定义
│   │   └── index.js                # 供应商注册中心
│   ├── core/                       # 核心功能模块
│   │   ├── McpServer.js            # MCP服务器核心
│   │   ├── ToolRouter.js           # 工具路由器
│   │   ├── ConfigManager.js        # 配置管理器
│   │   └── ErrorHandler.js         # 错误处理器
│   ├── utils/                      # 工具函数
│   │   ├── language.js             # 语言检测工具
│   │   ├── validation.js           # 参数验证工具
│   │   └── logger.js               # 日志工具
│   └── types/                      # 类型定义（如使用TypeScript）
├── tests/                          # 测试文件
├── docs/                           # 文档
├── config/                         # 配置文件
└── package.json
```

## 编码风格规范

### 1. JavaScript/Node.js 规范
- 使用 ES6+ 语法
- 使用 2 空格缩进
- 使用单引号包围字符串
- 每行最大长度 100 字符
- 使用 camelCase 命名变量和函数
- 使用 PascalCase 命名类
- 使用 UPPER_SNAKE_CASE 命名常量

### 2. 注释规范
```javascript
/**
 * 数据供应商基类
 * @class DataProvider
 */
class DataProvider {
  /**
   * 初始化数据供应商
   * @param {Object} config - 配置对象
   * @param {string} config.apiKey - API密钥
   * @param {string} config.baseUrl - 基础URL
   */
  constructor(config) {
    // 实现代码
  }

  /**
   * 执行API查询
   * @param {string} query - 查询字符串
   * @returns {Promise<Object>} API响应结果
   * @throws {Error} 当API调用失败时抛出错误
   */
  async query(query) {
    // 实现代码
  }
}
```

### 3. 错误处理规范
```javascript
// 自定义错误类
class ApiError extends Error {
  constructor(message, code, provider) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.provider = provider;
  }
}

// 错误处理示例
try {
  const result = await provider.query(params);
  return result;
} catch (error) {
  if (error instanceof ApiError) {
    // 处理API特定错误
    throw new Error(`${error.provider} API错误: ${error.message} (代码: ${error.code})`);
  }
  // 处理其他错误
  throw error;
}
```

## 架构设计规范

### 1. 供应商抽象设计
- 所有数据供应商必须继承 `DataProvider` 基类
- 实现统一的接口方法：`initialize()`, `query()`, `getAvailableTools()`, `checkCredits()`
- 每个供应商独立处理自己的认证和错误

### 2. MCP工具规范
```javascript
// 工具定义标准格式
const toolDefinition = {
  name: 'search_projects',           // 工具名称
  description: '搜索Web3项目',       // 工具描述
  inputSchema: {                     // 输入参数定义
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: '搜索关键词'
      }
    },
    required: ['query']
  },
  provider: 'rootdata',              // 供应商标识
  endpoint: 'search/projects',       // API端点
  requiredLevel: 'basic',            // 所需最低等级
  creditsPerCall: 5                  // 每次调用消耗credits
};
```

### 3. 配置管理规范
- 使用环境变量或启动参数传递敏感信息
- 配置文件使用JSON格式
- 必须验证所有配置参数的有效性

### 4. 日志规范
```javascript
// 使用统一的日志格式
logger.info('MCP服务器启动', { port: 3000, providers: ['rootdata'] });
logger.error('API调用失败', { 
  provider: 'rootdata', 
  endpoint: '/api/search', 
  error: error.message,
  userId: 'user123'
});
```

### 5. MCP协议兼容性规范

#### 5.1 STDOUT协议专用性要求（重要！）
```javascript
// ❌ 严重错误 - console.log输出到STDOUT，会干扰JSON-RPC协议
console.log('Memory monitoring started');
console.log('RootData provider initialized successfully');
console.log('Registered tools');

// ✅ 正确做法 - 所有调试信息使用console.error输出到STDERR
console.error('Memory monitoring started');
console.error('RootData provider initialized successfully');
console.error('Registered tools');
```

#### 5.2 严格禁止使用Emoji字符
```javascript
// ❌ 错误示例 - 会导致字符编码问题
console.error('✅ MCP Server initialization completed');
console.error(`📊 Registered ${this.providers.size} data providers`);
console.error('🔧 Tool registered');

// ✅ 正确示例 - 使用纯文本
console.error('MCP Server initialization completed');
console.error(`Registered ${this.providers.size} data providers`);
console.error('Tool registered');
```

#### 5.3 字符编码和输出流要求
**关键原则**：
- **STDOUT专用性**：STDOUT必须只包含标准JSON-RPC消息，任何其他输出都会导致协议解析失败
- **STDERR调试**：所有调试信息、状态消息、错误日志必须通过STDERR输出
- **字符集限制**：所有日志输出必须使用纯ASCII字符，避免emoji和特殊符号

**绝对禁止**：
- ❌ 在MCP服务器中使用`console.log()`
- ❌ 在日志中使用emoji字符
- ❌ 向STDOUT输出任何非JSON-RPC内容

#### 5.4 MCP服务器日志最佳实践
```javascript
// ✅ 推荐的日志格式
class McpServer {
  initialize() {
    console.error('Initializing Web3 Data MCP Server...');
    console.error('RootData provider initialized successfully');
    console.error(`Registered ${count} data providers`);
  }
  
  handleError(error) {
    console.error('Tool call failed:', error.message);
    console.error('Error details:', error.stack);
  }
}
```

#### 5.5 协议通信规则
1. **STDOUT专用性**：STDOUT仅用于JSON-RPC协议通信，不得输出任何其他内容
2. **STDERR调试**：所有调试信息、状态消息、错误日志通过STDERR输出
3. **编码安全**：避免使用可能导致编码问题的特殊字符
4. **消息格式**：确保所有JSON消息格式正确，不包含非标准字符

#### 5.6 参数类型安全规范
**关键原则**：
- **类型防御性**: 所有接收外部参数的方法必须进行类型检查
- **类型转换明确性**: 显式进行类型转换，避免隐式假设
- **工具特化处理**: 不同工具类型需要不同的参数处理策略

**必须遵循**：
- ✅ 在方法入口进行参数类型检查
- ✅ 为不同工具类型提供专门的参数处理逻辑
- ✅ 使用`String()`, `parseInt()`等明确的类型转换

**绝对禁止**：
- ❌ 假设参数总是特定类型（如字符串）
- ❌ 直接对未验证类型的参数调用方法
- ❌ 忽略类型转换的边界情况

```javascript
// ✅ 正确的参数类型处理
function processQuery(query, toolName) {
  // 类型检查和转换
  if (typeof query !== 'string') {
    query = String(query);
    console.error(`Query converted to string: "${query}"`);
  }
  
  // 工具特化处理
  if (toolName === 'get_project_details' && typeof originalParam === 'number') {
    query = `project_${originalParam}`;
  }
  
  return query.toLowerCase(); // 安全调用
}

// ❌ 错误的参数处理
function processQuery(query) {
  return query.toLowerCase(); // 💥 可能TypeError
}
```

#### 5.7 代码审查检查点
在代码审查时，必须检查以下项目：

**MCP协议兼容性**：
- [ ] **禁用console.log**：是否有使用`console.log()`输出到STDOUT
- [ ] **禁用emoji字符**：是否有console.error包含emoji字符
- [ ] **STDOUT纯净性**：STDOUT是否只输出JSON-RPC消息
- [ ] **STDERR规范性**：调试日志是否正确使用STDERR
- [ ] **字符编码安全**：是否使用纯ASCII字符

**参数类型安全**：
- [ ] **类型检查完整性**：关键方法是否有参数类型检查
- [ ] **类型转换明确性**：是否使用显式类型转换
- [ ] **字符串方法安全性**：调用字符串方法前是否验证类型
- [ ] **工具参数适配**：不同工具是否有对应的参数处理逻辑
- [ ] **边界情况测试**：是否测试null、undefined、非预期类型

**重要提醒**：
- 使用`console.log()`会导致Claude Desktop出现"Unexpected token"JSON解析错误
- 使用emoji字符会导致字符编码问题
- 参数类型错误会导致"is not a function"运行时错误
- 违反这些规范会使MCP服务器完全无法在Claude Desktop中工作

## 测试规范

### 1. 单元测试
- 每个类和主要函数都必须有单元测试
- 测试文件命名：`*.test.js`
- 测试覆盖率要求：≥80%

### 2. 集成测试
- 测试MCP服务器与各供应商的集成
- 测试错误处理和边界情况
- 使用模拟数据避免实际API调用

### 3. 测试数据
- 所有测试使用模拟数据
- 不在测试中使用真实的API密钥
- 创建专门的测试配置文件

## Git 提交规范

### 提交消息格式
```
<type>(<scope>): <subject>

<body>

<footer>
```

### 类型说明
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建或工具变动

### 示例
```
feat(rootdata): 添加项目搜索API支持

- 实现RootData项目搜索接口
- 添加参数验证和错误处理
- 支持中英文语言自动检测

Closes #123
```

## 性能和安全规范

### 1. 性能要求
- API响应时间 < 5秒
- 合理使用异步操作
- 避免内存泄漏

### 2. 安全要求
- 永远不在日志中记录API密钥
- 验证所有用户输入
- 使用HTTPS进行API调用
- 实现适当的错误消息，避免泄露敏感信息

## 扩展性设计原则

### 1. 新供应商集成
- 创建新的供应商目录
- 继承 `DataProvider` 基类
- 实现必需的接口方法
- 在供应商注册中心注册

### 2. 新功能添加
- 保持向后兼容性
- 使用功能开关控制新特性
- 完善的文档和测试

### 3. 配置扩展
- 为新供应商添加配置参数
- 保持配置结构的一致性
- 提供默认值和验证

这些规范将确保代码质量、可维护性和项目的可扩展性。