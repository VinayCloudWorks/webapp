**Assignment 01**
====================

Thisassignment implements a simple Node.js and Express API to perform a health check (`/healthz`). The API is designed to:

-   Insert a record into a MySQL database (`health_check` table) with the current UTC datetime.
-   Ensure proper error handling and status codes for various scenarios.

* * * * *

**Prerequisites**
-----------------

### **For Building and Running Locally**

1.  **Node.js**: Version 14.x or higher
2.  **MySQL**: Version 5.7 or higher
3.  **Git**: Installed and configured
4.  **Environment Variables**:
    -   Create a `.env` file in the root directory with the following:

        env

        CopyEdit

        `DB_HOST=localhost
        DB_USER=root
        DB_PASS=yourpassword
        DB_NAME=webappdb
        PORT=3000`

* * * * *

**Setup and Deployment**
------------------------

### **1\. Clone the Repository**

bash

CopyEdit

`git clone https://github.com/VinaySathe-NEU/webapp.git
cd <webapp>`

### **\. Install Dependencies**

bash

CopyEdit

`npm install mysql2 sequelize express`

### **\. Start the Application**

bash

CopyEdit

`node server.js`

* * * * *

**API Usage**
-------------

### **Endpoint: `/healthz`**

1.  **GET /healthz**

    -   Inserts a record into the database and returns:
        -   `200 OK` if successful.
        -   `503 Service Unavailable` if the database is down.
2.  **Invalid Requests**

    -   Payload in the request body → `400 Bad Request`
    -   Unsupported HTTP methods → `405 Method Not Allowed`