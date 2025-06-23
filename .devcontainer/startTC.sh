#!/bin/bash
set -e

echo "🌐 [1/3] Building Codespace URLs..."
CODESPACE_URL_NEXT=$([ "$CODESPACES" = "true" ] && echo "https://${CODESPACE_NAME}-3000.app.github.dev" || echo "http://localhost:3000")
CODESPACE_URL_TC=$([ "$CODESPACES" = "true" ] && echo "https://${CODESPACE_NAME}-8080.app.github.dev" || echo "http://localhost:8080")

echo "🔄 [2/3] Updating with Codespace URL..."
sed -i "s|http://localhost:3000|${CODESPACE_URL_NEXT}|g" ./tidecloak-demo-realm.json
sed -i "s|http://localhost:3000|${CODESPACE_URL_NEXT}|g" ./app/api/apiConfigs.js
sed -i "s|http://localhost:8080|${CODESPACE_URL_TC}|g" ./app/api/apiConfigs.js
sed -i "s|http://localhost:3000|${CODESPACE_URL_NEXT}|g" ./DevReadMe.md

echo "🐳 [3/3] Pulling and starting Tidecloak container..."
docker pull docker.io/tideorg/tidecloak-dev:0.9.4
if [ "$(docker ps -aq -f name=^tidecloak$)" ]; then
  docker rm tidecloak --force
fi
if [ ! -d "./Uploads" ]; then
  echo "Creating Uploads directory..."
  mkdir ./Uploads
else
  echo "Uploads directory already exists."
fi
docker run -d \
  --name tidecloak \
  -p 8080:8080 \
  -v .:/opt/keycloak/data/h2 \
  -v ./Uploads:/opt/keycloak/Uploads \
  -e KC_HOSTNAME=${CODESPACE_URL_TC} \
  -e KC_BOOTSTRAP_ADMIN_USERNAME=admin \
  -e KC_BOOTSTRAP_ADMIN_PASSWORD=password \
  tideorg/tidecloak-dev:0.9.4

if [ -d ".next" ]; then
  echo "Removing previous .next directory..."
  sudo rm -rf .next
  if ! [ -d ".next" ]; then echo "Deleted!"; else echo "Failed to delete .next directory!"; fi
fi
# echo "{}" > data/tidecloak.json <-- Uncomment if you want to reset the Tidecloak data

echo ""
echo "✅ Tidecloak Setup complete. You can close this terminal or continue below."
echo ""
