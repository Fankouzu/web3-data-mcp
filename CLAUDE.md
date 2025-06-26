# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Node.js project for building a Model Context Protocol (MCP) server that provides Web3 data access. The project uses the `@modelcontextprotocol/sdk` for MCP server implementation.

## Development Commands

### 启动服务器
- `npm start` - 启动MCP服务器
- `npm run dev` - 调试模式启动
- `ROOTDATA_API_KEY=your-key node src/index.js` - 使用环境变量启动

### 测试命令
- `npm test` - 运行完整功能测试
- `npm run test:provider` - 测试RootData供应商模块
- `npm run test:api` - 运行基础API测试

### 帮助命令
- `npm run help` - 显示帮助信息
- `npm run config:example` - 显示示例配置
- `npm run env:help` - 显示环境变量说明

## 项目完成状态

✅ **完整的MCP服务器实现** (2024-12-26)

### 核心功能
- ✅ **MCP协议支持** - 完整的Model Context Protocol实现
- ✅ **多供应商架构** - 可扩展的数据供应商系统
- ✅ **智能路由** - 自动意图识别和工具选择
- ✅ **错误处理** - 统一的错误管理和用户友好消息
- ✅ **Credits监控** - 实时余额监控和预警系统
- ✅ **配置管理** - 灵活的配置系统和环境变量支持

### RootData供应商
- ✅ **6个可用工具** - Credits查询、搜索、项目详情、代币信息等
- ✅ **智能语言检测** - 自动识别中英文查询
- ✅ **实时Credits跟踪** - 消耗统计和余额预警
- ✅ **权限管理** - 基于用户等级的功能访问控制

### 系统架构
- ✅ **供应商抽象层** - DataProvider基类
- ✅ **API客户端** - 统一的HTTP处理和重试机制
- ✅ **工具路由器** - 智能查询路由和工具推荐
- ✅ **监控系统** - Credits状态和错误统计

### API配置
- **Base URL**: `https://api.rootdata.com/open`
- **认证方式**: `apikey` header
- **响应格式**: `result: 200` 表示成功
- **支持的用户等级**: Basic, Plus, Pro

## Architecture

**MCP Server Structure:**
- Main entry point should be `index.js` as specified in package.json
- Uses `@modelcontextprotocol/sdk` for MCP server implementation
- Intended to provide Web3 data tools and resources via MCP protocol

**Current State:**
- Project is freshly initialized with npm
- No source code files exist yet
- Git repository initialized but no commits made
- Dependencies: Only MCP SDK installed

## Development Notes

When creating the MCP server:
- Follow MCP server patterns using the SDK
- Implement tools for Web3 data access (blockchain queries, wallet info, etc.)
- Consider configuration for different Web3 networks
- Server should expose tools/resources via MCP protocol for use by MCP clients like Claude