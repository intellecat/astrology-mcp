#!/bin/bash

# Test the Astrology MCP Server with MCP Inspector
# Run with: ./test-with-inspector.sh

echo "🚀 Starting MCP Inspector for Astrology MCP Server"
# ... (lines omitted)
echo "   - astrology_calculate_natal_chart"
echo "   - astrology_get_coordinates"
echo "3. Try the test cases below"
echo ""
echo "Starting inspector..."
echo ""

npx @modelcontextprotocol/inspector node dist/index.js
