#!/bin/bash

echo "Updating package lists..."
sudo apt-get -y update

echo "Setting up non-interactive frontend for apt..."
export DEBIAN_FRONTEND=noninteractive

echo "Upgrading packages..."
sudo apt-get -y upgrade

echo "Installing MySQL server..."
sudo apt-get install -y mysql-server

echo "Starting and enabling MySQL..."
sudo systemctl start mysql
sudo systemctl enable mysql

echo "Creating database and dedicated MySQL user..."
sudo mysql -e "CREATE DATABASE cloud;"
sudo mysql -e "CREATE USER 'clouduser'@'localhost' IDENTIFIED BY 'cloudpass';"
sudo mysql -e "GRANT ALL PRIVILEGES ON cloud.* TO 'clouduser'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

echo "Creating Linux group..."
if ! getent group "cloudg" >/dev/null; then
  sudo groupadd "cloudg"
else
  echo "Group 'cloudg' already exists. Skipping group creation."
fi

echo "Creating Linux user..."
if id "vinay" &>/dev/null; then
  echo "User 'vinay' already exists. Skipping user creation."
else
  sudo useradd -m -g "cloudg" "vinay"
fi

echo "Creating /opt/csye6225 directory..."
sudo mkdir -p /opt/csye6225

echo "Installing unzip (if not installed)..."
sudo apt-get install -y unzip

echo "Unzipping application into /opt/csye6225..."
sudo unzip -o webapp.zip -d /opt/csye6225

echo "Installing Node.js and npm..."
sudo apt-get install -y nodejs npm

echo "Updating folder permissions..."
sudo chown -R vinay:cloudg /opt/csye6225
sudo chmod -R 775 /opt/csye6225

echo "Creating .env file in the app root directory (as root/sudo user)..."
cat > /opt/csye6225/webapp/.env <<EOF
DB_NAME=cloud
DB_USER=clouduser
DB_PASS=cloudpass
DB_HOST=localhost
DB_DIALECT=mysql
EOF

echo "Installing app dependencies (npm install)..."
cd /opt/csye6225/webapp
npm install

echo "Starting the Node server..."
node server.js

echo "Setup completed successfully!"
