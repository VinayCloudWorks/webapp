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

variable "gcp_project_id" {
  description = "GCP project ID for building the custom image"
  type        = string
}

variable "gcp_zone" {
  description = "GCP zone where the custom image will be built"
  type        = string
  default     = "us-central1-a"
}

variable "aws_default_subnet_id" {
  description = "Subnet ID of your default VPC (must be from your DEV account's default VPC)"
  type        = string
  default     = ""  # This value will be provided via GitHub Secrets in the workflow.
}

####################
# AWS Builder
####################
source "amazon-ebs" "ubuntu" {
  region = var.aws_region
  
  source_ami_filter {
    filters = {
      name                = "ubuntu/images/hvm-ssd/ubuntu-24.04-amd64-server-*"
      root-device-type    = "ebs"
      virtualization-type = "hvm"
    }
    owners      = ["099720109477"]
    most_recent = true
  }
  
  instance_type               = "t2.micro"
  ssh_username                = "ubuntu"
  ami_name                    = "custom-nodejs-app-{{timestamp}}"
  associate_public_ip_address = true
  
  # Ensure the build instance runs in your default VPC by providing the subnet ID.
  subnet_id = var.aws_default_subnet_id != "" ? var.aws_default_subnet_id : null
}

####################
# GCP Builder
####################
source "googlecompute" "ubuntu" {
  project_id          = var.gcp_project_id
  zone                = var.gcp_zone
  machine_type        = "e2-medium"
  source_image_family = "ubuntu-2404-lts"
  image_name          = "custom-nodejs-app-{{timestamp}}"
  ssh_username        = "ubuntu"
}

####################
# Build Block & Provisioners
####################
build {
  sources = [
    "source.amazon-ebs.ubuntu",
    "source.googlecompute.ubuntu"
  ]

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
