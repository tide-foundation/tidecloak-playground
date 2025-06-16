#!/bin/bash
set -e

echo "🔧 [0/3] Installing required dependencies (OpenSSL)..."
sudo apt-get update
sudo apt-get install -y libssl-dev

sudo cp .env.overrides .env

echo "📦 Installing Node.js dependencies..."
npm install

echo "🏗️ Building Playground app..."
#npm run build

echo ""
echo "✅ Prequisits Setup complete. You can close this terminal or continue below."
echo ""
