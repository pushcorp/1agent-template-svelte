#!/usr/bin/env bash
# snapshot-prepare.sh
#
# Run this script BEFORE creating a Daytona snapshot to minimize
# the snapshot size and ensure a clean, ready-to-use environment.
#
# Usage:
#   bash .devcontainer/scripts/snapshot-prepare.sh
#
# What it does:
#   1. Installs npm dependencies (if not already installed)
#   2. Runs svelte-kit sync (generates types)
#   3. Cleans up caches and temporary files to reduce snapshot size

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$PROJECT_ROOT"

echo "=== Snapshot Prepare: Starting ==="

# Step 1: Install dependencies
if [ ! -d "node_modules" ]; then
  echo "[1/4] Installing npm dependencies..."
  npm install
else
  echo "[1/4] node_modules exists, running npm ci for clean install..."
  npm ci
fi

# Step 2: Run svelte-kit sync to generate types
echo "[2/4] Running svelte-kit sync..."
npm run prepare

# Step 3: Clean npm cache to reduce snapshot size
echo "[3/4] Cleaning npm cache..."
npm cache clean --force

# Step 4: Remove unnecessary files
echo "[4/4] Cleaning up temporary files..."

# Remove npm logs
rm -f "$PROJECT_ROOT"/.npm/_logs/*.log 2>/dev/null || true
rm -f "$HOME"/.npm/_logs/*.log 2>/dev/null || true

# Remove TypeScript build info
rm -f "$PROJECT_ROOT"/tsconfig.tsbuildinfo 2>/dev/null || true

# Remove Vite temp files
rm -rf "$PROJECT_ROOT"/node_modules/.vite 2>/dev/null || true

# Remove build output (dev snapshot should not include production build)
rm -rf "$PROJECT_ROOT"/build 2>/dev/null || true

echo ""
echo "=== Snapshot Prepare: Complete ==="
echo ""
echo "Summary:"
echo "  - Dependencies installed: $([ -d node_modules ] && echo 'Yes' || echo 'No')"
echo "  - .svelte-kit generated:  $([ -d .svelte-kit ] && echo 'Yes' || echo 'No')"
echo "  - npm cache cleaned:      Yes"
echo ""
du -sh "$PROJECT_ROOT"/node_modules 2>/dev/null | awk '{print "  - node_modules size:      " $1}' || true
du -sh "$PROJECT_ROOT" 2>/dev/null | awk '{print "  - Total project size:     " $1}' || true
echo ""
echo "Ready to create Daytona snapshot!"
