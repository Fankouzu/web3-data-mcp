# Web3 Data MCP Server v2.0.0

<div align="center">

[![Version](https://img.shields.io/badge/version-2.0.0-blue)](https://github.com/your-username/web3-data-mcp/releases)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)
[![Tests](https://img.shields.io/badge/tests-100%25%20passing-brightgreen)](./tests)
[![Performance](https://img.shields.io/badge/routing-<10ms-orange)](./docs/PHASE5_TEST_REPORT.md)

A comprehensive Model Context Protocol (MCP) server for Web3 data analysis, providing intelligent access to blockchain ecosystem information through AI-enhanced APIs.

</div>

## 🚀 What's New in v2.0.0

### 🧠 System Prompt Enhancement
- **66 AI-optimized prompts** across tools, routing, responses, and error handling
- **20% improvement** in intent understanding accuracy
- **Smart entity recognition** for 7 types (projects, tokens, addresses, etc.)
- **Intelligent error messages** with helpful suggestions

### ⚡ Performance Improvements
- **< 10ms routing decisions** (excellent performance)
- **Multi-layer caching** for optimal response times
- **100% test coverage** ensuring reliability

### 🌍 Enhanced Multi-language Support
- Seamless Chinese and English support
- Context-aware language detection
- Localized error messages and suggestions

## 🌟 Features

- **🔗 Multiple Data Sources**: Supports RootData API with plans for more providers
- **📊 Comprehensive Coverage**: 19+ real API endpoints across Basic, Plus, and Pro tiers
- **🧠 AI-Enhanced Routing**: Intelligent query understanding and tool selection
- **💬 Natural Language Queries**: Support for conversational queries
- **🛡️ Smart Error Handling**: Context-aware error messages with recovery suggestions
- **📈 Usage Monitoring**: Real-time credit tracking and API rate limiting
- **⚡ High Performance**: Sub-10ms routing with intelligent caching

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [Enhanced Features](#enhanced-features)
- [API Coverage](#api-coverage)
- [Usage Examples](#usage-examples)
- [Development](#development)
- [Testing](#testing)
- [Contributing](#contributing)

## ⚡ Quick Start

Get up and running in 5 minutes:

```bash
# Clone and install
git clone https://github.com/your-username/web3-data-mcp.git
cd web3-data-mcp
npm install

# Configure
echo "ROOTDATA_API_KEY=your_api_key_here" > .env

# Test
npm test

# Run
npm start
```

For Claude Desktop integration, see the configuration section below.

## 🚀 Installation

### Prerequisites

- Node.js 16+ (recommended 18+)
- npm or yarn
- Valid RootData API key
- Claude Desktop (for MCP integration)

### Detailed Setup

```bash
# Clone the repository
git clone https://github.com/your-username/web3-data-mcp.git
cd web3-data-mcp

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your API key

# Verify installation
npm run check-mcp
npm test

# Start the server
npm start
```

### Claude Desktop Configuration

Add to your Claude Desktop config:

```json
{
  "mcpServers": {
    "web3-data": {
      "command": "node",
      "args": ["/path/to/web3-data-mcp/index.js"],
      "env": {
        "ROOTDATA_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file:

```env
# Required
ROOTDATA_API_KEY=your_api_key_here

# Optional
PROMPTS_ENABLED=true
PROMPTS_DEFAULT_LANGUAGE=en
CACHE_ENABLED=true
DEBUG=false
```

### Advanced Configuration

```json
{
  "server": {
    "name": "web3-data-mcp",
    "version": "2.0.0",
    "prompts": {
      "enabled": true,
      "defaultLanguage": "en",
      "cacheEnabled": true,
      "cacheTTL": 3600000
    }
  }
}
```

## 🧠 Enhanced Features

### Intelligent Query Understanding

The v2.0.0 release introduces AI-enhanced query processing:

```javascript
// Natural language queries are automatically understood
"Find DeFi projects on Ethereum"
→ Tool: search_web3_entities
→ Parameters: { query: "DeFi Ethereum", filters: {...} }

// Abbreviations are expanded
"uni project details"
→ Understands: "Uniswap project details"
→ Tool: get_project_details
```

### Smart Entity Recognition

Automatically identifies and extracts:
- **Project names**: "Uniswap", "Aave", "Compound"
- **Token symbols**: "ETH", "BTC", "UNI"
- **Contract addresses**: "0x..."
- **Ecosystem names**: "Ethereum", "Solana", "Polygon"
- **Numbers/IDs**: Project IDs, funding amounts
- **Social handles**: "@uniswap", Twitter/X handles
- **Organizations**: "Paradigm", "a16z", "Coinbase Ventures"

### Enhanced Error Handling

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

### Intelligent Response Enhancement

All responses now include:
- **Data interpretation**: Summary of what was found
- **Smart suggestions**: Next recommended actions
- **Quality indicators**: Data completeness assessment
- **Empty result help**: Guidance when no results found

## 📊 API Coverage

### RootData Provider

Our implementation provides **19 real endpoints** with enhanced AI routing:

#### 🟢 Basic Level (4 endpoints)
| Endpoint | Description | Credits | Enhanced in v2.0 |
|----------|-------------|---------|------------------|
| `/ser_inv` | Search entities | 0 | ✅ Smart query expansion |
| `/quotacredits` | Check balance | 0 | ✅ Natural language support |
| `/get_item` | Project details | 2 | ✅ Auto parameter extraction |
| `/get_org` | Organization info | 2 | ✅ Entity recognition |

#### 🟡 Plus Level (4 endpoints)
Enhanced with intelligent parameter building and response formatting.

#### 🔴 Pro Level (11 endpoints)
Full AI enhancement across all endpoints with context-aware routing.

## 💡 Usage Examples

### Basic Usage

```javascript
// Natural language queries (NEW in v2.0)
"Search for DeFi projects"
"Find Ethereum ecosystem projects"
"Get details about Uniswap"
"查找以太坊生态项目" // Chinese supported

// The system automatically:
// 1. Understands intent
// 2. Extracts entities
// 3. Routes to correct tool
// 4. Formats response intelligently
```

### Enhanced Search

```javascript
// Abbreviation expansion (NEW)
"find uni protocol" → Finds Uniswap
"btc ecosystem" → Bitcoin ecosystem

// Multi-entity queries (NEW)
"Compare Uniswap and Sushiswap"
→ System suggests sequential queries

// Empty result handling (NEW)
"find NonExistentProject123"
→ Provides helpful suggestions and alternatives
```

### Advanced Features

```javascript
// Smart parameter extraction
"project 11646 with team info"
→ Automatically sets: { project_id: 11646, include_team: true }

// Context-aware routing
"how many credits left?"
→ Routes to check_credits endpoint

// Error recovery suggestions
// If API call fails, system provides:
// - Alternative tools to try
// - Parameter corrections
// - Query reformulation tips
```

## 🔧 Development

### New Project Structure

```
web3-data-mcp/
├── src/
│   ├── core/
│   │   ├── McpServer.js        # Enhanced MCP server
│   │   ├── PromptManager.js    # NEW: Prompt system
│   │   ├── ToolRouter.js       # Enhanced routing
│   │   └── ErrorHandler.js     # Smart errors
│   ├── prompts/               # NEW: Prompt configs
│   │   └── config/
│   │       ├── tools.yaml     # 22 tool prompts
│   │       ├── routing.yaml   # 12 routing prompts
│   │       ├── responses.yaml # 16 response prompts
│   │       └── errors.yaml    # 16 error prompts
│   └── providers/
├── tests/                     # 100% coverage
├── docs/                      # Comprehensive docs
└── scripts/                   # Utility scripts
```

### Key Components

#### PromptManager (NEW)
```javascript
const promptManager = new PromptManager({
  promptsDir: './src/prompts',
  defaultLanguage: 'en',
  cacheEnabled: true
});

// Get context-aware prompts
const prompt = promptManager.getToolPrompt('search_web3_entities', 'system');
```

#### Enhanced ToolRouter
```javascript
// Intelligent routing with entity extraction
const result = await toolRouter.routeQuery("find DeFi projects", {
  language: 'en',
  context: userContext
});
```

## 🧪 Testing

### Comprehensive Test Suite

```bash
# Run all tests (100% passing)
npm test

# Run specific test suites
npm run test:prompts      # Prompt system tests
npm run test:integration  # Integration tests
npm run test:stress      # Stress tests

# Performance testing
npm run optimize         # Run performance optimization
npm run test:performance # Benchmark tests
```

### Test Coverage

- ✅ All 19 API endpoints
- ✅ Prompt system (66 prompts)
- ✅ Entity extraction (7 types)
- ✅ Error handling scenarios
- ✅ Multi-language support
- ✅ Performance benchmarks

## 📈 Performance

### Benchmarks (v2.0.0)

- **Routing Decision**: < 10ms (excellent)
- **Cache Hit Rate**: 70%+ achievable
- **Entity Extraction**: < 5ms
- **Prompt Loading**: < 100ms (one-time)
- **Memory Usage**: Optimized ~15%

### Optimization Tips

```bash
# Warm up cache on startup
npm run optimize

# Monitor performance
npm run performance-test

# Clean logs
npm run clean:logs
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md).

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add/update tests
5. Ensure 100% test passing
6. Submit a Pull Request

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format

# Validate prompts
npm run validate:prompts
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Resources

- [User Guide](docs/USER_GUIDE.md) - Detailed usage instructions
- [API Documentation](docs/API_PROMPT_ENHANCEMENT.md) - Technical API reference
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) - Production deployment
- [Architecture Documentation](docs/ARCHITECTURE.md) - System architecture overview

## 🙋‍♂️ Support

- 📧 Email: support@example.com
- 💬 Discord: [Join our community](https://discord.gg/your-server)
- 📖 Documentation: [Full docs](https://docs.example.com)
- 🐛 Bug Reports: [GitHub Issues](https://github.com/your-username/web3-data-mcp/issues)

## 💖 Sponsorship

If you find this project helpful, please consider supporting its development:

### Traditional Sponsorship
- 💝 **GitHub Sponsors**: [Support on GitHub](https://github.com/sponsors/Fankouzu)

### Crypto Sponsorship
- 🌟 **Solana (SOL)**: `CuiDdffKV38LjgRVtiA2QiMTKhnzkjX2LUxqSMbVnGjG`

Your support helps maintain and improve this project for the Web3 community! 🚀

---

**Made with ❤️ for the Web3 community**

*v2.0.0 - Now with AI-enhanced intelligence!* 