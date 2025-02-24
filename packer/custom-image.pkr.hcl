packer {
  required_plugins {
    amazon = {
      version = ">= 1.0.0"
      source  = "github.com/hashicorp/amazon"
    }
    googlecompute = {
      version = ">= 1.0.0"
      source  = "github.com/hashicorp/googlecompute"
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

variable "DEV_ACCOUNT_ID" {
  description = "AWS Account ID for DEV"
  type        = string
  default     = "" // Provide your Dev account ID here, or leave empty if using credentials from the Dev account
}

variable "AWS_DEMO_ACCOUNT_ID" {
  description = "AWS Account ID for Demo"
  type        = string
}

variable "gcp_project_id" {
  description = "GCP project ID for building the custom image"
  type        = string
}

variable "gcp_zone" {
  description = "GCP zone where the custom image will be built"
  type        = string
  default     = "us-central1-a"
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
# GCP Builder
####################
source "googlecompute" "ubuntu" {
  project_id      = var.gcp_project_id
  zone            = var.gcp_zone
  machine_type    = "e2-medium"
  source_image    = "ubuntu-2404-noble-amd64-v20250214"
  image_name      = "custom-nodejs-app-{{timestamp}}"
  ssh_username    = "ubuntu"
  service_account = "github-actions-packer@dev-gcp-project-451816.iam.gserviceaccount.com"
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

  provisioner "shell" {
    inline = [
      "# Update and upgrade the OS",
      "sudo apt-get update -y",
      "sudo apt-get upgrade -y",

      "# Install MySQL server",
      "sudo apt-get install -y mysql-server",

      "# Install Node.js and npm (using NodeSource for Node 18.x)",
      "curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -",
      "sudo apt-get install -y nodejs",

      "# Create dedicated non-login user 'csye6225'",
      "sudo groupadd csye6225 || true",
      "sudo useradd -g csye6225 -s /usr/sbin/nologin csye6225 || true",

      "# Create application directory",
      "sudo mkdir -p /opt/csye6225",

      "# Copy the application artifact from /tmp into /opt/csye6225",
      "sudo cp /tmp/app_artifact.zip /opt/csye6225/",

      "# Unzip the artifact and remove the zip file",
      "sudo apt-get install -y unzip",
      "cd /opt/csye6225 && sudo unzip -o app_artifact.zip && sudo rm app_artifact.zip",

      "# Copy the .env file to the application directory",
      "sudo cp /tmp/.env /opt/csye6225/.env",

      "# Install Node.js dependencies (using package.json in /opt/csye6225)",
      "cd /opt/csye6225 && sudo npm install --production",

      "# Ensure all application files are owned by 'csye6225'",
      "sudo chown -R csye6225:csye6225 /opt/csye6225",

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
