# Web3 数据 MCP

**语言**: [English](README.md) | [中文](README.zh-CN.md)

一个基于模型上下文协议（MCP）的服务器，旨在为大型语言模型（LLM）提供来自各种数据提供商的实时、高质量Web3数据访问。该工具充当桥梁，允许AI代理查询Web3项目、融资、代币和市场趋势的详细信息。

主要和初始数据提供商是 **RootData**。

## 功能特性

- **多提供商支持**: 易于扩展以包含更多Web3数据提供商。
- **全面数据**: 访问广泛的数据范围，包括：
  - 项目详情
  - 融资轮次
  - 代币信息
  - 生态系统概述
  - 投资分析
  - 社交媒体指标
- **使用监控**: 内置信用监控以追踪API使用情况和成本。
- **易于使用**: 简单的命令行界面用于启动和管理服务器。
- **可配置**: 灵活配置API密钥、服务器端口等。

## 安装

1.  **克隆仓库:**
    ```bash
    git clone https://github.com/Fankouzu/web3-data-mcp.git
    cd web3-data-mcp
    ```

2.  **安装依赖:**
    本项目需要 Node.js v18.0.0 或更高版本。
    ```bash
    npm install
    ```

3.  **获取您的 RootData API 密钥:**
    - 访问 [RootData.com](https://www.rootdata.com/)
    - 注册账户或登录
    - 导航到您的API设置以获取API密钥
    - 注意您的API级别（Basic、Plus或Pro），因为它决定了您可以访问哪些工具

## 配置

MCP服务器需要您想要使用的数据提供商的API密钥。配置通过环境变量或`.env`文件管理。

1.  在项目根目录创建`.env`文件:
    ```bash
    touch .env
    ```

2.  将您的API密钥和其他配置添加到`.env`文件中。您可以通过运行示例命令查看所有可用选项:
    ```bash
    npm run config:example
    ```
    这将输出一个模板，您可以复制到您的`.env`文件中并填写。

    RootData提供商的最小配置如下所示:
    ```env
    # web3-data-mcp/.env

    # 日志配置
    LOG_LEVEL=info

    # RootData 提供商 API 密钥（必需）
    ROOTDATA_API_KEY=your_rootdata_api_key_here

    # 可选的 RootData 配置
    ROOTDATA_BASE_URL=https://api.rootdata.com/open
    ROOTDATA_TIMEOUT=30000
    ROOTDATA_RETRIES=3

    # 可选的监控配置
    CREDITS_WARNING_THRESHOLD=100
    CREDITS_CRITICAL_THRESHOLD=20
    ```

## 使用方法

您可以使用以下npm脚本启动MCP服务器:

-   **启动服务器:**
    ```bash
    npm start
    ```

-   **以调试模式启动，获得更详细的日志:**
    ```bash
    npm run dev
    ```

-   **查看所有可用命令:**
    ```bash
    npm run help
    ```

服务器运行后，它将暴露MCP端点，AI模型和代理可以连接到该端点。

## MCP 客户端配置

### Claude Desktop 配置

要在Claude Desktop中使用此工具，您需要将其添加到MCP配置文件中。

1. **找到您的Claude Desktop配置文件:**
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`

2. **将web3-data-mcp服务器添加到您的配置中:**

```json
{
  "mcpServers": {
    "web3-data": {
      "command": "node",
      "args": ["/absolute/path/to/web3-data-mcp/src/index.js"],
      "env": {
        "ROOTDATA_API_KEY": "your-rootdata-api-key-here"
      }
    }
  }
}
```

**重要:** 确保:
- 将 `/absolute/path/to/web3-data-mcp/` 替换为项目的实际绝对路径
- 将 `your-rootdata-api-key-here` 替换为您的实际RootData API密钥
- 确保Node.js在您的系统PATH中可用

3. **完整配置示例:**

```json
{
  "mcpServers": {
    "web3-data": {
      "command": "node",
      "args": ["/Users/username/projects/web3-data-mcp/src/index.js"],
      "env": {
        "ROOTDATA_API_KEY": "rd_1234567890abcdef",
        "LOG_LEVEL": "info",
        "CREDITS_WARNING_THRESHOLD": "50"
      }
    }
  }
}
```

4. 保存配置文件后**重启Claude Desktop**。

### 其他MCP客户端

对于其他兼容MCP的客户端，使用以下连接详情:

- **命令**: `node`
- **参数**: `["/path/to/web3-data-mcp/src/index.js"]`
- **环境变量**: 至少设置 `ROOTDATA_API_KEY`

### 验证

配置后，您可以通过询问Claude来验证连接:
- "您有哪些Web3工具可以使用？"
- "检查我的RootData API信用余额"
- "搜索以太坊的信息"

## API 信用和级别

RootData提供商使用基于信用的系统，具有不同的API级别:

- **Basic级别**: 访问基本搜索和项目信息工具
- **Plus级别**: 访问融资轮次和社交数据工具  
- **Pro级别**: 访问高级投资分析工具

每次API调用都会消耗一定数量的信用。该工具会自动检查您的剩余信用和API级别，并在信用不足时发出警告。

## 可用工具（RootData 提供商）

以下工具目前已实现并可通过RootData提供商使用。它们可以被连接到此MCP服务器的AI代理调用。

### ✅ 已实现工具

| 工具名称                     | 描述                                      | 参数                                                                   | 信用成本 |
| ----------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------- | ------------ |
| `check_credits`               | 检查API密钥余额和级别。                 | (无)                                                                       | 0            |
| `search_web3_entities`        | 搜索Web3项目、组织和人员。      | `query`: (string) 搜索关键词。 <br/> `precise_x_search`: (boolean, 可选) | 5 |
| `get_project_details`         | 获取特定项目的详细信息。 | `project_id`: (string) 项目的唯一ID。                         | 10           |
| `get_funding_rounds`          | 获取项目或组织的融资轮次。         | `project_id` 或 `organization_id`: (string)                                  | 15 (需要Plus级别) |
| `get_token_info`              | 获取代币的详细信息。            | `token_symbol`: (string) 代币符号 (例如：BTC)。                       | 8            |
| `get_projects_by_ecosystem`   | 查找特定生态系统内的项目。       | `ecosystem`: (string) 生态系统名称 (例如：Ethereum、Solana)。           | 12           |

### 🚧 计划中的工具（已定义但尚未实现）

以下工具已在端点配置中定义，但尚未在提供商中实现:

- `get_projects_by_tags` - 查找与特定标签相关的项目
- `get_investment_analysis` - 获取投资分析数据 (需要Pro级别)
- `get_social_data` - 获取项目的社交媒体数据 (需要Plus级别)

## 提示建议

以下是一些您可以与有权访问此MCP工具的AI代理一起使用的示例提示:

### 基础查询（所有API级别可用）
-   "搜索关于Uniswap的信息。"
-   "获取ID为'12345'的项目的详细信息。"
-   "ETH代币的信息是什么？"
-   "查找Solana生态系统中的所有项目。"
-   "检查我的API信用余额。"

### 高级查询（需要Plus/Pro级别）
-   "谁投资了ID为'12345'的项目的最新融资轮次？" (需要Plus级别)
-   "获取Uniswap的融资历史。" (需要Plus级别)

### 组合查询
-   "搜索'Axie Infinity'然后获取其详细信息。"
-   "比较Polygon生态系统与Avalanche生态系统的项目数量。"
-   "查找BTC代币的信息和任何相关项目。"

## 故障排除

### 常见问题

1. **"没有配置任何数据供应商" 错误**
   - 确保您已设置 `ROOTDATA_API_KEY` 环境变量
   - 运行 `npm run env:help` 查看所有可用的环境变量

2. **API密钥问题**
   - 验证您的RootData API密钥是否正确
   - 使用 `check_credits` 工具检查您的信用余额
   - 确保您的API级别可以访问您尝试使用的工具

3. **工具未找到错误**
   - 一些工具已定义但尚未实现（请参阅"计划中的工具"部分）
   - 确保您使用的工具名称与"已实现工具"部分中列出的正确

4. **Claude Desktop 连接问题**
   - 确保 `claude_desktop_config.json` 中的路径是绝对路径，而不是相对路径
   - 验证Node.js已安装并可从命令行访问 (`node --version`)
   - 检查配置文件语法是否为有效的JSON
   - 进行配置更改后重启Claude Desktop
   - 在Claude Desktop的开发者控制台中查找错误消息

5. **权限问题**
   - 在macOS/Linux上，确保脚本有执行权限: `chmod +x src/index.js`
   - 确保Node.js可执行文件在您的系统PATH中

### 调试模式

以调试模式运行服务器以获得更详细的日志:
```bash
npm run dev
```

这将显示有关API调用、信用使用情况和任何错误的详细信息。

### 测试您的配置

在与Claude Desktop一起使用之前，您可以在本地测试您的配置:

1. **测试服务器启动:**
   ```bash
   ROOTDATA_API_KEY=your-api-key npm start
   ```
   您应该看到成功消息，没有错误。

2. **测试API连接:**
   ```bash
   ROOTDATA_API_KEY=your-api-key npm run test:provider
   ```
   这将测试RootData API连接并显示您的信用余额。

3. **使用调试输出测试:**
   ```bash
   ROOTDATA_API_KEY=your-api-key npm run dev
   ```
   这将显示详细的初始化日志。

## 贡献

欢迎贡献！请随时提交pull request或开启issue。

## 许可证

本项目基于MIT许可证授权。 