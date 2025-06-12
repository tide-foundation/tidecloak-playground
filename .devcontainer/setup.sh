#!/bin/bash
set -e

echo "🔧 [0/3] Installing required dependencies (OpenSSL)..."
sudo apt-get update
sudo apt-get install -y libssl-dev

sudo cp .env.overrides .env

echo "🌐 [1/3] Building Codespace URLs..."
CODESPACE_URL_NEXT=$([ "$CODESPACES" = "true" ] && echo "https://${CODESPACE_NAME}-3000.app.github.dev" || echo "http://localhost:3000")
CODESPACE_URL_TC=$([ "$CODESPACES" = "true" ] && echo "https://${CODESPACE_NAME}-8080.app.github.dev" || echo "http://localhost:8080")

echo "🔄 [2/3] Updating with Codespace URL..."
sed -i "s|http://localhost:3000|${CODESPACE_URL_NEXT}|g" ./test-realm.json
sed -i "s|http://localhost:3000|${CODESPACE_URL_NEXT}|g" ./app/api/apiConfigs.js
sed -i "s|http://localhost:8080|${CODESPACE_URL_TC}|g" ./app/api/apiConfigs.js
sed -i "s|http://localhost:3000|${CODESPACE_URL_NEXT}|g" ./DevReadMe.md

echo "📦 Installing Node.js dependencies..."
npm install

echo "🏗️ Building Playground app..."
#npm run build

echo ""
echo "✅ Prequisits Setup complete. You can close this terminal or continue below."
echo ""
