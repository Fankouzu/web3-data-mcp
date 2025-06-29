# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Web3 Data MCP Server - A production-ready Model Context Protocol (MCP) server providing comprehensive Web3 data access through RootData API integration. The project features a multi-provider architecture, intelligent routing, and system prompt enhancements for optimal LLM interaction.

**Current Version**: v2.0.0 (with System Prompt Enhancement)  
**Status**: Production-ready with 100% API coverage and enterprise-grade quality

## Project Structure

```
web3-data-mcp/
├── src/
│   ├── index.js                    # MCP server entry point
│   ├── providers/                  # Data provider modules
│   │   ├── base/                   # Provider base classes
│   │   │   ├── DataProvider.js     # Provider abstract class
│   │   │   └── ApiClient.js        # HTTP client base class
│   │   └── rootdata/               # RootData provider implementation
│   │       ├── RootDataProvider.js # Main provider class
│   │       ├── RootDataClient.js   # API client
│   │       ├── endpoints.js        # API endpoint definitions
│   │       └── tools.js            # MCP tool definitions
│   ├── core/                       # Core functionality
│   │   ├── McpServer.js            # MCP server core (enhanced)
│   │   ├── ToolRouter.js           # Intelligent tool routing
│   │   ├── ConfigManager.js        # Configuration management
│   │   ├── ErrorHandler.js         # Error handling (enhanced)
│   │   └── PromptManager.js        # System prompt management
│   ├── prompts/                    # System prompts configuration
│   │   ├── config/
│   │   │   ├── tools.yaml          # Tool prompts (22)
│   │   │   ├── routing.yaml        # Routing prompts (12)
│   │   │   ├── responses.yaml      # Response prompts (16)
│   │   │   ├── errors.yaml         # Error prompts (16)
│   │   │   └── performance.yaml    # Performance config
│   │   └── VERSION                 # Prompt version tracking
│   ├── utils/                      # Utility functions
│   │   ├── language.js             # Language detection
│   │   ├── validation.js           # Parameter validation
│   │   ├── logger.js               # Logging utilities
│   │   └── performanceOptimizer.js # Performance optimization
│   ├── validators/                 # Response validators
│   │   └── responseValidator.js    # API response validation
│   └── types/                      # TypeScript definitions
│       └── rootdata.d.ts           # RootData API types
├── tests/                          # Jest test suites
│   ├── test-rootdata-provider.js   # Provider tests
│   ├── integration-test.js         # Integration tests
│   ├── performance-test.js         # Performance tests
│   └── memory-test.js              # Memory tests
├── scripts/                        # Utility scripts
│   ├── test-project-details.js     # Project details testing
│   ├── test-integration.js         # Full integration test
│   ├── health-check.js             # System health check
│   └── mcp-compatibility-check.js  # MCP protocol check
└── docs/                           # Documentation
    ├── ARCHITECTURE.md             # System architecture
    ├── QUICK_START.md              # Getting started guide
    ├── USER_GUIDE.md               # User manual
    ├── DEPLOYMENT_GUIDE.md         # Deployment instructions
    └── rootdata-api-reference.md   # API documentation
```

## Development Commands

### 启动服务器
```bash
npm start                           # 启动 MCP 服务器
npm run dev                         # 开发模式（热重载）
ROOTDATA_API_KEY=your-key npm start # 使用环境变量启动
```

### 测试命令
```bash
npm test                            # 运行所有 Jest 测试
npm run test:unit                   # 单元测试
npm run test:integration            # 集成测试
npm run test:performance            # 性能测试
npm run test:memory                 # 内存测试
npm run test:coverage               # 测试覆盖率
npm run test:all                    # 运行所有测试和脚本
```

### 代码质量
```bash
npm run lint                        # ESLint 检查
npm run lint:fix                    # 自动修复 lint 问题
npm run format                      # Prettier 格式化
npm run format:check                # 检查格式化
npm run validate                    # 运行所有验证
```

### 工具命令
```bash
npm run mcp:check                   # MCP 兼容性检查
npm run help                        # 显示帮助信息
npm run config:example              # 显示示例配置
npm run env:help                    # 环境变量说明
npm run health:check                # 系统健康检查
npm run security:audit              # 安全审计
npm run clean:cache                 # 清理缓存
```

### 提示词管理
```bash
npm run validate:prompts            # 验证 YAML 配置
npm run prompts:stats               # 提示词使用统计
```

### 集成测试脚本
```bash
npm run integration:quick           # 快速集成测试
npm run integration:test            # 完整集成测试
npm run perf:stress                 # 压力测试
npm run perf:optimize               # 性能优化
```

### 文档生成
```bash
npm run docs:generate               # 生成 API 文档
npm run test:info                   # 显示测试架构信息
```

## RootData API Coverage

### Basic Level (4 endpoints)
- `search_web3_entities` - Search projects/organizations/people
- `check_api_credits` - Check remaining API credits
- `get_project_details` - Get detailed project information
- `get_organization_details` - Get VC/organization details

### Plus Level (3 endpoints)
- `get_entity_ids` - Get ID mappings
- `get_investor_details` - Batch investor information
- `get_funding_rounds` - Funding round data

### Pro Level (12 endpoints)
- `get_people_details` - People information
- `get_twitter_rankings` - X/Twitter hot rankings
- `sync_data_changes` - Data update tracking
- `get_hot_projects` - Top 100 hot projects
- `get_twitter_hot_projects` - X hot projects
- `get_twitter_hot_people` - X hot people
- `get_job_changes` - Job change tracking
- `get_new_tokens` - Recently launched tokens
- `get_ecosystem_map` - Ecosystem mapping
- `get_tag_map` - Tag mapping
- `get_projects_by_ecosystems` - Projects by ecosystem
- `get_projects_by_tags` - Projects by tags

## Test Architecture

### Jest Tests (tests/*.js)
- Unit tests for core components
- Integration tests for API endpoints
- Performance benchmarks
- Memory leak detection

### Script Tests (scripts/*.js)
- Quick functionality checks
- Integration scenarios
- Stress testing
- System health checks

Run `npm run test:info` for detailed test architecture information.

## Common Issues and Solutions

### 1. MCP Protocol Errors

**Issue**: "Unexpected token" JSON parsing errors  
**Cause**: console.log() outputs polluting STDOUT  
**Solution**: Use console.error() for all debug output

**Issue**: Character encoding errors  
**Cause**: Emoji characters in logs  
**Solution**: Use only ASCII characters in logs

### 2. Parameter Type Errors

**Issue**: "query.toLowerCase is not a function"  
**Cause**: Assuming all parameters are strings  
**Solution**: Always validate and convert parameter types

```javascript
// Good practice
if (typeof query !== 'string') {
  query = String(query);
}
```

### 3. API Key Issues

**Issue**: "Provider not configured"  
**Cause**: Missing API key  
**Solution**: Set ROOTDATA_API_KEY environment variable

### 4. Rate Limiting

**Issue**: API rate limit exceeded  
**Cause**: Too many requests  
**Solution**: Enable caching and batch operations

## Development Best Practices

### 1. MCP Protocol Compliance
- **NEVER** use console.log() - it pollutes STDOUT
- **ALWAYS** use console.error() for debug output
- **AVOID** emoji characters in any output
- **ENSURE** all JSON responses are valid

### 2. Error Handling
- Provide user-friendly error messages
- Include helpful suggestions
- Log detailed errors for debugging
- Never expose sensitive information

### 3. Parameter Handling
- Validate all input parameters
- Handle type conversions explicitly
- Support multiple parameter formats
- Document expected types

### 4. Performance Optimization
- Use caching for repeated queries
- Implement request batching
- Monitor memory usage
- Optimize response sizes

### 5. Testing
- Write tests for new features
- Maintain test coverage >80%
- Test error scenarios
- Performance regression tests

## System Prompt Enhancement

The v2.0.0 release includes a comprehensive prompt system:

### Prompt Categories
1. **Tool Prompts** - Enhance tool definitions and usage
2. **Routing Prompts** - Improve query understanding
3. **Response Prompts** - Format and enrich responses
4. **Error Prompts** - Provide helpful error messages

### Key Features
- Multi-language support (EN/CN)
- Context-aware suggestions
- Entity recognition (7 types)
- Abbreviation expansion
- Smart parameter construction

## Debugging Tips

### Enable Debug Mode
```bash
DEBUG=* npm start                   # All debug output
DEBUG=mcp:* npm start              # MCP-specific debug
DEBUG_PROMPTS=true npm start       # Prompt system debug
```

### Check System Health
```bash
npm run health:check               # Full system check
npm run mcp:check                  # MCP compatibility
npm run validate:prompts           # Prompt validation
```

### Analyze Performance
```bash
npm run perf:stress               # Run stress tests
npm run test:memory               # Check memory usage
cat logs/performance-*.log        # View performance logs
```

## Configuration

### Environment Variables
```bash
# Required
ROOTDATA_API_KEY=your_api_key      # RootData API key

# Optional
PROMPTS_ENABLED=true               # Enable prompt system
PROMPTS_DEFAULT_LANGUAGE=en        # Default language (en/zh)
PROMPTS_CACHE_TTL=3600000         # Cache TTL (1 hour)
CACHE_ENABLED=true                 # Enable response cache
DEBUG_PROMPTS=false               # Debug prompt system
LOG_LEVEL=info                    # Logging level
```

### MCP Client Configuration
```json
{
  "mcpServers": {
    "web3-data": {
      "command": "node",
      "args": ["/absolute/path/to/src/index.js"],
      "env": {
        "ROOTDATA_API_KEY": "your_api_key"
      }
    }
  }
}
```

## Important Reminders

1. **STDOUT is sacred** - Only JSON-RPC messages should go to STDOUT
2. **Type safety matters** - Always validate parameter types
3. **Errors are opportunities** - Provide helpful error messages
4. **Performance counts** - Use caching and optimization
5. **Documentation helps** - Keep docs updated
6. **Test everything** - Maintain high test coverage

## Version History

- **v2.0.0** (2025-06-28) - System prompt enhancement, improved error handling
- **v1.0.0** (2024-12-26) - Initial release with full RootData API coverage

## Support

For issues or questions:
- Check `/docs` folder for detailed guides
- Run diagnostic commands
- Review error logs in console output
- Submit issues with full error details