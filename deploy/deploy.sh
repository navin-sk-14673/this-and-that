#!/bin/bash
set -e

# Load deployment config
ENV_FILE="$(dirname "$0")/.env.deploy"
if [ ! -f "$ENV_FILE" ]; then
	echo "✗ Missing $ENV_FILE — copy .env.deploy.example and fill in values."
	exit 1
fi
source "$ENV_FILE"

# 1. Build the static export
echo "▶ Building production bundle..."
PUPPETEER_TIMEOUT=60000 npm run lyte:build:prod

# 2. Ensure remote directory exists
echo "▶ Ensuring remote directory exists..."
sshpass -p "${DEPLOY_PASS}" ssh -o StrictHostKeyChecking=no "${DEPLOY_USER}@${DEPLOY_HOST}" "mkdir -p ~/${DEPLOY_PATH}"

# 3. Deploy to VM
echo "▶ Deploying to VM..."
sshpass -p "${DEPLOY_PASS}" rsync -avz --delete --exclude='.htaccess' -e 'ssh -o StrictHostKeyChecking=no' dist/prod/ "${DEPLOY_USER}@${DEPLOY_HOST}:~/${DEPLOY_PATH}/" 2>&1 | tail -10

echo "✓ Deploy complete."
