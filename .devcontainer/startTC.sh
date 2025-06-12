#!/bin/bash
set -e

CODESPACE_URL_NEXT=$([ "$CODESPACES" = "true" ] && echo "https://${CODESPACE_NAME}-3000.app.github.dev" || echo "http://localhost:3000")
CODESPACE_URL_TC=$([ "$CODESPACES" = "true" ] && echo "https://${CODESPACE_NAME}-8080.app.github.dev" || echo "http://localhost:8080")

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

if [ -d ".next" ]; then
  echo "Removing previous .next directory..."
  sudo rm -rf .next
  if ! [ -d ".next" ]; then echo "Deleted!"; else echo "Failed to delete .next directory!"; fi
fi
# echo "{}" > data/tidecloak.json <-- Uncomment if you want to reset the Tidecloak data

echo ""
echo "✅ Tidecloak Setup complete. You can close this terminal or continue below."
echo ""
