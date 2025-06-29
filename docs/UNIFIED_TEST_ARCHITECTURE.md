# Unified Test Architecture

Date: 2025-06-28

## Overview

This document describes the unified testing architecture for the Web3 Data MCP project, resolving conflicts and establishing clear conventions.

## Test Categories

### 1. Jest Tests (tests/*.js)
These files use Jest framework with `describe`, `it`, and `expect`:
- **Purpose**: Unit tests, integration tests with mocks, test coverage
- **Location**: `tests/` directory
- **Running**: Use `jest` command

### 2. Integration Scripts (scripts/*-test.js)
Standalone Node.js scripts for real API interactions:
- **Purpose**: Real API calls, manual testing, debugging
- **Location**: `scripts/` directory  
- **Running**: Use `node` command

### 3. Performance Scripts (scripts/perf-*.js)
Performance and stress testing scripts:
- **Purpose**: Benchmarking, stress testing, optimization
- **Location**: `scripts/` directory
- **Running**: Use `node` command

## Command Structure

### Jest Test Commands
```bash
npm test                 # Run all Jest tests
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests (Jest)
npm run test:performance # Performance tests (Jest)
npm run test:memory      # Memory tests (Jest)
npm run test:coverage    # With coverage report
npm run test:watch       # Watch mode
```

### Script Commands
```bash
npm run integration:quick    # Quick integration check
npm run integration:project  # Test project details
npm run integration:api      # API integration placeholder
npm run perf:stress         # Stress testing
npm run perf:optimize       # Performance optimization
```

### Utility Commands
```bash
npm run test:info          # Show test architecture info
npm run test:all           # Run Jest tests + quick check
npm run verify:commands    # Verify all npm commands
```

## Migration Guide

### Before (Mixed Approach)
```json
"test:performance": "node tests/performance-test.js"  // Wrong!
"test:memory": "node --max-old-space-size=256 tests/memory-test.js"  // Wrong!
```

### After (Unified Approach)
```json
"test:performance": "jest tests/performance-test.js"  // Correct!
"test:memory": "jest tests/memory-test.js"  // Correct!
```

## Best Practices

### 1. File Naming
- Jest tests: `test-*.js` in `tests/`
- Scripts: `*-test.js` or descriptive names in `scripts/`

### 2. When to Use What
- **Jest Tests**: 
  - Unit testing with mocks
  - Testing internal logic
  - Code coverage requirements
  - CI/CD pipeline tests

- **Scripts**:
  - Real API testing
  - Performance benchmarking
  - Manual debugging
  - One-time operations

### 3. Error Handling
- Jest tests should use `expect().toThrow()`
- Scripts should use try/catch with console.error

### 4. Environment Variables
- Jest tests: Use `.env.test` or mock
- Scripts: Use actual `.env` file

## Common Issues Fixed

### Issue 1: "describe is not defined"
**Cause**: Running Jest test files with `node` instead of `jest`
**Fix**: Use appropriate test commands

### Issue 2: Memory limits
**Old**: `node --max-old-space-size=256 tests/memory-test.js`
**New**: Configure in Jest config if needed

### Issue 3: Conflicting commands
**Old**: Both `test:api` and `test:integration` for same purpose
**New**: Clear separation between Jest and script tests

## Quick Reference

```bash
# Run all tests
npm test

# Check what tests are available
npm run test:info

# Run specific test type
npm run test:unit
npm run test:performance

# Run scripts
npm run integration:quick
npm run perf:stress

# Get help
npm run help
```

## Future Improvements

1. Add `jest.config.js` for better configuration
2. Separate test suites in different directories
3. Add test result reporting
4. Implement test data fixtures
5. Add E2E testing capabilities 