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

echo "🐳 [3/3] Pulling and starting Tidecloak container..."
docker pull docker.io/tideorg/tidecloak-dev:latest
if [ "$(docker ps -aq -f name=^tidecloak$)" ]; then
  docker rm tidecloak --force
fi
docker run -d \
  --name tidecloak \
  -p 8080:8080 \
  -v .:/opt/keycloak/data/h2 \
  -e KC_HOSTNAME=${CODESPACE_URL_TC} \
  -e KC_BOOTSTRAP_ADMIN_USERNAME=admin \
  -e KC_BOOTSTRAP_ADMIN_PASSWORD=password \
  tideorg/tidecloak-dev:latest

echo "📦 Installing Node.js dependencies..."
npm install

echo "🏗️ Resetting previous instances..."
if [ -d ".next" ]; then
  echo "Removing existing .next directory..."
  sudo rm -rf .next
  if ! [ -d ".next" ]; then echo "Deleted!"; else echo "Failed to delete .next directory!"; fi
fi
# echo "{}" > data/tidecloak.json <-- Uncomment if you want to reset the Tidecloak data

echo "🏗️ Building Playground app..."
#npm run build

echo ""
echo "✅ Tidecloak Setup complete. You can close this terminal or continue below."
echo ""
