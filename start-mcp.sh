#!/bin/bash

# Web3 Data MCP Server Startup Script
# This script handles common environment configuration issues

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo -e "${GREEN}🚀 Web3 Data MCP Server Startup Script${NC}"
echo "======================================"

# Check Node.js installation
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Error: Node.js is not installed${NC}"
    echo "Please install Node.js 16+ from https://nodejs.org"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo -e "${RED}❌ Error: Node.js version must be 16 or higher${NC}"
    echo "Current version: $(node -v)"
    exit 1
fi

echo -e "${GREEN}✓ Node.js version: $(node -v)${NC}"

# Check if we're in the correct directory
if [ ! -f "$SCRIPT_DIR/package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found${NC}"
    echo "Please run this script from the web3-data-mcp directory"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
    echo -e "${YELLOW}⚠️  Dependencies not installed. Installing now...${NC}"
    cd "$SCRIPT_DIR" && npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Error: Failed to install dependencies${NC}"
        exit 1
    fi
fi

# Check for API key
if [ -z "$ROOTDATA_API_KEY" ]; then
    # Try to load from .env file
    if [ -f "$SCRIPT_DIR/.env" ]; then
        echo -e "${YELLOW}Loading environment from .env file...${NC}"
        export $(cat "$SCRIPT_DIR/.env" | grep -v '^#' | xargs)
    fi
    
    # Check again after loading .env
    if [ -z "$ROOTDATA_API_KEY" ]; then
        echo -e "${RED}❌ Error: ROOTDATA_API_KEY not set${NC}"
        echo ""
        echo "Please set your RootData API key using one of these methods:"
        echo ""
        echo "1. Set environment variable:"
        echo "   export ROOTDATA_API_KEY=your-api-key"
        echo ""
        echo "2. Create a .env file:"
        echo "   echo 'ROOTDATA_API_KEY=your-api-key' > $SCRIPT_DIR/.env"
        echo ""
        echo "3. Pass as argument to this script:"
        echo "   ROOTDATA_API_KEY=your-api-key $0"
        echo ""
        echo "Get your API key from: https://rootdata.com"
        exit 1
    fi
fi

echo -e "${GREEN}✓ RootData API key configured${NC}"

# Enable debug mode if requested
if [ "$1" == "--debug" ] || [ "$DEBUG" == "true" ] || [ "$MCP_DEBUG" == "true" ]; then
    export DEBUG=true
    export MCP_DEBUG=true
    echo -e "${YELLOW}🔍 Debug mode enabled${NC}"
fi

# Start the server
echo ""
echo -e "${GREEN}Starting Web3 Data MCP Server...${NC}"
echo "=================================="

cd "$SCRIPT_DIR"
exec node src/index.js "$@"