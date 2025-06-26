# Web3 Data MCP 服务器

一个全面的模型上下文协议（MCP）服务器，用于 Web3 数据分析，通过标准化 API 提供区块链生态系统信息访问。

## 🌟 特性

- **🔗 多数据源支持**: 支持 RootData API，计划支持更多提供商
- **📊 全面覆盖**: 19+ 个真实 API 端点，覆盖基础版、Plus 版、专业版三个等级
- **🌍 多语言支持**: 英文和中文语言界面
- **🛡️ 健壮的错误处理**: 内置重试机制和优雅的错误恢复
- **📈 使用监控**: 实时积分跟踪和 API 速率限制
- **🧠 智能查询路由**: 基于查询意图的智能端点选择

## 📋 目录

- [安装](#安装)
- [配置](#配置)
- [API 覆盖范围](#api-覆盖范围)
- [使用示例](#使用示例)
- [开发](#开发)
- [测试](#测试)
- [贡献](#贡献)

## 🚀 安装

### 前置要求

- Node.js 16+ 
- npm 或 yarn
- 有效的 RootData API 密钥

### 快速开始

```bash
# 克隆仓库
git clone https://github.com/your-username/web3-data-mcp.git
cd web3-data-mcp

# 安装依赖
npm install

# 复制配置模板
cp config/config.example.json config/config.json

# 配置你的 API 密钥（参见配置部分）
# 编辑 config/config.json 添加你的凭据

# 启动服务器
npm run dev
```

## ⚙️ 配置

创建包含 API 凭据的 `config/config.json` 文件：

```json
{
  "server": {
    "name": "web3-data-mcp",
    "version": "1.0.0",
    "timeout": 30000,
    "retries": 3
  },
  "providers": {
    "rootdata": {
      "apiKey": "your-rootdata-api-key-here",
      "baseUrl": "https://api.rootdata.com/open",
      "timeout": 30000,
      "retries": 3
    }
  },
  "monitoring": {
    "creditsWarningThreshold": 100,
    "creditsCriticalThreshold": 20,
    "autoRefreshInterval": 300000,
    "errorFrequencyThreshold": 10
  },
  "logging": {
    "level": "info",
    "enableStats": true,
    "enableErrorTracking": true
  }
}
```

### 环境变量

或者，你也可以使用环境变量：

```bash
export ROOTDATA_API_KEY="your-api-key"
export MCP_SERVER_PORT="3000"
export NODE_ENV="production"
```

## 📊 API 覆盖范围

### RootData 提供商

我们的实现严格遵循官方 RootData API 文档，包含 **19 个真实端点**：

#### 🟢 基础版 (4 个端点)
| 端点 | 描述 | 积分 | 方法 |
|----------|-------------|---------|--------|
| `/ser_inv` | 搜索项目/组织/人员 | 0 | `searchWeb3Entities()` |
| `/quotacredits` | 检查 API 密钥余额 | 0 | `checkCredits()` |
| `/get_item` | 获取项目详情 | 2 | `getProjectDetails()` |
| `/get_org` | 获取组织详情 | 2 | `getOrganizationDetails()` |

#### 🟡 Plus 版 (4 个端点)
| 端点 | 描述 | 积分 | 方法 |
|----------|-------------|---------|--------|
| `/id_map` | 获取 ID 映射列表 | 20 | `getIdMapping()` |
| `/get_invest` | 获取投资人信息 | 2/项 | `getInvestorDetails()` |
| `/twitter_map` | 导出 X (Twitter) 数据 | 50 | `getTwitterData()` |
| `/get_fac` | 获取融资轮次 | 2/项 | `getFundingInformation()` |

#### 🔴 专业版 (11 个端点)
| 端点 | 描述 | 积分 | 方法 |
|----------|-------------|---------|--------|
| `/get_people` | 获取人员详情 | 2 | `getPeopleDetails()` |
| `/ser_change` | 同步更新 | 1/项 | `getSyncUpdates()` |
| `/hot_index` | 热门项目 Top 100 | 10 | `getHotProjects()` |
| `/hot_project_on_x` | X 热门项目 | 10 | `getHotProjectsOnX()` |
| `/leading_figures_on_crypto_x` | X 热门人物 | 10 | `getHotPeopleOnX()` |
| `/job_changes` | 职位变动 | 10 | `getJobChanges()` |
| `/new_tokens` | 最新代币发布 | 10 | `getNewTokens()` |
| `/ecosystem_map` | 生态系统映射 | 50 | `getEcosystemMap()` |
| `/tag_map` | 标签映射 | 50 | `getTagMap()` |
| `/projects_by_ecosystems` | 按生态系统查询项目 | 20 | `getProjectsByEcosystems()` |
| `/projects_by_tags` | 按标签查询项目 | 20 | `getProjectsByTags()` |

## 💡 使用示例

### 基础搜索操作

```javascript
// 搜索 Web3 实体
const results = await provider.searchWeb3Entities("以太坊");
console.log(`找到 ${results.data.length} 个结果`);

// 通过 ID 获取项目详情
const project = await provider.getProjectDetails("12");
console.log(`项目: ${project.data.project_name}`);

// 通过合约地址获取项目
const contractProject = await provider.getProjectByContract("0x...", {
  includeTeam: true,
  includeInvestors: true
});
```

### 组织和人员数据

```javascript
// 获取组织详情
const org = await provider.getOrganizationDetails(219, {
  includeTeam: true,
  includeInvestments: true
});

// 获取人员信息（需要专业版）
const person = await provider.getPeopleDetails(12972);
console.log(`人员: ${person.data.people_name}`);
```

### 高级分析 (Plus/专业版)

```javascript
// 获取带过滤条件的融资信息
const funding = await provider.getFundingInformation({
  page: 1,
  page_size: 20,
  start_time: "2023-01",
  end_time: "2023-12",
  min_amount: 1000000
});

// 获取热门项目（专业版）
const hotProjects = await provider.getHotProjects(7); // 最近 7 天

// 获取生态系统项目
const ecosystemProjects = await provider.getProjectsByEcosystems("52,54");

// 获取社交媒体数据
const twitterData = await provider.getTwitterData(1); // 类型 1 = 项目
```

### 积分管理

```javascript
// 检查剩余积分
const credits = await provider.checkCredits();
console.log(`等级: ${credits.data.level}, 积分: ${credits.data.credits}`);

// 获取详细的提供商状态
const status = provider.getDetailedStatus();
console.log(`可用工具: ${status.availableToolsCount}/${status.totalToolsCount}`);
```

### 智能查询接口

```javascript
// 自然语言查询
const result1 = await provider.smartQuery("以太坊 DeFi 项目");
const result2 = await provider.smartQuery("最近的融资轮次");
const result3 = await provider.smartQuery("生态系统项目"); // 中文支持
```

## 🔧 开发

### 项目结构

```
web3-data-mcp/
├── src/
│   ├── index.js                 # 主服务器入口
│   ├── core/                    # MCP 服务器实现
│   │   ├── base/               # 基础类
│   │   └── rootdata/           # RootData 提供商
│   │       ├── RootDataClient.js    # API 客户端
│   │       ├── RootDataProvider.js  # MCP 提供商
│   │       └── endpoints/           # API 端点定义
│   └── utils/                  # 工具函数
├── config/                     # 配置文件
├── tests/                      # 测试套件
└── docs/                       # 文档
```

### API 客户端架构

```javascript
// 基础 API 客户端
class ApiClient {
  async request(endpoint, method, data, headers) {
    // 处理 HTTP 请求、重试和错误处理
  }
}

// RootData 特定客户端
class RootDataClient extends ApiClient {
  async searchEntities(query, language, preciseXSearch) {
    // RootData 特定的 API 实现
  }
}

// MCP 提供商包装器
class RootDataProvider extends DataProvider {
  async executeApiCall(endpointId, params) {
    // MCP 协议实现
  }
}
```

### 添加新端点

1. **在 `endpoints/index.js` 中定义端点**:
```javascript
{
  id: 'new_endpoint',
  name: 'new_api_method',
  description: '新端点的描述',
  endpoint: '/new_endpoint',
  method: 'POST',
  requiredLevel: 'basic',
  creditsPerCall: 5,
  category: 'category_name',
  inputSchema: { /* JSON schema */ },
  outputDescription: '响应描述'
}
```

2. **在 RootDataClient.js 中实现**:
```javascript
async newApiMethod(param1, param2, language = 'zh') {
  try {
    const response = await this.request('/new_endpoint', 'POST', {
      param1,
      param2
    }, { language });
    
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    // 错误处理
  }
}
```

3. **添加到 RootDataProvider.js**:
```javascript
case 'new_endpoint':
  result = await this.client.newApiMethod(params.param1, params.param2, language);
  break;
```

## 🧪 测试

### 单元测试

```bash
# 运行所有测试
npm test

# 运行特定测试套件
npm test -- --grep "RootData"

# 运行覆盖率测试
npm run test:coverage
```

### 集成测试

```bash
# 设置测试 API 密钥
export ROOTDATA_API_KEY="your-test-api-key"

# 运行集成测试
npm run test:integration
```

### 测试覆盖率

我们的全面测试套件覆盖：

- ✅ 所有 19 个 API 端点
- ✅ 错误处理场景
- ✅ 不同的 API 访问级别
- ✅ 参数验证
- ✅ 响应格式化
- ✅ 积分管理
- ✅ 语言检测

### 手动测试

```bash
# 在调试模式下启动服务器
npm run dev

# 测试基础搜索
curl -X POST http://localhost:3000/search \
  -H "Content-Type: application/json" \
  -d '{"query": "以太坊"}'

# 使用 MCP 客户端测试
npx @modelcontextprotocol/cli@latest \
  --transport stdio \
  -- node src/index.js
```

## 🛠️ API 参考

### 核心方法

#### `searchWeb3Entities(query, options)`
在 Web3 生态系统中搜索项目、组织和人员。

**参数:**
- `query` (string): 搜索关键词
- `options` (object): 
  - `language` (string): 'en' 或 'zh'
  - `preciseXSearch` (boolean): 启用精确 X 句柄搜索

**返回:** 匹配实体的数组，包含类型、名称和元数据。

#### `getProjectDetails(projectId, options)`
获取全面的项目信息。

**参数:**
- `projectId` (string|number): 项目 ID
- `options` (object):
  - `includeTeam` (boolean): 包含团队成员信息
  - `includeInvestors` (boolean): 包含投资者信息
  - `language` (string): 响应语言

**返回:** 详细的项目信息，包括描述、融资、团队等。

#### `getFundingInformation(filters)`
获取带过滤选项的融资轮次数据。

**参数:**
- `filters` (object):
  - `page` (number): 页码
  - `page_size` (number): 每页项目数（最大 200）
  - `start_time` (string): 开始日期 (YYYY-MM)
  - `end_time` (string): 结束日期 (YYYY-MM)
  - `min_amount` (number): 最小融资金额
  - `max_amount` (number): 最大融资金额

**返回:** 分页的融资轮次，包含金额、估值、投资者等。

### 错误处理

所有方法返回标准化响应格式：

```javascript
{
  success: boolean,
  data: any,           // 成功时的响应数据
  error: string,       // 失败时的错误消息
  credits: {           // 积分信息
    remaining: number,
    used: number
  }
}
```

### 常见错误代码

- `401`: 无效的 API 密钥
- `403`: 权限不足（需要升级 API 级别）
- `429`: 请求频率超限
- `404`: 资源未找到
- `500`: 内部服务器错误

## 🤝 贡献

我们欢迎贡献！请查看我们的[贡献指南](CONTRIBUTING.md)了解详情。

### 开发工作流程

1. Fork 仓库
2. 创建功能分支: `git checkout -b feature/amazing-feature`
3. 进行更改
4. 为新功能添加测试
5. 运行测试套件: `npm test`
6. 提交更改: `git commit -m 'Add amazing feature'`
7. 推送到分支: `git push origin feature/amazing-feature`
8. 创建 Pull Request

### 代码风格

我们使用 ESLint 和 Prettier 进行代码格式化：

```bash
# 检查代码风格
npm run lint

# 自动修复风格问题
npm run lint:fix

# 格式化代码
npm run format
```

## 📄 许可证

本项目基于 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🔗 链接

- [RootData 官方 API 文档](https://cn.rootdata.com/Api/Doc)
- [模型上下文协议规范](https://github.com/modelcontextprotocol/specification)
- [问题跟踪器](https://github.com/your-username/web3-data-mcp/issues)
- [更新日志](CHANGELOG.md)

## 🙋‍♂️ 支持

- 📧 邮箱: support@example.com
- 💬 Discord: [加入我们的社区](https://discord.gg/your-server)
- 📖 文档: [完整 API 文档](https://docs.example.com)
- 🐛 错误报告: [GitHub Issues](https://github.com/your-username/web3-data-mcp/issues)

---

**为 Web3 社区倾心打造 ❤️** 