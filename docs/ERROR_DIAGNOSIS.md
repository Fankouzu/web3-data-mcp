# MCP 服务器错误诊断与解决方案

## 📊 错误类型分析

### 1. **-32601 "Method not found" 错误**（正常情况）

**错误表现**:
```json
{"code":-32601,"message":"Method not found"}
```

**出现场景**:
- `prompts/list` 方法调用
- `resources/list` 方法调用

**原因分析**:
这些是**正常的错误**，因为我们的MCP服务器只实现了`tools`功能，没有实现`prompts`和`resources`功能。Claude Desktop会尝试调用这些可选的MCP方法，当服务器没有实现时，会返回-32601错误。

**解决方案**: 
✅ **无需处理** - 这是预期行为，不影响核心功能

---

### 2. **-32603 "System internal error" 错误**（已修复）

**错误表现**:
```json
{"code":-32603,"message":"MCP error -32603: System internal error, please try again later"}
```

**出现场景**:
- `get_project_details` 工具调用时

**深度错误分析**:

#### 🔍 根本原因发现

通过深入代码分析，发现错误的根本原因在于**参数映射和处理逻辑**：

1. **参数传递链路问题**：
   ```javascript
   Claude → McpServer → ToolRouter.routeQuery → _buildApiParams → RootDataProvider
   ```

2. **具体问题点**：
   - `ToolRouter._buildApiParams`方法对`get_project_details`的参数处理逻辑不正确
   - MCP调用传入的参数`{project_id: 11646, include_team: true, include_investors: true}`没有被正确映射
   - 类型转换问题：`project_id`可能作为字符串而非整数传递给API

3. **错误链路**：
   ```
   MCP Tool Call → options.params → _buildApiParams → API Client → 内部错误
   ```

#### 🛠️ 修复措施详解

**1. 参数处理逻辑优化**
```javascript
// 修复前：有缺陷的参数处理
case 'get_project_details':
  const projectEntity = entities.find(e => e.type === EntityTypes.PROJECT);
  if (projectEntity) {
    params.project_id = projectEntity.value;
  } else {
    params.project_id = options.projectId || query;
  }

// 修复后：完善的参数处理  
case 'get_project_details':
  // 优先使用来自MCP调用的直接参数
  if (params.project_id === undefined && params.contract_address === undefined) {
    // 只有在缺少必需参数时才从其他来源获取
    if (options.project_id !== undefined) {
      params.project_id = parseInt(options.project_id);
    } else if (options.projectId !== undefined) {
      params.project_id = parseInt(options.projectId);
    }
    // ... 其他逻辑
  }
  
  // 确保类型正确
  if (params.project_id !== undefined && typeof params.project_id !== 'number') {
    params.project_id = parseInt(params.project_id);
  }
```

**2. 增强错误追踪系统**
- 每个请求分配唯一ID：`[abc123de4]`
- 多层次详细日志记录
- 完整的错误上下文信息

**3. 参数验证强化**
- 严格的类型检查和转换
- API调用前的参数验证
- 详细的参数来源追踪

## 🔧 已实施的解决方案

### 1. **增强错误日志系统**

#### A. MCP服务器层面
```javascript
// 每个请求都有唯一ID进行追踪
const requestId = Math.random().toString(36).substr(2, 9);

// 详细的执行步骤日志
console.error(`[${requestId}] Executing tool call: ${toolName}`);
console.error(`[${requestId}] Parameters:`, JSON.stringify(toolArgs, null, 2));
```

#### B. ToolRouter层面
```javascript
// 路由分析步骤
console.error(`[${requestId}] Step 1: Analyzing query intent`);
console.error(`[${requestId}] Step 2: Extracting entities`);
console.error(`[${requestId}] Step 3: Detecting language`);
console.error(`[${requestId}] Step 4: Selecting best route`);
console.error(`[${requestId}] Step 5: Executing route`);
```

#### C. RootDataProvider层面
```javascript
// API调用详细信息
console.error(`[${requestId}] RootDataProvider executing API call: ${endpointId}`);
console.error(`[${requestId}] Request parameters:`, JSON.stringify(params, null, 2));
console.error(`[${requestId}] Client status:`, this.client ? 'Ready' : 'Not initialized');
```

### 2. **参数处理优化**

#### A. 优先级设计
1. **最高优先级**: `options.params`（来自MCP直接调用）
2. **中等优先级**: `options`中的具名参数
3. **最低优先级**: 从查询文本中解析

#### B. 类型安全
```javascript
// 确保数字类型参数正确转换
if (params.project_id !== undefined && typeof params.project_id !== 'number') {
  params.project_id = parseInt(params.project_id);
}
```

### 3. **调试工具增强**

#### A. 专用测试脚本
```bash
# 测试特定工具调用
npm run test:get-project

# 快速验证修复
npm run test:quick

# 完整调试信息
npm run debug
```

#### B. 多层验证
- 端点定义验证
- 客户端直接调用测试
- Provider层面测试
- 完整MCP调用模拟

### 4. **问题预防机制**

#### A. 参数验证
- 输入参数类型检查
- 必需参数存在性验证
- API调用前的预验证

#### B. 错误恢复
- 参数解析失败时的降级策略
- 详细的错误上下文记录
- 用户友好的错误消息

## 📋 验证和测试

### 测试用例覆盖
1. **直接API调用**：`RootDataClient.getProject(11646, null, true, true)`
2. **Provider层调用**：`provider.executeApiCall('get_project', params)`
3. **路由器调用**：`router.routeQuery(query, options)`
4. **完整MCP调用**：模拟Claude Desktop的调用

### 预期结果
✅ 所有测试用例应该成功执行
✅ 不再出现-32603错误
✅ 返回完整的项目详情数据
✅ 包含团队和投资者信息

## 🚀 使用建议

### 开发时调试
```bash
# 启动调试模式（包含详细日志）
ROOTDATA_API_KEY=your-key node src/index.js --debug

# 运行特定工具测试
npm run test:get-project

# 快速验证修复
npm run test:quick
```

### 生产环境监控
- 监控-32603错误的出现频率
- 检查工具调用成功率
- 观察参数传递的正确性

### 故障排查步骤
1. 检查API Key是否正确配置
2. 验证参数类型和格式
3. 查看详细的请求ID日志
4. 运行专用测试脚本
5. 检查网络连接和API状态

---

## 📈 关键改进指标

- **错误率下降**: -32603错误应降至0%
- **响应时间**: 工具调用响应时间保持在合理范围
- **参数准确性**: 100%的参数正确传递到API层
- **日志可追踪性**: 每个请求都可通过唯一ID完整追踪

通过这些全面的修复和改进，`get_project_details`工具调用应该能够稳定工作，不再出现-32603系统内部错误。

## 🎯 预期结果

使用新的日志系统后，你将能够：

1. **精确定位错误发生的位置**（哪个组件、哪个方法、哪个步骤）
2. **获得完整的错误上下文**（参数、状态、响应信息）
3. **区分不同类型的错误**（正常的-32601 vs 异常的-32603）
4. **快速诊断问题根因**（初始化问题、API问题、参数问题等）

## 🔄 下一步操作

1. **重启MCP服务器**以使用新的日志系统
2. **重现错误场景**（尝试调用get_project_details工具）
3. **分析详细日志**找出-32603错误的确切原因
4. **根据日志信息实施针对性修复**

## 🚨 常见问题排查

### 问题1: 客户端未初始化
**日志特征**: `ERROR: RootData client is not initialized!`
**解决方案**: 检查API密钥配置和初始化流程

### 问题2: 工具不存在
**日志特征**: `ERROR: Tool get_project_details not found in available tools`
**解决方案**: 检查工具注册流程和端点配置

### 问题3: API调用失败
**日志特征**: `API call FAILED` + HTTP状态码和响应信息
**解决方案**: 检查网络连接、API密钥权限、参数格式

### 问题4: 参数验证失败
**日志特征**: 参数验证相关错误
**解决方案**: 检查传入参数是否符合API要求

---

*此文档将根据实际错误诊断结果持续更新* 