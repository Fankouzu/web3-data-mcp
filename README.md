# Web3 Data MCP Server

A comprehensive Model Context Protocol (MCP) server for Web3 data analysis, providing access to blockchain ecosystem information through standardized APIs.

## 🌟 Features

- **🔗 Multiple Data Sources**: Supports RootData API with plans for more providers
- **📊 Comprehensive Coverage**: 19+ real API endpoints across Basic, Plus, and Pro tiers
- **🌍 Multi-language Support**: English and Chinese language interfaces
- **🛡️ Robust Error Handling**: Built-in retry mechanisms and graceful error recovery
- **📈 Usage Monitoring**: Real-time credit tracking and API rate limiting
- **🧠 Smart Query Routing**: Intelligent endpoint selection based on query intent

## 📋 Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [API Coverage](#api-coverage)
- [Usage Examples](#usage-examples)
- [Development](#development)
- [Testing](#testing)
- [Contributing](#contributing)

## 🚀 Installation

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Valid RootData API key

### Quick Start

```bash
# Clone the repository
git clone https://github.com/your-username/web3-data-mcp.git
cd web3-data-mcp

# Install dependencies
npm install

# Copy configuration template
cp config/config.example.json config/config.json

# Configure your API keys (see Configuration section)
# Edit config/config.json with your credentials

# Start the server
npm run dev
```

## ⚙️ Configuration

Create `config/config.json` with your API credentials:

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

### Environment Variables

Alternatively, you can use environment variables:

```bash
export ROOTDATA_API_KEY="your-api-key"
export MCP_SERVER_PORT="3000"
export NODE_ENV="production"
```

## 📊 API Coverage

### RootData Provider

Our implementation strictly follows the official RootData API documentation with **19 real endpoints**:

#### 🟢 Basic Level (4 endpoints)
| Endpoint | Description | Credits | Method |
|----------|-------------|---------|--------|
| `/ser_inv` | Search projects/organizations/people | 0 | `searchWeb3Entities()` |
| `/quotacredits` | Check API key balance | 0 | `checkCredits()` |
| `/get_item` | Get project details | 2 | `getProjectDetails()` |
| `/get_org` | Get organization details | 2 | `getOrganizationDetails()` |

#### 🟡 Plus Level (4 endpoints)
| Endpoint | Description | Credits | Method |
|----------|-------------|---------|--------|
| `/id_map` | Get ID mapping lists | 20 | `getIdMapping()` |
| `/get_invest` | Get investor information | 2/item | `getInvestorDetails()` |
| `/twitter_map` | Export X (Twitter) data | 50 | `getTwitterData()` |
| `/get_fac` | Get funding rounds | 2/item | `getFundingInformation()` |

#### 🔴 Pro Level (11 endpoints)
| Endpoint | Description | Credits | Method |
|----------|-------------|---------|--------|
| `/get_people` | Get people details | 2 | `getPeopleDetails()` |
| `/ser_change` | Sync updates | 1/item | `getSyncUpdates()` |
| `/hot_index` | Hot projects Top 100 | 10 | `getHotProjects()` |
| `/hot_project_on_x` | X hot projects | 10 | `getHotProjectsOnX()` |
| `/leading_figures_on_crypto_x` | X hot people | 10 | `getHotPeopleOnX()` |
| `/job_changes` | Job position changes | 10 | `getJobChanges()` |
| `/new_tokens` | Recent token launches | 10 | `getNewTokens()` |
| `/ecosystem_map` | Ecosystem mapping | 50 | `getEcosystemMap()` |
| `/tag_map` | Tag mapping | 50 | `getTagMap()` |
| `/projects_by_ecosystems` | Projects by ecosystem | 20 | `getProjectsByEcosystems()` |
| `/projects_by_tags` | Projects by tags | 20 | `getProjectsByTags()` |

## 💡 Usage Examples

### Basic Search Operations

```javascript
// Search for Web3 entities
const results = await provider.searchWeb3Entities("Ethereum");
console.log(`Found ${results.data.length} results`);

// Get project details by ID
const project = await provider.getProjectDetails("12");
console.log(`Project: ${project.data.project_name}`);

// Get project by contract address
const contractProject = await provider.getProjectByContract("0x...", {
  includeTeam: true,
  includeInvestors: true
});
```

### Organization and People Data

```javascript
// Get organization details
const org = await provider.getOrganizationDetails(219, {
  includeTeam: true,
  includeInvestments: true
});

// Get people information (Pro level required)
const person = await provider.getPeopleDetails(12972);
console.log(`Person: ${person.data.people_name}`);
```

### Advanced Analytics (Plus/Pro)

```javascript
// Get funding information with filters
const funding = await provider.getFundingInformation({
  page: 1,
  page_size: 20,
  start_time: "2023-01",
  end_time: "2023-12",
  min_amount: 1000000
});

// Get hot projects (Pro level)
const hotProjects = await provider.getHotProjects(7); // Last 7 days

// Get ecosystem projects
const ecosystemProjects = await provider.getProjectsByEcosystems("52,54");

// Get social media data
const twitterData = await provider.getTwitterData(1); // Type 1 = Projects
```

### Credits Management

```javascript
// Check remaining credits
const credits = await provider.checkCredits();
console.log(`Level: ${credits.data.level}, Credits: ${credits.data.credits}`);

// Get detailed provider status
const status = provider.getDetailedStatus();
console.log(`Available tools: ${status.availableToolsCount}/${status.totalToolsCount}`);
```

### Smart Query Interface

```javascript
// Natural language queries
const result1 = await provider.smartQuery("Ethereum DeFi projects");
const result2 = await provider.smartQuery("recent funding rounds");
const result3 = await provider.smartQuery("生态系统项目"); // Chinese support
```

## 🔧 Development

### Project Structure

```
web3-data-mcp/
├── src/
│   ├── index.js                 # Main server entry
│   ├── server/                  # MCP server implementation
│   │   ├── base/               # Base classes
│   │   └── rootdata/           # RootData provider
│   │       ├── RootDataClient.js    # API client
│   │       ├── RootDataProvider.js  # MCP provider
│   │       └── endpoints/           # API endpoint definitions
│   └── utils/                  # Utility functions
├── config/                     # Configuration files
├── tests/                      # Test suites
└── docs/                       # Documentation
```

### API Client Architecture

```javascript
// Base API Client
class ApiClient {
  async request(endpoint, method, data, headers) {
    // Handles HTTP requests, retries, and error handling
  }
}

// RootData Specific Client
class RootDataClient extends ApiClient {
  async searchEntities(query, language, preciseXSearch) {
    // RootData-specific API implementation
  }
}

// MCP Provider Wrapper
class RootDataProvider extends DataProvider {
  async executeApiCall(endpointId, params) {
    // MCP protocol implementation
  }
}
```

### Adding New Endpoints

1. **Define endpoint in `endpoints/index.js`**:
```javascript
{
  id: 'new_endpoint',
  name: 'new_api_method',
  description: 'Description of the new endpoint',
  endpoint: '/new_endpoint',
  method: 'POST',
  requiredLevel: 'basic',
  creditsPerCall: 5,
  category: 'category_name',
  inputSchema: { /* JSON schema */ },
  outputDescription: 'Description of response'
}
```

2. **Implement in RootDataClient.js**:
```javascript
async newApiMethod(param1, param2, language = 'en') {
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
    // Error handling
  }
}
```

3. **Add to RootDataProvider.js**:
```javascript
case 'new_endpoint':
  result = await this.client.newApiMethod(params.param1, params.param2, language);
  break;
```

## 🧪 Testing

### Unit Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- --grep "RootData"

# Run with coverage
npm run test:coverage
```

### Integration Tests

```bash
# Set up test API key
export ROOTDATA_API_KEY="your-test-api-key"

# Run integration tests
npm run test:integration
```

### Test Coverage

Our comprehensive test suite covers:

- ✅ All 19 API endpoints
- ✅ Error handling scenarios
- ✅ Different API access levels
- ✅ Parameter validation
- ✅ Response formatting
- ✅ Credit management
- ✅ Language detection

### Manual Testing

```bash
# Start server in debug mode
npm run dev

# Test basic search
curl -X POST http://localhost:3000/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Ethereum"}'

# Test with MCP client
npx @modelcontextprotocol/cli@latest \
  --transport stdio \
  -- node src/index.js
```

## 🛠️ API Reference

### Core Methods

#### `searchWeb3Entities(query, options)`
Search for projects, organizations, and people in the Web3 ecosystem.

**Parameters:**
- `query` (string): Search keywords
- `options` (object): 
  - `language` (string): 'en' or 'zh'
  - `preciseXSearch` (boolean): Enable precise X handle search

**Returns:** Array of matching entities with type, name, and metadata.

#### `getProjectDetails(projectId, options)`
Get comprehensive project information.

**Parameters:**
- `projectId` (string|number): Project ID
- `options` (object):
  - `includeTeam` (boolean): Include team member information
  - `includeInvestors` (boolean): Include investor information
  - `language` (string): Response language

**Returns:** Detailed project information including description, funding, team, etc.

#### `getFundingInformation(filters)`
Get funding rounds data with filtering options.

**Parameters:**
- `filters` (object):
  - `page` (number): Page number
  - `page_size` (number): Items per page (max 200)
  - `start_time` (string): Start date (YYYY-MM)
  - `end_time` (string): End date (YYYY-MM)
  - `min_amount` (number): Minimum funding amount
  - `max_amount` (number): Maximum funding amount

**Returns:** Paginated funding rounds with amount, valuation, investors, etc.

### Error Handling

All methods return a standardized response format:

```javascript
{
  success: boolean,
  data: any,           // Response data on success
  error: string,       // Error message on failure
  credits: {           // Credit information
    remaining: number,
    used: number
  }
}
```

### Common Error Codes

- `401`: Invalid API key
- `403`: Insufficient permissions (upgrade API level needed)
- `429`: Rate limit exceeded
- `404`: Resource not found
- `500`: Internal server error

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests for new functionality
5. Run the test suite: `npm test`
6. Commit your changes: `git commit -m 'Add amazing feature'`
7. Push to the branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

### Code Style

We use ESLint and Prettier for code formatting:

```bash
# Check code style
npm run lint

# Auto-fix style issues
npm run lint:fix

# Format code
npm run format
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [RootData Official API Documentation](https://cn.rootdata.com/Api/Doc)
- [Model Context Protocol Specification](https://github.com/modelcontextprotocol/specification)
- [Issue Tracker](https://github.com/your-username/web3-data-mcp/issues)
- [Changelog](CHANGELOG.md)

## 🙋‍♂️ Support

- 📧 Email: support@example.com
- 💬 Discord: [Join our community](https://discord.gg/your-server)
- 📖 Documentation: [Full API docs](https://docs.example.com)
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