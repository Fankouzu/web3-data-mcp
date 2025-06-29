# 🚀 Quick Start Guide | 快速开始指南

## 📋 Prerequisites | 前置条件

- Node.js >= 14.0.0
- RootData API Key (Get from [RootData](https://www.rootdata.com))
- Claude Desktop (Latest version)

## ⚡ 5-Minute Setup | 5分钟设置

### 1. Clone & Install | 克隆和安装

```bash
git clone https://github.com/your-org/web3-data-mcp.git
cd web3-data-mcp
npm install
```

### 2. Configure API Key | 配置 API 密钥

Create `.env` file:
```env
ROOTDATA_API_KEY=your_api_key_here
```

### 3. Test Installation | 测试安装

```bash
# Quick test
npm test

# Check MCP compatibility
npm run check-mcp
```

### 4. Configure Claude Desktop | 配置 Claude Desktop

Add to Claude Desktop config (`claude_desktop_config.json`):

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

### 5. Restart Claude Desktop | 重启 Claude Desktop

Restart Claude Desktop to load the MCP server.

## 🎯 First Query | 第一个查询

Try these queries in Claude:

**English:**
- "Search for DeFi projects on Ethereum"
- "Get details about Uniswap"
- "Check my API credits"

**中文:**
- "搜索以太坊上的DeFi项目"
- "获取Uniswap的详细信息"
- "查看我的API积分"

## ✨ Key Features | 核心功能

### 🧠 Smart Intent Understanding | 智能意图理解
- Automatically understands your query intent
- Supports abbreviations (uni → Uniswap)
- Multi-language support (EN/CN)

### 🔍 Enhanced Search | 增强搜索
```
Query: "find btc projects"
→ System understands: Bitcoin ecosystem projects
```

### 📊 Rich Responses | 丰富的响应
- Data interpretation
- Smart suggestions
- Quality indicators
- Empty result help

### ❤️ Friendly Errors | 友好的错误提示
```json
{
  "error": "Insufficient credits",
  "suggestion": "Try using search instead",
  "alternatives": ["search_web3_entities"]
}
```

## 🛠️ Common Commands | 常用命令

```bash
# Run tests
npm test

# Check performance
npm run performance-test

# View logs
npm run logs

# Update prompts
npm run update-prompts
```

## 📚 Examples | 示例

### Search Projects | 搜索项目
```
"Find GameFi projects"
"搜索Layer2解决方案"
```

### Get Details | 获取详情
```
"Show me project 11646"
"Aave项目的详细信息"
```

### Check Balance | 查询余额
```
"How many credits left?"
"剩余积分查询"
```

## 🔧 Troubleshooting | 故障排除

### MCP Server Not Found
1. Check Claude Desktop config path
2. Verify API key in .env
3. Restart Claude Desktop

### No Results Found
1. Try more general terms
2. Check spelling
3. Use full project names

### Performance Issues
1. Enable caching: `CACHE_ENABLED=true`
2. Run optimization: `npm run optimize`

## 📖 Next Steps | 下一步

1. Read [User Guide](docs/USER_GUIDE.md) for advanced usage
2. Check [API Documentation](docs/API_PROMPT_ENHANCEMENT.md)
3. Join our [Discord](https://discord.gg/your-channel)

## 🆘 Need Help? | 需要帮助？

- 📧 Email: support@your-org.com
- 💬 Discord: [Join Community](https://discord.gg/your-channel)
- 📝 Issues: [GitHub Issues](https://github.com/your-org/web3-data-mcp/issues)

---

**Ready to explore Web3 data? Start querying now! 🚀**

**准备探索Web3数据了吗？现在就开始查询吧！🚀** 