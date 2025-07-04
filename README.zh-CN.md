# Web3 Data MCP Server v2.0.0

<div align="center">

[![版本](https://img.shields.io/badge/版本-2.0.0-blue)](https://github.com/your-username/web3-data-mcp/releases)
[![许可证](https://img.shields.io/badge/许可证-MIT-green)](./LICENSE)
[![测试](https://img.shields.io/badge/测试-100%25%20通过-brightgreen)](./tests)
[![性能](https://img.shields.io/badge/路由-<10ms-orange)](./docs/PHASE5_TEST_REPORT.md)

一个全面的模型上下文协议（MCP）服务器，通过AI增强的API提供对区块链生态系统信息的智能访问。

</div>

## 🚀 v2.0.0 新功能

### 🧠 系统提示词增强
- **66个AI优化提示词**，覆盖工具、路由、响应和错误处理
- **意图理解准确率提升20%**
- **智能实体识别**，支持7种类型（项目、代币、地址等）
- **智能错误提示**，提供有用的建议

### ⚡ 性能提升
- **路由决策 < 10ms**（优秀性能）
- **多层缓存**，实现最佳响应时间
- **100%测试覆盖**，确保可靠性

### 🌍 增强的多语言支持
- 无缝的中英文支持
- 上下文感知的语言检测
- 本地化的错误消息和建议

## 🌟 功能特性

- **🔗 多数据源支持**：支持RootData API，计划支持更多提供商
- **📊 全面覆盖**：19+真实API端点，涵盖基础、Plus和Pro级别
- **🧠 AI增强路由**：智能查询理解和工具选择
- **💬 自然语言查询**：支持对话式查询
- **🛡️ 智能错误处理**：上下文感知的错误消息和恢复建议
- **📈 使用监控**：实时积分跟踪和API速率限制
- **⚡ 高性能**：亚10毫秒路由，智能缓存

## 📋 目录

- [快速开始](#快速开始)
- [安装](#安装)
- [配置](#配置)
- [增强功能](#增强功能)
- [API覆盖](#api覆盖)
- [使用示例](#使用示例)
- [开发](#开发)
- [测试](#测试)
- [AI 提示词最佳实践](#ai-提示词最佳实践)
- [贡献](#贡献)

## ⚡ 快速开始

5分钟内启动并运行：

```bash
# 克隆并安装
git clone https://github.com/your-username/web3-data-mcp.git
cd web3-data-mcp
npm install

# 配置
echo "ROOTDATA_API_KEY=your_api_key_here" > .env

# 测试
npm test

# 运行
npm start
```

Claude Desktop集成请参见下面的配置章节。

## 🚀 安装

### 先决条件

- Node.js 16+（推荐18+）
- npm或yarn
- 有效的RootData API密钥
- Claude Desktop（用于MCP集成）

### 详细设置

```bash
# 克隆仓库
git clone https://github.com/your-username/web3-data-mcp.git
cd web3-data-mcp

# 安装依赖
npm install

# 设置环境
cp .env.example .env
# 编辑 .env 文件添加您的API密钥

# 验证安装
npm run mcp:check
npm test

# 启动服务器
npm start
```

### Claude Desktop配置

添加到您的Claude Desktop配置：

```json
{
  "mcpServers": {
    "web3-data": {
      "command": "node",
      "args": ["/path/to/web3-data-mcp/src/index.js"],
      "env": {
        "ROOTDATA_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

## ⚙️ 配置

### 环境变量

创建 `.env` 文件：

```env
# 必需
ROOTDATA_API_KEY=your_api_key_here

# 可选
PROMPTS_ENABLED=true
PROMPTS_DEFAULT_LANGUAGE=zh
CACHE_ENABLED=true
DEBUG=false
```

### 高级配置

```json
{
  "server": {
    "name": "web3-data-mcp",
    "version": "2.0.0",
    "prompts": {
      "enabled": true,
      "defaultLanguage": "zh",
      "cacheEnabled": true,
      "cacheTTL": 3600000
    }
  }
}
```

## 🧠 增强功能

### 智能查询理解

v2.0.0版本引入了AI增强的查询处理：

```javascript
// 自动理解自然语言查询
"查找以太坊上的DeFi项目"
→ 工具：search_web3_entities
→ 参数：{ query: "DeFi Ethereum", filters: {...} }

// 缩写自动扩展
"uni 项目详情"
→ 理解为："Uniswap 项目详情"
→ 工具：get_project_details
```

### 智能实体识别

自动识别和提取：
- **项目名称**："Uniswap"、"Aave"、"Compound"
- **代币符号**："ETH"、"BTC"、"UNI"
- **合约地址**："0x..."
- **生态系统名称**："Ethereum"、"Solana"、"Polygon"
- **数字/ID**：项目ID、融资金额
- **社交账号**："@uniswap"、Twitter/X账号
- **组织**："Paradigm"、"a16z"、"Coinbase Ventures"

### 增强的错误处理

```json
{
  "error": {
    "code": "INSUFFICIENT_CREDITS",
    "message": "需要 10 个积分，当前只有 5 个",
    "suggestion": "请充值账户或使用需要较少积分的功能",
    "alternatives": [
      {
        "tool": "search_web3_entities",
        "creditsRequired": 0,
        "description": "免费搜索功能"
      }
    ]
  }
}
```

### 智能响应增强

所有响应现在包括：
- **数据解释**：发现内容的摘要
- **智能建议**：下一步推荐操作
- **质量指标**：数据完整性评估
- **空结果帮助**：无结果时的指导

## 📊 API覆盖

### RootData提供商

我们的实现提供**19个真实端点**，配备增强的AI路由：

#### 🟢 基础级别（4个端点）
| 端点 | 描述 | 积分 | v2.0增强 |
|------|------|------|----------|
| `/ser_inv` | 搜索实体 | 0 | ✅ 智能查询扩展 |
| `/quotacredits` | 检查余额 | 0 | ✅ 自然语言支持 |
| `/get_item` | 项目详情 | 2 | ✅ 自动参数提取 |
| `/get_org` | 组织信息 | 2 | ✅ 实体识别 |

#### 🟡 Plus级别（4个端点）
通过智能参数构建和响应格式化进行增强。

#### 🔴 Pro级别（11个端点）
所有端点都具有上下文感知路由的完整AI增强。

## 💡 使用示例

### 基本用法

```javascript
// 自然语言查询（v2.0新功能）
"搜索DeFi项目"
"查找以太坊生态系统项目"
"获取Uniswap的详情"
"Search for DeFi projects" // 英文也支持

// 系统自动：
// 1. 理解意图
// 2. 提取实体
// 3. 路由到正确工具
// 4. 智能格式化响应
```

### 增强搜索

```javascript
// 缩写扩展（新功能）
"找uni协议" → 找到Uniswap
"btc生态" → 比特币生态系统

// 多实体查询（新功能）
"比较Uniswap和Sushiswap"
→ 系统建议顺序查询

// 空结果处理（新功能）
"找NonExistentProject123"
→ 提供有用的建议和替代方案
```

### 高级功能

```javascript
// 智能参数提取
"项目11646包含团队信息"
→ 自动设置：{ project_id: 11646, include_team: true }

// 上下文感知路由
"还剩多少积分？"
→ 路由到check_credits端点

// 错误恢复建议
// 如果API调用失败，系统提供：
// - 可尝试的替代工具
// - 参数修正
// - 查询重构提示
```

## 🔧 开发

### 新项目结构

```
web3-data-mcp/
├── src/
│   ├── core/
│   │   ├── McpServer.js        # 增强的MCP服务器
│   │   ├── PromptManager.js    # 新增：提示词系统
│   │   ├── ToolRouter.js       # 增强的路由
│   │   └── ErrorHandler.js     # 智能错误
│   ├── prompts/               # 新增：提示词配置
│   │   └── config/
│   │       ├── tools.yaml     # 22个工具提示词
│   │       ├── routing.yaml   # 12个路由提示词
│   │       ├── responses.yaml # 16个响应提示词
│   │       └── errors.yaml    # 16个错误提示词
│   └── providers/
├── tests/                     # 100%覆盖
├── docs/                      # 全面文档
└── scripts/                   # 实用脚本
```

### 关键组件

#### PromptManager（新增）
```javascript
const promptManager = new PromptManager({
  promptsDir: './src/prompts',
  defaultLanguage: 'zh',
  cacheEnabled: true
});

// 获取上下文感知的提示词
const prompt = promptManager.getToolPrompt('search_web3_entities', 'system');
```

#### 增强的ToolRouter
```javascript
// 带实体提取的智能路由
const result = await toolRouter.routeQuery("查找DeFi项目", {
  language: 'zh',
  context: userContext
});
```

## 🧪 测试

### 全面的测试套件

```bash
# 运行所有测试（100%通过）
npm test

# 运行特定测试套件
npm run test:unit         # 单元测试 (Jest)
npm run test:integration  # 集成测试 (Jest)
npm run test:performance  # 性能测试 (Jest)
npm run test:memory       # 内存测试 (Jest)

# 基于脚本的测试
npm run integration:quick  # 快速集成检查
npm run perf:stress       # 压力测试
npm run perf:optimize     # 性能优化
```

### 测试覆盖

- ✅ 所有19个API端点
- ✅ 提示词系统（66个提示词）
- ✅ 实体提取（7种类型）
- ✅ 错误处理场景
- ✅ 多语言支持
- ✅ 性能基准

## 📈 性能

### 基准测试（v2.0.0）

- **路由决策**：< 10ms（优秀）
- **缓存命中率**：可达70%+
- **实体提取**：< 5ms
- **提示词加载**：< 100ms（一次性）
- **内存使用**：优化~15%

### 优化技巧

```bash
# 启动时预热缓存
npm run optimize

# 监控性能
npm run test:performance

# 清理日志
npm run clean:logs
```

## 🎯 AI 提示词最佳实践

### 理解提示词系统

v2.0.0 版本的提示词系统采用分层结构，包含 4 个主要类别：

1. **工具提示词** (`tools.yaml`) - 增强工具描述和使用指导
2. **路由提示词** (`routing.yaml`) - 改进查询理解和工具选择
3. **响应提示词** (`responses.yaml`) - 格式化和增强 API 响应
4. **错误提示词** (`errors.yaml`) - 提供有用的错误消息和恢复建议

### 自定义提示词

#### 1. 定位提示词文件
```bash
src/prompts/config/
├── tools.yaml      # 工具特定提示词
├── routing.yaml    # 查询路由逻辑
├── responses.yaml  # 响应格式化
└── errors.yaml     # 错误处理
```

#### 2. 编辑提示词模板
自定义工具提示词示例：

```yaml
# src/prompts/config/tools.yaml
search_web3_entities:
  system: |
    您正在搜索 Web3 实体。请考虑：
    - 项目名称、代币符号和合约地址
    - 对缩写使用模糊匹配
    - 扩展常见术语（例如："uni" → "Uniswap"）
  
  guidance: |
    💡 提示：尝试使用项目名称、代币符号
    或关键词如 "DeFi"、"NFT"、"Layer 2" 进行搜索
```

#### 3. 添加上下文感知建议
```yaml
# src/prompts/config/responses.yaml
empty_results:
  en: |
    No results found for "{query}".
    Suggestions:
    - Check spelling and try variations
    - Use broader search terms
    - Try searching by category: DeFi, NFT, Infrastructure
  
  zh: |
    未找到 "{query}" 的相关结果。
    建议：
    - 检查拼写并尝试变体
    - 使用更宽泛的搜索词
    - 按类别搜索：DeFi、NFT、基础设施
```

### 提示词工程最佳实践

#### 1. **具体且清晰**
```yaml
# ❌ 太模糊
prompt: "搜索东西"

# ✅ 清晰具体
prompt: "按名称、符号或关键词搜索 Web3 项目、组织和人员"
```

#### 2. **提供示例**
```yaml
tool_usage:
  examples:
    - query: "查找 Uniswap"
      explanation: "搜索 Uniswap 项目"
    - query: "以太坊上的 DeFi 协议"
      explanation: "查找以太坊生态系统中的 DeFi 项目"
```

#### 3. **处理边缘情况**
```yaml
error_handling:
  invalid_input: |
    输入格式不正确。预期格式：
    - 项目 ID：数字（例如：11646）
    - 合约地址：0x... 格式
    - 搜索查询：文本字符串
```

#### 4. **渐进式增强**
```yaml
# 基础提示词
basic: "搜索 {query}"

# 带上下文的增强版
enhanced: |
  在 Web3 生态系统中搜索 {query}。
  考虑：项目、代币、组织、人员。
  
# 智能高级版
advanced: |
  智能搜索 {query}：
  - 扩展缩写（btc → Bitcoin）
  - 识别实体（0x... → 合约地址）
  - 支持多语言
  - 建议相关搜索
```

### 特定语言提示词

使用特定区域的模板支持多语言：

```yaml
# src/prompts/templates/en/search.yaml
search_help: "Enter project name, token symbol, or address"

# src/prompts/templates/zh/search.yaml
search_help: "输入项目名称、代币符号或地址"
```

### 动态提示词变量

使用变量处理动态内容：

```yaml
project_details:
  prompt: |
    获取项目详情：{project_name}
    包含选项：{include_options}
    语言：{language}
```

### 测试自定义提示词

修改提示词后：

```bash
# 验证 YAML 语法
npm run validate:prompts

# 使用示例查询测试
npm run test:prompts

# 检查特定工具行为
node scripts/test-tool-prompts.js
```

### 性能考虑

1. **缓存常用提示词**
   - 提示词在首次加载时缓存
   - 更新后清除缓存：`npm run clean:cache`

2. **保持提示词简洁**
   - 更短的提示词 = 更快的处理速度
   - 专注于必要信息

3. **谨慎使用条件逻辑**
   ```yaml
   # 高效：简单条件
   prompt: |
     {isDetailed ? "详细搜索" : "快速搜索"} {query}
   ```

### 监控提示词效果

跟踪提示词性能：

```javascript
// 启用提示词分析
PROMPTS_ANALYTICS=true npm start

// 查看提示词使用统计
npm run prompts:stats
```

### 常见模式

#### 实体识别模式
```yaml
entity_recognition:
  patterns:
    - type: "project"
      regex: "^[A-Za-z0-9]+\\s*(protocol|finance|swap|dex)?"
    - type: "address"
      regex: "^0x[a-fA-F0-9]{40}$"
    - type: "token"
      regex: "^\\$?[A-Z]{2,10}$"
```

#### 错误恢复模式
```yaml
error_recovery:
  insufficient_credits:
    suggestion: "尝试免费搜索端点"
    alternatives:
      - tool: "search_web3_entities"
        reason: "无需积分"
```

### 高级技巧

#### 1. **多轮对话支持**
```yaml
conversation:
  context_aware: |
    基于之前的查询 "{previous_query}"，
    现在搜索 "{current_query}"
```

#### 2. **智能缩写扩展**
```yaml
abbreviations:
  uni: "Uniswap"
  eth: "Ethereum"
  btc: "Bitcoin"
  defi: "去中心化金融"
```

#### 3. **用户意图分类**
```yaml
intent_classification:
  search: ["查找", "搜索", "找到"]
  details: ["详情", "信息", "资料"]
  compare: ["比较", "对比", "区别"]
```

## 🤝 贡献

欢迎贡献！请参阅我们的[贡献指南](CONTRIBUTING.md)。

### 开发工作流

1. Fork仓库
2. 创建功能分支
3. 进行更改
4. 添加/更新测试
5. 确保100%测试通过
6. 提交Pull Request

### 代码质量

```bash
# 代码检查
npm run lint

# 格式化代码
npm run format

# 验证提示词
npm run validate:prompts
```

## 📄 许可证

本项目采用MIT许可证 - 详见[LICENSE](LICENSE)文件。

## 🔗 资源

- [用户指南](docs/USER_GUIDE.md) - 详细使用说明
- [API文档](docs/API_PROMPT_ENHANCEMENT.md) - 技术API参考
- [部署指南](docs/DEPLOYMENT_GUIDE.md) - 生产部署
- [架构文档](docs/ARCHITECTURE.md) - 系统架构概述

## 🙋‍♂️ 支持

- 📧 邮箱：support@example.com
- 💬 Discord：[加入我们的社区](https://discord.gg/your-server)
- 📖 文档：[完整文档](https://docs.example.com)
- 🐛 错误报告：[GitHub Issues](https://github.com/your-username/web3-data-mcp/issues)

## 💖 赞助

如果您觉得这个项目有帮助，请考虑支持其开发：

### 传统赞助
- 💝 **GitHub赞助**：[在GitHub上支持](https://github.com/sponsors/Fankouzu)

### 加密货币赞助
- 🌟 **Solana (SOL)**：`CuiDdffKV38LjgRVtiA2QiMTKhnzkjX2LUxqSMbVnGjG`

您的支持有助于为Web3社区维护和改进这个项目！🚀

---

**为Web3社区用❤️制作**

*v2.0.0 - 现已具备AI增强智能！* 