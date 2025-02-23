- Set up AWS Organizations and configure IAM policies and users.
- Automate server setup on Ubuntu 24.04 LTS using a shell script.
- Validate the health check API through an automated test suite.
- Deploy the application on a DigitalOcean droplet.

**Continuous Integration**

- This project uses GitHub Actions to run tests on every pull request:

- The workflow file located at .github/workflows/ci.yml installs dependencies and runs the test suite.
- Pull requests cannot be merged until the CI checks pass.
- Branch protection rules enforce that only pull requests with successful CI runs are merged.

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

Test 7