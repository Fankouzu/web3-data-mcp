# Test Architecture Fix

Date: 2025-06-28

## Problem Analysis

The current test setup has inconsistencies:
- Some test files use Jest syntax (`describe`, `it`, `expect`) but are run with `node`
- This causes errors like "describe is not defined"
- Mixed testing approaches lead to confusion and failures

## Current State

### Files Using Jest Syntax
1. **test-rootdata-provider.js** - ✅ Run with Jest
2. **memory-test.js** - ❌ Run with node (should be Jest)
3. **test-mcp-server.js** - ✅ Run with Jest
4. **api-test.js** - ❌ Run with node (should be Jest)
5. **performance-test.js** - ❌ Run with node (should be Jest)
6. **test-error-handling.js** - ❌ Not in package.json

### Script Files (Not Tests)
These should remain as node scripts:
- scripts/test-get-project.js
- scripts/test-project-details.js
- scripts/stress-test.js
- scripts/optimize-performance.js
- scripts/quick-test.js

## Proposed Solution

### 1. Categorization
- **Jest Tests**: Files in `tests/` directory with `describe/it`
- **Integration Scripts**: Files in `scripts/` directory
- **Performance Scripts**: Standalone scripts for benchmarking

### 2. Naming Convention
- Jest test files: `test-*.js` or `*.test.js`
- Script files: `*-test.js` or descriptive names

### 3. Updated NPM Scripts

```json
{
  // Jest-based tests
  "test": "jest tests/",
  "test:unit": "jest tests/test-*.js",
  "test:coverage": "jest --coverage",
  "test:watch": "jest --watch",
  
  // Integration/Script tests
  "integration:api": "node scripts/test-api-integration.js",
  "integration:quick": "node scripts/quick-test.js",
  "integration:project": "node scripts/test-project-details.js",
  
  // Performance/Stress tests
  "perf:stress": "node scripts/stress-test.js",
  "perf:optimize": "node scripts/optimize-performance.js",
  "perf:benchmark": "node scripts/performance-benchmark.js",
  
  // Combined test suites
  "test:all": "npm run test && npm run integration:api",
  "test:full": "npm run test:all && npm run perf:benchmark"
}
```

## Implementation Steps

1. Move non-Jest test files to scripts/
2. Convert or create proper Jest tests
3. Update package.json scripts
4. Update documentation
5. Test all commands 