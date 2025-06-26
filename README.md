# Web3 Data MCP

**Languages**: [English](README.md) | [中文](README.zh-CN.md)

A Model Context Protocol (MCP) server designed to provide Large Language Models (LLMs) with access to real-time, high-quality Web3 data from various data providers. This tool acts as a bridge, allowing AI agents to query detailed information about Web3 projects, funding, tokens, and market trends.

The initial and primary data provider is **RootData**.

## Features

- **Multi-Provider Support**: Easily extendable to include more Web3 data providers.
- **Comprehensive Data**: Access a wide range of data including:
  - Project Details
  - Funding Rounds
  - Token Information
  - Ecosystem Overviews
  - Investment Analysis
  - Social Media Metrics
- **Usage Monitoring**: Built-in credit monitoring to track API usage and costs.
- **Easy to Use**: Simple command-line interface for starting and managing the server.
- **Configurable**: Flexible configuration for API keys, server ports, and more.

## Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-org/web3-data-mcp.git
    cd web3-data-mcp
    ```

2.  **Install dependencies:**
    This project requires Node.js v18.0.0 or higher.
    ```bash
    npm install
    ```

3.  **Get your RootData API Key:**
    - Visit [RootData.com](https://www.rootdata.com/)
    - Sign up for an account or log in
    - Navigate to your API settings to obtain your API key
    - Note your API level (Basic, Plus, or Pro) as it determines which tools you can access

## Configuration

The MCP server requires API keys for the data providers you want to use. The configuration is managed through environment variables or a `.env` file.

1.  Create a `.env` file in the root of the project:
    ```bash
    touch .env
    ```

2.  Add your API keys and other configurations to the `.env` file. You can see all available options by running the example command:
    ```bash
    npm run config:example
    ```
    This will output a template that you can copy into your `.env` file and fill out.

    A minimal configuration for the RootData provider would look like this:
    ```env
    # web3-data-mcp/.env

    # Logging Configuration
    LOG_LEVEL=info

    # RootData Provider API Key (Required)
    ROOTDATA_API_KEY=your_rootdata_api_key_here

    # Optional RootData Configuration
    ROOTDATA_BASE_URL=https://api.rootdata.com/open
    ROOTDATA_TIMEOUT=30000
    ROOTDATA_RETRIES=3

    # Optional Monitoring Configuration
    CREDITS_WARNING_THRESHOLD=100
    CREDITS_CRITICAL_THRESHOLD=20
    ```

## Usage

You can start the MCP server using the following npm scripts:

-   **Start the server:**
    ```bash
    npm start
    ```

-   **Start in debug mode for more verbose logging:**
    ```bash
    npm run dev
    ```

-   **View all available commands:**
    ```bash
    npm run help
    ```

Once the server is running, it will expose the MCP endpoint that AI models and agents can connect to.

## MCP Client Configuration

### Claude Desktop Configuration

To use this tool with Claude Desktop, you need to add it to your MCP configuration file.

1. **Locate your Claude Desktop configuration file:**
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`

2. **Add the web3-data-mcp server to your configuration:**

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

**Important:** Make sure to:
- Replace `/absolute/path/to/web3-data-mcp/` with the actual absolute path to your project
- Replace `your-rootdata-api-key-here` with your actual RootData API key
- Ensure Node.js is available in your system PATH

3. **Example complete configuration:**

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

4. **Restart Claude Desktop** after saving the configuration file.

### Other MCP Clients

For other MCP-compatible clients, use the following connection details:

- **Command**: `node`
- **Arguments**: `["/path/to/web3-data-mcp/src/index.js"]`
- **Environment Variables**: At minimum, set `ROOTDATA_API_KEY`

### Verification

After configuration, you can verify the connection by asking Claude:
- "What Web3 tools do you have access to?"
- "Check my RootData API credits balance"
- "Search for information about Ethereum"

## API Credits and Levels

The RootData provider uses a credit-based system with different API levels:

- **Basic Level**: Access to basic search and project information tools
- **Plus Level**: Access to funding rounds and social data tools  
- **Pro Level**: Access to advanced investment analysis tools

Each API call consumes a certain number of credits. The tool automatically checks your remaining credits and API level, and will warn you when credits are running low.

## Available Tools (RootData Provider)

The following tools are currently implemented and available through the RootData provider. They can be called by an AI agent connected to this MCP server.

### ✅ Implemented Tools

| Tool Name                     | Description                                      | Parameters                                                                   | Credits Cost |
| ----------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------- | ------------ |
| `check_credits`               | Check API key balance and level.                 | (None)                                                                       | 0            |
| `search_web3_entities`        | Search for Web3 projects, orgs, and people.      | `query`: (string) The search keyword. <br/> `precise_x_search`: (boolean, optional) | 5 |
| `get_project_details`         | Get detailed information for a specific project. | `project_id`: (string) The unique ID of the project.                         | 10           |
| `get_funding_rounds`          | Get funding rounds for a project or org.         | `project_id` or `organization_id`: (string)                                  | 15 (Plus level required) |
| `get_token_info`              | Get detailed information for a token.            | `token_symbol`: (string) The token symbol (e.g., BTC).                       | 8            |
| `get_projects_by_ecosystem`   | Find projects within a specific ecosystem.       | `ecosystem`: (string) The ecosystem name (e.g., Ethereum, Solana).           | 12           |

### 🚧 Planned Tools (Defined but not yet implemented)

The following tools are defined in the endpoints configuration but not yet implemented in the provider:

- `get_projects_by_tags` - Find projects associated with certain tags
- `get_investment_analysis` - Get investment analysis data (Pro level required)
- `get_social_data` - Get social media data for a project (Plus level required)

## Prompt Suggestions

Here are some example prompts you could use with an AI agent that has access to this MCP tool:

### Basic Queries (Available with all API levels)
-   "Search for information about Uniswap."
-   "Get the detailed information for the project with ID '12345'."
-   "What is the token information for ETH?"
-   "Find all projects in the Solana ecosystem."
-   "Check my API credits balance."

### Advanced Queries (Require Plus/Pro level)
-   "Who invested in the latest funding round for the project with ID '12345'?" (Plus level required)
-   "Get the funding history for Uniswap." (Plus level required)

### Combined Queries
-   "Search for 'Axie Infinity' and then get its detailed information."
-   "Compare the number of projects in the Polygon ecosystem versus the Avalanche ecosystem."
-   "Find information about the BTC token and any related projects."

## Troubleshooting

### Common Issues

1. **"没有配置任何数据供应商" Error**
   - Make sure you have set the `ROOTDATA_API_KEY` environment variable
   - Run `npm run env:help` to see all available environment variables

2. **API Key Issues**
   - Verify your RootData API key is correct
   - Check your credit balance with the `check_credits` tool
   - Ensure your API level has access to the tools you're trying to use

3. **Tool Not Found Errors**
   - Some tools are defined but not yet implemented (see "Planned Tools" section)
   - Make sure you're using the correct tool names as listed in the "Implemented Tools" section

4. **Claude Desktop Connection Issues**
   - Ensure the path in `claude_desktop_config.json` is absolute, not relative
   - Verify Node.js is installed and accessible from command line (`node --version`)
   - Check that the configuration file syntax is valid JSON
   - Restart Claude Desktop after making configuration changes
   - Look for error messages in Claude Desktop's developer console

5. **Permission Issues**
   - On macOS/Linux, ensure the script has execute permissions: `chmod +x src/index.js`
   - Make sure the Node.js executable is in your system PATH

### Debug Mode

Run the server in debug mode for more detailed logging:
```bash
npm run dev
```

This will show detailed information about API calls, credit usage, and any errors.

### Testing Your Configuration

Before using with Claude Desktop, you can test your configuration locally:

1. **Test the server startup:**
   ```bash
   ROOTDATA_API_KEY=your-api-key npm start
   ```
   You should see a success message without errors.

2. **Test API connectivity:**
   ```bash
   ROOTDATA_API_KEY=your-api-key npm run test:provider
   ```
   This will test the RootData API connection and show your credit balance.

3. **Test with debug output:**
   ```bash
   ROOTDATA_API_KEY=your-api-key npm run dev
   ```
   This will show detailed initialization logs.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue.

## License

This project is licensed under the MIT License. 