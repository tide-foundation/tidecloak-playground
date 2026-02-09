#!/bin/bash
set -e

echo "🔄 Resetting TideCloak and reinitializing..."

# Step 1: Stop and remove the current container
echo "1. Stopping TideCloak container..."
docker rm tidecloak --force 2>/dev/null || echo "Container already stopped"

# Step 2: Remove the old client configuration
echo "2. Removing old tidecloak.json..."
rm -f data/tidecloak.json

# Step 3: Remove h2 database files (if they exist)
echo "3. Cleaning up h2 database files..."
rm -f keycloak*.db 2>/dev/null || echo "No database files to clean"
rm -f *.mv.db 2>/dev/null || echo "No .mv.db files to clean"
rm -f *.trace.db 2>/dev/null || echo "No .trace.db files to clean"

# Step 4: Start TideCloak with correct settings
echo "4. Starting TideCloak with new settings..."
./.devcontainer/startTC.sh

echo ""
echo "✅ Reset complete! Now restart your Next.js app to reinitialize."
echo "   The app will automatically create the realm with correct URLs."
echo ""
