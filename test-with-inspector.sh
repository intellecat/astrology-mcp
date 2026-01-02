#!/bin/bash

# Test the Astro MCP Server with MCP Inspector
# This script launches the MCP Inspector to test the server

echo "🚀 Starting MCP Inspector for Astro MCP Server"
echo "=============================================="
echo ""
echo "Server path: $(pwd)/dist/index.js"
echo ""
echo "Once the inspector opens in your browser:"
echo "1. Click 'Connect' to connect to the server"
echo "2. You should see 2 tools listed:"
echo "   - astro_calculate_natal_chart"
echo "   - astro_get_coordinates"
echo "3. Try the test cases below"
echo ""
echo "Starting inspector..."
echo ""

npx @modelcontextprotocol/inspector node dist/index.js
