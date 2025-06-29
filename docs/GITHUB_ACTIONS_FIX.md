# GitHub Actions Fix

Date: 2025-06-28

## Issues Fixed

### 1. Missing script: "check-mcp"
**Problem**: GitHub Actions was using old command name
```yaml
# Before
run: npm run check-mcp
```

**Solution**: Updated to new command name
```yaml
# After
run: npm run mcp:check
```

### 2. Direct script execution instead of npm commands
**Problem**: Running scripts directly instead of using npm scripts
```yaml
# Before
run: node scripts/optimize-performance.js
run: timeout 60s node scripts/stress-test.js || true
```

**Solution**: Use npm scripts for consistency
```yaml
# After
run: npm run perf:optimize
run: timeout 60s npm run perf:stress || true
```

### 3. YAML validation command
**Problem**: Installing js-yaml globally in CI
```yaml
# Before
run: |
  npm install -g js-yaml
  find src/prompts/config -name "*.yaml" -exec js-yaml {} \; > /dev/null
```

**Solution**: Use existing npm script
```yaml
# After
run: npm run validate:prompts
```

### 4. Integration test script name mismatch
**Problem**: package.json pointed to wrong file
- Actual file: `scripts/test-integration.js`
- Package.json: `scripts/test-api-integration.js`

**Solution**: 
- Created `integration:test` command for the actual integration test
- Updated GitHub Actions to use this command

## Updated Commands in GitHub Actions

- `npm run mcp:check` - MCP compatibility check
- `npm run integration:test` - Run integration tests
- `npm run perf:optimize` - Performance optimization
- `npm run perf:stress` - Stress testing
- `npm run validate:prompts` - YAML validation

All commands now align with our unified test architecture. 