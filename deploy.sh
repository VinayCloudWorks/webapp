#!/bin/bash

# Check that required environment variables are set
for var in DB_NAME DB_USER DB_PASS DB_HOST DB_DIALECT; do
  if [ -z "${!var}" ]; then
    echo "Error: $var is not set. Please source the source.env file before running this script."
    exit 1
  fi
done

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
sudo mysql -e "CREATE DATABASE ${DB_NAME};"
sudo mysql -e "CREATE USER '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';"
sudo mysql -e "GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';"
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

echo "Copying provided environment file to the app directory..."
if [ -f ~/source.env ]; then
    sudo cp ~/source.env /opt/csye6225/webapp/.env
else
    echo "Error: source.env file not found in your home directory. Please ensure it was uploaded."
    exit 1
fi

# Optional: Load the environment variables from the copied file.
# This step is useful if you want to ensure that these variables are available in the shell
# even if your Node.js app uses a package like dotenv to load them.
echo "Loading environment variables from the copied file..."
set -a
source /opt/csye6225/webapp/.env
set +a

echo "Installing app dependencies (npm install)..."
cd /opt/csye6225/webapp
npm install

echo "Starting the Node server..."
node server.js

echo "Setup completed successfully!"
