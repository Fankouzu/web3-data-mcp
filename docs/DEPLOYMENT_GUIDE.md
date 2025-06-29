# 部署指南：系统提示词增强功能

## 📋 前置要求

### 系统要求
- Node.js >= 14.0.0
- npm >= 6.0.0
- 内存 >= 512MB
- 磁盘空间 >= 100MB

### 依赖项
- @modelcontextprotocol/sdk >= 0.2.0
- yaml >= 2.0.0
- 其他项目依赖（见 package.json）

## 🚀 快速部署

### 1. 克隆项目

```bash
git clone https://github.com/your-org/web3-data-mcp.git
cd web3-data-mcp
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

创建 `.env` 文件：

```env
# API 配置
ROOTDATA_API_KEY=your_api_key_here
ROOTDATA_BASE_URL=https://api.rootdata.com

# 提示词配置
PROMPTS_ENABLED=true
PROMPTS_DEFAULT_LANGUAGE=en
PROMPTS_CACHE_TTL=3600000
PROMPTS_HOT_RELOAD=false

# 性能配置
CACHE_ENABLED=true
DEBUG_PROMPTS=false
```

### 4. 验证配置

```bash
# 运行配置检查
npm run check-config

# 运行基础测试
npm test
```

### 5. 启动服务

```bash
# 生产环境
npm start

# 开发环境（带热更新）
npm run dev
```

## 📁 文件结构部署

确保以下文件结构正确部署：

```
project-root/
├── src/
│   ├── core/
│   │   ├── McpServer.js
│   │   ├── PromptManager.js
│   │   ├── ToolRouter.js
│   │   └── ErrorHandler.js
│   └── prompts/
│       ├── VERSION
│       └── config/
│           ├── tools.yaml
│           ├── routing.yaml
│           ├── responses.yaml
│           ├── errors.yaml
│           └── performance.yaml
├── .env
├── package.json
└── src/
    └── index.js
```

## 🔧 配置详解

### PromptManager 配置

在 `McpServer` 初始化时配置：

```javascript
const server = new McpServer({
  name: 'web3-data-mcp',
  version: '1.0.0',
  prompts: {
    enabled: true,               // 启用提示词功能
    defaultLanguage: 'en',       // 默认语言
    cacheEnabled: true,          // 启用缓存
    cacheTTL: 3600000,          // 缓存过期时间（1小时）
    hotReload: false,           // 生产环境关闭热更新
    maxCacheSize: 1000          // 最大缓存条目
  }
});
```

### 性能优化配置

编辑 `src/prompts/config/performance.yaml`：

```yaml
cache:
  enabled: true
  ttl: 3600
  maxSize: 1000
  
  strategies:
    prompts:
      ttl: 7200      # 提示词缓存2小时
      priority: high
    
    routing:
      ttl: 1800      # 路由缓存30分钟
      priority: medium

optimization:
  query:
    enableCache: true
    enablePreprocessing: true
    maxQueryLength: 500
    
  concurrency:
    maxConcurrentRequests: 10
    requestTimeout: 30000
```

## 🔒 安全考虑

### 1. API 密钥保护

- 使用环境变量存储 API 密钥
- 不要将 `.env` 文件提交到版本控制
- 使用密钥管理服务（如 AWS Secrets Manager）

### 2. 访问控制

```javascript
// 限制可访问的工具
const allowedTools = ['search_web3_entities', 'get_project_details'];

server.setToolFilter((tool) => {
  return allowedTools.includes(tool.name);
});
```

### 3. 输入验证

提示词系统会自动验证输入，但建议额外添加：

```javascript
// 自定义验证规则
server.setQueryValidator((query) => {
  if (query.length > 1000) {
    throw new Error('Query too long');
  }
  return true;
});
```

## 📊 监控和日志

### 1. 启用监控

```javascript
// 配置监控
const monitoring = {
  enabled: true,
  metrics: ['responseTime', 'cacheHitRate', 'errorRate'],
  reportInterval: 60000 // 每分钟报告
};

server.enableMonitoring(monitoring);
```

### 2. 日志配置

```javascript
// 配置日志级别
process.env.LOG_LEVEL = 'info'; // error, warn, info, debug

// 自定义日志输出
server.setLogger({
  error: (msg) => console.error(`[ERROR] ${msg}`),
  warn: (msg) => console.warn(`[WARN] ${msg}`),
  info: (msg) => console.log(`[INFO] ${msg}`),
  debug: (msg) => process.env.DEBUG && console.log(`[DEBUG] ${msg}`)
});
```

### 3. 性能监控

```bash
# 运行性能测试
npm run performance-test

# 查看性能报告
cat logs/optimization-report-*.json
```

## 🔄 更新和维护

### 1. 更新提示词

```bash
# 编辑提示词文件
vi src/prompts/config/tools.yaml

# 验证 YAML 语法
npm run validate-prompts

# 重启服务（或等待热更新）
npm restart
```

### 2. 版本管理

更新 `src/prompts/VERSION` 文件：

```
1.0.1
- Added new prompts for token queries
- Improved error suggestions
- Fixed Chinese translation issues
```

### 3. 回滚程序

```bash
# 备份当前配置
cp -r src/prompts src/prompts.backup

# 如需回滚
cp -r src/prompts.backup src/prompts
npm restart
```

## 🐛 故障排除

### 常见问题

#### 1. 提示词加载失败

```bash
# 检查文件权限
ls -la src/prompts/config/

# 验证 YAML 语法
npm run validate-prompts

# 查看详细错误
DEBUG_PROMPTS=true npm start
```

#### 2. 缓存问题

```bash
# 清除缓存
rm -rf .cache/

# 禁用缓存测试
PROMPTS_CACHE_ENABLED=false npm start
```

#### 3. 性能问题

```bash
# 运行诊断
npm run diagnose

# 查看性能指标
npm run performance-report
```

### 调试命令

```bash
# 测试特定功能
npm run test:prompts
npm run test:routing
npm run test:responses

# 压力测试
npm run stress-test

# 生成完整报告
npm run generate-report
```

## 📈 性能优化建议

### 1. 启动优化

```javascript
// 预热常用查询
const warmupQueries = [
  'search ethereum projects',
  'get project details',
  'check credits'
];

server.on('initialized', async () => {
  for (const query of warmupQueries) {
    await server.toolRouter.routeQuery(query, { dryRun: true });
  }
});
```

### 2. 内存优化

```javascript
// 定期清理缓存
setInterval(() => {
  server.promptManager.cleanExpiredCache();
}, 3600000); // 每小时清理

// 限制并发请求
server.setConcurrencyLimit(10);
```

### 3. 响应时间优化

- 启用所有缓存层
- 使用 CDN 分发静态提示词
- 实施请求批处理
- 优化提示词长度

## 🌐 集成到现有系统

### Claude Desktop 配置

在 Claude Desktop 配置文件中添加：

```json
{
  "mcpServers": {
    "web3-data": {
      "command": "node",
      "args": ["/path/to/web3-data-mcp/src/index.js"],
      "env": {
        "ROOTDATA_API_KEY": "your_key",
        "PROMPTS_ENABLED": "true"
      }
    }
  }
}
```

### Docker 部署

```dockerfile
FROM node:14-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

ENV NODE_ENV=production
ENV PROMPTS_ENABLED=true

EXPOSE 3000

CMD ["node", "src/index.js"]
```

### Kubernetes 配置

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web3-data-mcp
spec:
  replicas: 2
  selector:
    matchLabels:
      app: web3-data-mcp
  template:
    metadata:
      labels:
        app: web3-data-mcp
    spec:
      containers:
      - name: web3-data-mcp
        image: your-registry/web3-data-mcp:latest
        env:
        - name: PROMPTS_ENABLED
          value: "true"
        - name: ROOTDATA_API_KEY
          valueFrom:
            secretKeyRef:
              name: api-secrets
              key: rootdata-key
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

## 📞 支持

如遇到问题，请：

1. 查看[故障排除](#故障排除)部分
2. 检查[API 文档](./API_PROMPT_ENHANCEMENT.md)
3. 查看[测试报告](./PHASE5_TEST_REPORT.md)
4. 提交 Issue 到项目仓库

## 🎉 部署完成检查清单

- [ ] 环境变量配置完成
- [ ] 依赖安装成功
- [ ] 配置文件验证通过
- [ ] 基础测试通过
- [ ] 性能测试满足要求
- [ ] 监控和日志配置完成
- [ ] 安全措施已实施
- [ ] 备份和回滚方案准备就绪

恭喜！系统提示词增强功能已成功部署。 