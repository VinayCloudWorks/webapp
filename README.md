- This repository demonstrates how to build custom machine images for a Node.js web application using Packer on both AWS and GCP. The images include all necessary dependencies—such as MySQL, Node.js, and systemd service configurations—so that the application can run seamlessly once deployed.
- Uses Ubuntu 24.04 LTS as the source image (verify that ami-09b4f17f4df57bbf2 is Ubuntu 24.04 LTS).
- Builds images in both AWS and GCP in parallel.
- Configures images with a local MySQL installation and application dependencies.

**Continuous Integration**

- Packer Status Check Workflow

- Packer AMI Build Workflow.
- Builds the custom image on the DEV account and shares it with the DEMO account.
- Uses variable-driven configurations with no hard-coded credentials.

* * * * *

**Prerequisites**
-----------------

### **For Building and Running Locally**

- **Operating System:** Ubuntu 24.04 LTS (both locally and on the DigitalOcean droplet)
- **Node.js:** v16.x or later
- **MySQL:** Installed on the server
- **DigitalOcean Droplet:** Running Ubuntu 24.04 LTS
- **Git & SSH:** For repository management and server acces
    -   Create a `.env` file in the root directory with the following:

        env

        CopyEdit

        `DB_HOST=
        DB_USER=
        DB_PASS=
        DB_NAME=
        PORT=`

* * * * *

**Setup and Deployment**
------------------------

### **1\. Creating a Droplet on DigitalOcean**

### **\. Uploading the Application.zip & Shell Script separately**

bash

CopyEdit

`scp -i ~/.ssh/<SSH_KEY><Files_to_upload> root@<IP_address_Droplet>:/root/`

### **2\. Opening the console from Terminal**

bash

CopyEdit

`ssh -i ~/.ssh/<SSH_KEY> root@<IP_address_Droplet>`

* * * * *

### **3\. Run the source.env file**

bash

CopyEdit

`source ~/source.env`

### **4\. Making the script executable**

bash

CopyEdit

`chmod +x <script_filename>.sh`

### **5\. Running the script**

bash

CopyEdit

`./<script_filename>.sh`



sudo apt install -y mysql-client
mysql --version
mysql -h YOUR_RDS_ENDPOINT -u YOUR_DB_USER -p
sudo systemctl status app.service
sudo journalctl -u app.service
sudo systemctl status amazon-cloudwatch-agent
sudo cat /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json