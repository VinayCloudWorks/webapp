packer {
  required_plugins {
    amazon = {
      version = ">= 1.0.0"
      source  = "github.com/hashicorp/amazon"
    }
  }
}

####################
# Variable Definitions
####################
variable "aws_region" {
  description = "AWS region where the custom image will be built"
  type        = string
  default     = "us-east-1"
}

variable "source_ami" {
  description = "Ubuntu 24.04 LTS AMI ID for us-east-1"
  type        = string
  default     = "ami-09b4f17f4df57bbf2"
}

variable "instance_type" {
  description = "EC2 Instance type for the build"
  type        = string
  default     = "t2.micro"
}

variable "vpc_id" {
  description = "VPC ID where the instance should be launched"
  type        = string
  default     = "" // Set to empty if not used
}

variable "aws_default_subnet_id" {
  description = "Subnet ID of your default VPC (must be from your DEV account's default VPC)"
  type        = string
  default     = "" # This value will be provided via GitHub Secrets in the workflow.
}

variable "ami_name" {
  description = "Name prefix for the generated AMI"
  type        = string
  default     = "webappAMI"
}

variable "PORT" {
  type        = string
  description = "Port for the application"
}

variable "MYSQL_DATABASE" {
  description = "Name of the MySQL database"
  type        = string
}

variable "MYSQL_ROOT_PASSWORD" {
  description = "MySQL root password"
  type        = string
}

variable "DB_USER" {
  description = "Database user name"
  type        = string
}

variable "DB_HOST" {
  description = "Database host address"
  type        = string
}


variable "DB_DIALECT" {
  type        = string
  description = "Database dialect (e.g., mysql, postgres)"
}

variable "DEV_ACCOUNT_ID" {
  description = "AWS Account ID for DEV"
  type        = string
  default     = "" // Provide your Dev account ID here, or leave empty if using credentials from the Dev account
}

variable "AWS_DEMO_ACCOUNT_ID" {
  description = "AWS Account ID for Demo"
  type        = string
}

####################
# Local Values
####################
locals {
  ami_description = "Image for webapp"
  timestamp       = regex_replace(timestamp(), "[- TZ:]", "")
}

####################
# AWS Builder (Updated with previous logic)
####################
source "amazon-ebs" "ubuntu" {
  region          = var.aws_region
  source_ami      = var.source_ami
  instance_type   = var.instance_type
  ssh_username    = "ubuntu"
  ami_name        = "${var.ami_name}-${local.timestamp}"
  ami_description = local.ami_description
  vpc_id          = var.vpc_id
  subnet_id       = var.aws_default_subnet_id
  ami_users       = [var.AWS_DEMO_ACCOUNT_ID]

  tags = {
    Name        = var.ami_name
    Environment = "Dev"
  }
}

####################
# Build Block & Provisioners
####################
build {
  sources = [
    "source.amazon-ebs.ubuntu",
    "source.googlecompute.ubuntu"
  ]

  # File provisioners to copy the generated artifacts from the workspace
  provisioner "file" {
    source      = "./artifacts/app_artifact.zip"
    destination = "/tmp/app_artifact.zip"
  }

  provisioner "file" {
    source      = "./artifacts/.env"
    destination = "/tmp/.env"
  }

  provisioner "file" {
    source      = "./artifacts/app.service"
    destination = "/tmp/app.service"
  }

  # CloudWatch agent configuration file
  provisioner "file" {
    source      = "./config/amazon-cloudwatch-agent.json"
    destination = "/tmp/amazon-cloudwatch-agent.json"
  }

  provisioner "shell" {
    inline = [
      "# Add environment variables to /etc/environment",
      "echo 'PORT=${var.PORT}' | sudo tee -a /etc/environment",
      "echo 'DB_DIALECT=${var.DB_DIALECT}' | sudo tee -a /etc/environment",

      "# Create directories for environment configuration",
      "sudo mkdir -p /etc/opt/csye6225",
      "sudo mkdir -p /etc/systemd/system/app.service.d/",
      "sudo mkdir -p /opt/aws/amazon-cloudwatch-agent/etc",

      "# Create empty env.conf file to prevent systemd errors",
      "sudo touch /etc/opt/csye6225/env.conf",
      "sudo chmod 644 /etc/opt/csye6225/env.conf",

      "# Create systemd override to use the environment file",
      "sudo tee /etc/systemd/system/app.service.d/override.conf > /dev/null <<EOT",
      "[Service]",
      "EnvironmentFile=/etc/opt/csye6225/env.conf",
      "EOT",

      "# Reload environment variables",
      ". /etc/environment",

      "# Update and upgrade the OS",
      "sudo apt-get update -y",
      "sudo apt-get upgrade -y",

      "# Install Node.js and npm (using NodeSource for Node 18.x)",
      "curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -",
      "sudo apt-get install -y nodejs",

      "# Install AWS CLI and unzip for file operations",
      "sudo apt-get install -y unzip",

      "# Install CloudWatch Agent",
      "wget https://amazoncloudwatch-agent.s3.amazonaws.com/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb -O /tmp/amazon-cloudwatch-agent.deb",
      "sudo dpkg -i /tmp/amazon-cloudwatch-agent.deb",

      "# Copy CloudWatch agent configuration file",
      "sudo cp /tmp/amazon-cloudwatch-agent.json /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json",
      "sudo chmod 644 /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json",

      "# Configure CloudWatch agent to start at boot",
      "sudo systemctl enable amazon-cloudwatch-agent.service",

      "# Create dedicated non-login user 'csye6225'",
      "sudo groupadd csye6225 || true",
      "sudo useradd -g csye6225 -s /usr/sbin/nologin csye6225 || true",

      "# Create application directory",
      "sudo mkdir -p /opt/csye6225",

      "# Copy the application artifact from /tmp into /opt/csye6225",
      "sudo cp /tmp/app_artifact.zip /opt/csye6225/",

      "# Unzip the artifact and remove the zip file",
      "cd /opt/csye6225 && sudo unzip -o app_artifact.zip && sudo rm app_artifact.zip",

      "# Copy the .env file to the application directory",
      "sudo cp /tmp/.env /opt/csye6225/.env",

      "# Install Node.js dependencies (using package.json in /opt/csye6225)",
      "cd /opt/csye6225 && sudo npm install --production",

      "# Install additional packages for file upload functionality",
      "cd /opt/csye6225 && sudo npm install aws-sdk multer uuid",

      "# Install StatsD client for metrics collection",
      "cd /opt/csye6225 && sudo npm install hot-shots winston",

      "# Ensure all application files are owned by 'csye6225'",
      "sudo chown -R csye6225:csye6225 /opt/csye6225",

      "# Set proper permissions (not 777)",
      "sudo chmod -R 755 /opt/csye6225",

      "# Create logs directory with proper permissions",
      "sudo mkdir -p /var/log/webapp",
      "sudo chown csye6225:csye6225 /var/log/webapp",
      "sudo chmod 755 /var/log/webapp",

      "# Copy the systemd service file from /tmp to /etc/systemd/system",
      "sudo cp /tmp/app.service /etc/systemd/system/app.service",

      "# Reload systemd and enable the service to start on boot",
      "sudo systemctl daemon-reload",
      "sudo systemctl enable app.service"
    ]
  }

  post-processor "manifest" {
    output     = "manifest.json"
    strip_path = true
  }
}