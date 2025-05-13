#!/bin/bash
set -e

echo "🔧 [0/5] Installing required dependencies (OpenSSL)..."
sudo apt-get update
sudo apt-get install -y libssl-dev


echo "🚀 [1/5] Cloning the Tidecloak Next.js client..."
git clone https://github.com/tide-foundation/tidecloak-client-nextJS.git

echo "📦 [2/5] Installing dependencies..."
cd tidecloak-client-nextJS
npm install
cd ..

echo "🌐 [3/5] Building Codespace URLs..."
CODESPACE_URL_NEXT="https://${CODESPACE_NAME}-3000.app.github.dev"
CODESPACE_URL_TC="https://${CODESPACE_NAME}-8080.app.github.dev"

echo "🔄 [4/5] Updating with Codespace URL..."
sed -i "s|http://localhost:3000|${CODESPACE_URL_NEXT}|g" ../test-realm.json
sed -i "s|http://localhost:3000|${CODESPACE_URL_NEXT}|g" ../app/api/apiConfigs.js
sed -i "s|http://localhost:8080|${CODESPACE_URL_TC}|g" ../app/api/apiConfigs.js

echo "🐳 [5/5] Pulling and starting Tidecloak container..."
docker pull docker.io/tideorg/tidecloak-dev:latest
docker run -d \
  --name tidecloak \
  -p 8080:8080 \
  -e KC_HOSTNAME=${CODESPACE_URL_TC} \
  -e KC_BOOTSTRAP_ADMIN_USERNAME=admin \
  -e KC_BOOTSTRAP_ADMIN_PASSWORD=password \
  tideorg/tidecloak-dev:latest
  
echo ""
echo "✅ Tidecloak Setup complete. You can close this terminal or continue below."
echo ""