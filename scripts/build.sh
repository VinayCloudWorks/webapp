#!/bin/bash
# build.sh - Package the Node.js application artifact and prepare the .env and service files.

set -e

echo "Cleaning previous artifact (if any)..."
rm -f /tmp/app_artifact.zip

echo "Installing production dependencies..."
npm install --production

echo "Packaging application artifact..."
# Package all necessary files (adjust as needed).
zip -r /tmp/app_artifact.zip server.js package.json controllers models routes utils.js README.md

echo "Creating .env file..."
cat <<EOF > /tmp/.env
PORT=${PORT}
DB_NAME=${MYSQL_DATABASE}
DB_PASS=${MYSQL_ROOT_PASSWORD}
DB_USER=${DB_USER}
DB_HOST=${DB_HOST}
EOF

echo "Copying systemd service file to /tmp..."
cp deploy/app.service /tmp/app.service

echo "Artifact, .env, and service file have been prepared in /tmp."
