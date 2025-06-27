# 错误经验总结文档

本文档记录开发过程中遇到的错误和解决方案，避免后续开发中重复相同错误。

## 错误记录

### 1. MCP协议JSON解析错误 - Emoji字符冲突 (2024-12-27)

#### 问题描述
在Claude Desktop中启动MCP服务器时出现JSON解析错误：
```
Unexpected token '�', "📊 Memory "... is not valid JSON
Unexpected token '�', "📝 Registe"... is not valid JSON  
Unexpected token '✅', "✅ RootData"... is not valid JSON
```

#### 错误原因
**主要原因 - console.log输出干扰**:
- **STDOUT污染**: `console.log()`输出到STDOUT，而MCP协议要求STDOUT只能包含JSON-RPC消息
- **协议混合**: 任何非JSON内容都会被MCP客户端当作协议消息解析，导致JSON语法错误

**次要原因 - emoji字符编码**:
- **字符编码问题**: emoji字符在传输过程中被转换为无效字符（`�`）
- **协议解析器限制**: JSON-RPC解析器无法正确处理emoji等特殊字符

#### 问题源头文件
1. `src/core/McpServer.js` - 服务器初始化日志
2. `src/providers/rootdata/RootDataProvider.js` - 供应商注册日志
3. `src/utils/performanceOptimizer.js` - 内存监控日志
4. `src/core/ToolRouter.js` - 工具注册日志
5. `src/core/CreditsMonitor.js` - 监控注册日志

#### 解决方案
**步骤1: 消除console.log输出**
```javascript
// ❌ 严重错误 - console.log输出到STDOUT，干扰JSON-RPC协议
console.log('Memory monitoring started');
console.log('RootData provider initialized successfully');
console.log('Registered tools');

// ✅ 正确 - 所有调试信息改为console.error输出到STDERR
console.error('Memory monitoring started');
console.error('RootData provider initialized successfully');
console.error('Registered tools');
```

**步骤2: 移除emoji字符**
```javascript
// ❌ 错误 - 包含emoji的日志输出
console.error('✅ MCP Server initialization completed');
console.error(`📊 Registered ${this.providers.size} data providers`);

// ✅ 正确 - 纯文本日志输出
console.error('MCP Server initialization completed');
console.error(`Registered ${this.providers.size} data providers`);
```

#### 关键修复点
1. **移除所有emoji字符**: 从console.error/console.log输出中移除emoji
2. **保持协议纯净**: STDOUT只用于JSON-RPC通信
3. **规范日志格式**: 所有调试信息使用纯ASCII字符

#### 验证方法
创建JSON兼容性测试确认无解析错误：
```javascript
// 测试MCP启动时的JSON兼容性
const mcpProcess = spawn('node', ['src/index.js'], {...});
// 监听stderr输出，检查是否有"Unexpected token"错误
```

#### 经验教训
- **STDOUT绝对纯净性**: MCP协议要求STDOUT绝对只能包含JSON-RPC消息，任何其他输出都会导致解析失败
- **console.log是MCP服务器的禁忌**: 在MCP服务器中使用console.log是导致JSON解析错误的最主要原因
- **调试信息必须走STDERR**: 所有状态信息、调试日志、错误信息必须通过console.error输出到STDERR
- **字符编码严格要求**: emoji和特殊字符会加重协议解析问题
- **错误症状的误导性**: "Unexpected token"错误看起来像JSON格式问题，实际是输出流混合问题

#### 预防措施
- **禁用console.log**: 在MCP服务器项目中全面禁用`console.log()`
- **强制使用console.error**: 所有非协议输出必须使用`console.error()`
- **自动化检查**: 使用`npm run mcp:check`定期检查协议兼容性
- **实际测试**: 在Claude Desktop中实际测试MCP服务器启动
- **代码审查重点**: 重点检查STDOUT输出纯净性

### 3. MCP工具参数类型错误 - 参数类型不匹配导致方法调用失败 (2025-06-27)

#### 问题描述
在Claude Desktop调用`get_project_details`工具时出现错误：
```
{"code":-32600,"message":"MCP error -32600: Routing processing failed: query.toLowerCase is not a function"}
```

#### 错误原因分析
**根本问题 - 参数类型假设错误**:
- **类型不匹配**: MCP工具调用传入数字类型的`project_id: 11646`，但代码假设查询参数总是字符串
- **隐式类型转换失败**: 直接将数字赋值给query参数，导致后续字符串方法调用失败

**错误链路**:
```
Claude Desktop → McpServer → routeQuery(11646) → _analyzeIntent(11646) → (11646).toLowerCase() → TypeError
```

#### 问题源头代码
**McpServer.js - 查询构建逻辑缺陷**:
```javascript
// 问题代码 - 直接使用project_id数字作为query
const query = toolArgs.query || toolArgs.token_symbol || toolArgs.ecosystem || toolArgs.project_id || `${toolName} request`;
```

**ToolRouter.js - 缺少类型检查**:
```javascript
// 错误触发点 - 假设query总是字符串
const queryLower = query.toLowerCase(); // 💥 TypeError when query is number
```

#### 修复实施过程

**修复1: McpServer查询构建智能化**
```javascript
// 修复后 - 智能处理不同类型的参数
let query = toolArgs.query || toolArgs.token_symbol || toolArgs.ecosystem;

// 对于特殊工具，处理非字符串参数
if (!query) {
  if (toolArgs.project_id && (toolName === 'get_project_details' || toolName.includes('project'))) {
    query = `project_${toolArgs.project_id}`;  // 数字→字符串转换
  } else if (toolArgs.org_id && (toolName === 'get_organization_details' || toolName.includes('organization'))) {
    query = `organization_${toolArgs.org_id}`;
  } else if (toolArgs.contract_address && toolName.includes('project')) {
    query = toolArgs.contract_address;
  } else {
    query = `${toolName} request`;
  }
}

// 确保query是字符串
query = String(query);
```

**修复2: ToolRouter防御性编程**
```javascript
// 在routeQuery方法开始处添加类型保护
if (typeof query !== 'string') {
  query = String(query);
  console.error(`[${requestId}] Query converted to string: "${query}"`);
}
```

#### 测试验证结果
**测试输入**:
```javascript
{
  project_id: 11646,
  include_team: true,
  include_investors: true
}
```

**修复后输出**:
- ✅ query类型: `string`
- ✅ query值: `"project_11646"`
- ✅ 无TypeError异常
- ✅ ToolRouter正常处理

#### 核心经验教训
1. **参数类型多样性**: MCP工具调用的参数类型不固定，需要适配不同场景
   - 搜索工具: 字符串查询
   - 详情工具: 数字ID
   - 地址工具: 字符串地址

2. **防御性编程必要性**: 关键方法入口必须进行类型检查和转换
   ```javascript
   // 好的实践 - 类型保护
   if (typeof query !== 'string') {
     query = String(query);
   }
   ```

3. **错误信息的分析技巧**: 
   - `query.toLowerCase is not a function` → query不是字符串
   - 追踪调用链找到参数传递的源头
   - 区分类型错误和逻辑错误

4. **工具特化处理**: 不同工具有不同的参数模式，需要个性化处理
   - 搜索类: 优先使用query字符串
   - ID类: 构建描述性查询字符串
   - 地址类: 直接使用地址作为查询

#### 预防措施
- **类型检查标准化**: 所有接收external参数的方法都要进行类型检查
- **测试用例多样化**: 测试不同类型的参数输入（字符串、数字、布尔值）
- **参数文档化**: 明确记录每个工具期望的参数类型和格式
- **错误处理增强**: 提供更详细的类型错误信息

#### 代码审查要点
- [ ] 检查所有字符串方法调用前是否有类型验证
- [ ] 确认参数类型转换的完整性
- [ ] 验证不同工具的参数处理逻辑
- [ ] 测试边界情况（null、undefined、非预期类型）

### 2. RootData API 调用格式错误 (2024-12-26)

#### 问题描述
初始API测试失败，收到302重定向响应和HTML错误页面。

#### 错误原因
- **错误的基础URL**: 使用了 `https://api.rootdata.com` 而不是 `https://api.rootdata.com/open`
- **错误的Header**: 使用了 `X-API-KEY` 而不是 `apikey`
- **错误的端点**: 使用了 `/user/apikey/balance` 而不是 `/quotacredits`

#### 正确格式
```javascript
// 正确的API配置
const baseUrl = 'https://api.rootdata.com/open';
const headers = {
  'Content-Type': 'application/json',
  'apikey': 'your-api-key',
  'language': 'en'
};

// 正确的端点
const endpoints = {
  credits: '/quotacredits',
  search: '/ser_inv'
};
```

#### 解决方案
1. 查阅官方API文档确认正确的URL和Header格式
2. 使用正确的端点路径
3. 修正响应格式判断：使用 `result === 200` 而不是 `code === 0`

#### 经验教训
- 在集成第三方API前，必须仔细阅读官方文档
- API测试应该从最基础的认证开始
- 收到302响应通常意味着URL不正确

### 2. API响应格式理解错误 (2024-12-26)

#### 问题描述
API调用成功但测试脚本判断为失败，因为响应格式判断错误。

#### 错误原因
RootData API的成功响应格式是：
```json
{
  "result": 200,
  "data": { ... }
}
```
而不是常见的：
```json
{
  "code": 0,
  "data": { ... }
}
```

#### 解决方案
- 更新所有API响应判断逻辑
- 使用 `response.data.result === 200` 判断成功
- 测试不同API端点确认响应格式一致性

#### 经验教训
- 不同API提供商有不同的响应格式标准
- 应该先进行小规模测试确认响应格式
- 响应格式应该在代码中统一处理

## 开发最佳实践

### API集成流程
1. **阅读文档** - 仔细阅读官方API文档
2. **小规模测试** - 从最基础的认证API开始测试
3. **确认格式** - 验证请求和响应格式
4. **逐步扩展** - 逐一测试各个端点
5. **错误处理** - 实现完整的错误处理逻辑

### 错误调试步骤
1. 检查网络连接
2. 验证API Key和认证方式
3. 确认URL和端点路径
4. 检查请求头和参数格式
5. 分析响应内容和状态码
6. 对比官方文档和实际响应

### 代码质量要求
- 所有API调用必须有错误处理
- 响应格式判断要准确
- 日志信息要详细便于调试
- 测试用例要覆盖成功和失败场景

### 3. 字段验证逻辑错误 (2024-12-26)

#### 问题描述
工具注册时出现"工具定义缺少必需字段: creditsPerCall"错误，但工具定义中明确包含了该字段。

#### 错误原因
基类中的字段验证使用了 `!toolDefinition[field]` 来检查字段是否存在，但当`creditsPerCall`为`0`时，会被认为是falsy值，导致验证失败。

#### 错误代码
```javascript
// 错误的验证逻辑
if (!toolDefinition[field]) {
  throw new Error(`工具定义缺少必需字段: ${field}`);
}
```

#### 解决方案
```javascript
// 正确的验证逻辑
if (toolDefinition[field] === undefined || toolDefinition[field] === null) {
  throw new Error(`工具定义缺少必需字段: ${field}`);
}
```

#### 经验教训
- 数值类型字段（包括0）的验证不能使用简单的truthy/falsy检查
- 应该明确检查 `undefined` 和 `null` 而不是依赖类型转换
- 对于数值字段，0是合法值，应该区别对待

### 4. URL构建问题 (2024-12-26)

#### 问题描述
使用`new URL(endpoint, baseUrl)`构建请求URL时出现路径拼接错误。

#### 错误原因
URL构造函数的路径拼接逻辑与预期不符，导致最终请求路径不正确。

#### 解决方案
改用手动路径拼接：
```javascript
// 解析baseUrl
const baseUrl = new URL(this.baseUrl);
const fullPath = endpoint.startsWith('/') ? endpoint : '/' + endpoint;

const options = {
  hostname: baseUrl.hostname,
  path: baseUrl.pathname + fullPath,
  // ...
};
```

#### 经验教训
- 对于复杂的URL构建，手动拼接可能更可控
- 在API客户端开发中要仔细验证最终的请求URL
- 使用调试工具查看实际发送的HTTP请求

## 测试结果记录

### RootData API 基础测试 (2024-12-26)
- **API Key**: 5fUrD5bVFrVmQsgi3Ti0vrOWa7rqONHy
- **用户等级**: Basic
- **剩余Credits**: 2000
- **测试结果**: 
  - Credits查询: ✅ 成功
  - 项目搜索(英文): ✅ 成功 (20个结果)
  - 项目搜索(中文): ✅ 成功 (20个结果)
- **语言检测**: ✅ 正常工作

### RootData Provider模块测试 (2024-12-26)
- **供应商初始化**: ✅ 成功
- **工具注册**: ✅ 成功 (6个工具)
- **API调用功能**: ✅ 基本功能正常
- **Credits监控**: ✅ 实时更新
- **错误处理**: ✅ 统一错误格式

### 验证的功能点
1. ✅ API Key认证机制
2. ✅ Credits余额查询和监控
3. ✅ 用户等级获取和权限控制
4. ✅ 项目搜索功能
5. ✅ 中英文语言支持
6. ✅ 语言自动检测
7. ✅ 供应商抽象层架构
8. ✅ 工具动态注册机制
9. ✅ API客户端统一接口
10. ✅ 错误处理和重试机制

### 已实现的核心组件
- ✅ `DataProvider` 基类
- ✅ `ApiClient` 基类
- ✅ `RootDataProvider` 实现
- ✅ `RootDataClient` API客户端
- ✅ 端点定义和工具注册系统
- ✅ 语言检测工具

这些测试确认了RootData供应商模块的完整性和可用性，为下一步的智能路由系统开发奠定了基础。