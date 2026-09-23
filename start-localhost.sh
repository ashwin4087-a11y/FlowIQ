#!/bin/bash
# FlowIQ Localhost Starter Script

echo "🚀 Starting FlowIQ Localhost..."
echo ""

# Navigate to project
cd "c:\Users\USER\Downloads\FlowIQ" || {
  echo "❌ Directory not found!"
  exit 1
}

echo "✅ Directory: $(pwd)"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  pnpm install
  echo ""
fi

# Start dev server
echo "🔥 Starting dev server..."
echo ""
echo "================================================"
echo "  FlowIQ is running at:"
echo ""
echo "  🌐 http://localhost:5173"
echo ""
echo "  🗺️  Routes: http://localhost:5173/flowiq-enhanced-routes.html"
echo ""
echo "================================================"
echo ""
echo "Press Ctrl+C to stop"
echo ""

pnpm dev
