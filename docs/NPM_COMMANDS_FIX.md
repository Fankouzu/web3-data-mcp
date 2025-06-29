# NPM Commands Fix Report

Date: 2025-06-28

## Issues Fixed

### 1. validate:prompts Command
**Problem**: `js-yaml` doesn't support multiple file arguments
```bash
# Before (not working)
"validate:prompts": "js-yaml src/prompts/config/*.yaml"
```

**Solution**: Use `find` with `-exec`
```bash
# After (working)
"validate:prompts": "find src/prompts/config -name '*.yaml' -exec js-yaml {} \\;"
```

### 2. Missing Commands
Added the following missing commands referenced in README:
- `clean:cache` - Removes cache files
- `prompts:stats` - Placeholder for prompt analytics

### 3. Incorrect Command Names
Fixed in both README.md and README.zh-CN.md:
- `npm run check-mcp` → `npm run mcp:check`
- `npm run performance-test` → `npm run test:performance`

## New Scripts Added

### verify:commands
A utility script to verify all npm commands mentioned in README files:
```bash
npm run verify:commands
```

This script:
- Scans all README files for `npm run` commands
- Validates them against package.json
- Suggests corrections for typos
- Lists all available commands

### analyze-prompt-usage.js
Placeholder script for future prompt analytics implementation:
```bash
npm run prompts:stats
```

## Verification Results

All npm commands in README files are now valid:
- ✅ 12 valid commands
- ❌ 0 missing/incorrect commands

## Testing

All fixed commands have been tested and work correctly:
```bash
npm run validate:prompts  # ✅ Validates all YAML files
npm run clean:cache       # ✅ Cleans cache files
npm run prompts:stats     # ✅ Shows placeholder message
npm run mcp:check         # ✅ Checks MCP compatibility
npm run test:performance  # ✅ Runs performance tests
``` 