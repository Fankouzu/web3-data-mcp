# Contributing to Web3 Data MCP

Thank you for your interest in contributing to Web3 Data MCP! This document provides guidelines for contributing to the project.

## Development Setup

### Prerequisites

- Node.js 18+ 
- npm
- Git

### Getting Started

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/your-username/web3-data-mcp.git
   cd web3-data-mcp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy example configuration
   cp config/config.example.json config/config.json
   
   # Edit with your API keys
   # At minimum, add your ROOTDATA_API_KEY
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

## Development Workflow

### Code Style

We use ESLint and Prettier to maintain consistent code style:

```bash
# Check code style
npm run lint

# Auto-fix style issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

**Important**: All code must pass linting checks before being merged.

### Testing

Before submitting a pull request, ensure all tests pass:

```bash
# Run all tests
npm test

# Run specific test types
npm run test:unit
npm run test:integration  # Requires API key

# Check test coverage
npm run test:coverage
```

### Git Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, documented code
   - Follow the existing code style
   - Add tests for new functionality
   - Update documentation as needed

3. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

   **Commit Message Format:**
   - `feat:` new feature
   - `fix:` bug fix
   - `docs:` documentation updates
   - `style:` formatting changes
   - `refactor:` code refactoring
   - `test:` adding tests
   - `chore:` maintenance tasks

4. **Run quality checks**
   ```bash
   npm run lint
   npm run format:check
   npm test
   ```

5. **Push and create a pull request**
   ```bash
   git push origin feature/your-feature-name
   ```

## Adding New Features

### Adding a New API Endpoint

1. **Define the endpoint** in `src/providers/rootdata/endpoints/index.js`:
   ```javascript
   {
     id: 'new_endpoint',
     name: 'newApiMethod',
     description: 'Description of the new endpoint',
     endpoint: '/new_endpoint',
     method: 'POST',
     requiredLevel: 'basic', // or 'plus', 'pro'
     creditsPerCall: 5,
     category: 'category_name',
     inputSchema: {
       type: 'object',
       properties: {
         // Define input parameters
       }
     },
     outputDescription: 'Description of response'
   }
   ```

2. **Implement in the client** (`src/providers/rootdata/RootDataClient.js`):
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
       return this.handleError(error, 'newApiMethod');
     }
   }
   ```

3. **Add to the provider** (`src/providers/rootdata/RootDataProvider.js`):
   ```javascript
   case 'new_endpoint':
     result = await this.client.newApiMethod(
       params.param1, 
       params.param2, 
       language
     );
     break;
   ```

4. **Add tests** in the appropriate test file.

### Adding a New Data Provider

1. Create a new directory: `src/providers/newprovider/`
2. Implement the client class extending `ApiClient`
3. Implement the provider class extending `DataProvider`
4. Add endpoint definitions
5. Update configuration management
6. Add comprehensive tests

## Code Quality Standards

### JavaScript Style Guide

- Use ES6+ features when appropriate
- Prefer `const` and `let` over `var`
- Use template literals for string interpolation
- Use destructuring for object and array assignments
- Use arrow functions for callbacks
- Use async/await instead of promises when possible

### Documentation

- All public methods must have JSDoc comments
- Include parameter types and descriptions
- Include return value descriptions
- Provide usage examples for complex functions

### Error Handling

- Use try-catch blocks for async operations
- Return standardized error responses
- Log errors with appropriate context
- Don't expose sensitive information in error messages

### Testing

- Write unit tests for all new functions
- Include integration tests for API endpoints
- Test error conditions and edge cases
- Mock external dependencies in unit tests

## Debugging

### Development Mode

```bash
# Start with debug logging
npm run dev

# Set specific log level
LOG_LEVEL=debug npm run dev
```

### Testing API Connectivity

```bash
# Test RootData connection
ROOTDATA_API_KEY=your-key npm run test:provider

# Test specific functionality
node test-rootdata-provider.js
```

## Pull Request Guidelines

### Before Submitting

- [ ] Code passes all linting checks (`npm run lint`)
- [ ] Code is properly formatted (`npm run format:check`)
- [ ] All tests pass (`npm test`)
- [ ] New functionality is tested
- [ ] Documentation is updated
- [ ] CHANGELOG.md is updated (if applicable)

### Pull Request Template

**Description**
Brief description of changes and motivation.

**Type of Change**
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

**Testing**
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

**Checklist**
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings or errors

## Getting Help

- 📧 Email: support@example.com
- 💬 Discord: [Join our community](https://discord.gg/your-server)
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/web3-data-mcp/issues)

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). By participating, you are expected to uphold this code.

---

Thank you for contributing to Web3 Data MCP! 🚀 