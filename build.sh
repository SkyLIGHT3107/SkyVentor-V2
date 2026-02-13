#!/bin/bash

echo "🚀 SkyVentor V2 Build Script"
echo "============================"
echo ""

# Check if wails is installed
if ! command -v wails &> /dev/null
then
    echo "❌ Wails CLI not found!"
    echo "Please install it with: go install github.com/wailsapp/wails/v2/cmd/wails@latest"
    exit 1
fi

# Check if node is installed
if ! command -v node &> /dev/null
then
    echo "❌ Node.js not found!"
    echo "Please install Node.js 18 or higher"
    exit 1
fi

echo "✓ Prerequisites check passed"
echo ""

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..
echo "✓ Frontend dependencies installed"
echo ""

# Ask user what to do
echo "What would you like to do?"
echo "1) Run in development mode (wails dev)"
echo "2) Build for production (wails build)"
echo "3) Exit"
echo ""
read -p "Enter choice [1-3]: " choice

case $choice in
    1)
        echo ""
        echo "🔧 Starting development server..."
        wails dev
        ;;
    2)
        echo ""
        echo "🏗️  Building for production..."
        wails build
        echo ""
        echo "✓ Build complete! Binary is in ./build/bin/"
        ;;
    3)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac
