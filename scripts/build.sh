#!/bin/bash
# build.sh - Package the Node.js application artifact and prepare the .env and service files.

set -e

echo "Cleaning previous artifacts (if any)..."
rm -rf artifacts
mkdir -p artifacts

echo "Installing production dependencies..."
npm install --production

echo "Packaging application artifact..."
# Package all files and directories in the repo into a zip
# Exclude the artifacts folder and .git directory.
zip -r artifacts/app_artifact.zip . -x "artifacts/*" -x ".git/*"

echo "Creating .env file..."
cat <<EOF > artifacts/.env
PORT=${PORT}
DB_NAME=${MYSQL_DATABASE}
DB_PASS=${MYSQL_ROOT_PASSWORD}
DB_USER=${DB_USER}
DB_HOST=__DB_HOST_PLACEHOLDER__
DB_DIALECT=${DB_DIALECT}
EOF

echo "Copying systemd service file to artifacts..."
cp deploy/app.service artifacts/app.service

echo "Artifact, .env, and service file have been prepared in the artifacts folder."
