require('dotenv').config(); // Load environment variables from .env

const { Sequelize } = require('sequelize');

// Use environment variables for database configuration
const sequelize = new Sequelize(
    process.env.DB_NAME,  // Database name
    process.env.DB_USER,  // Database username
    process.env.DB_PASS,  // Database password
    {
        host: process.env.DB_HOST,  // Database host
        dialect: process.env.DB_DIALECT,  // Dialect (e.g., mysql)
        logging: false, // Disable SQL query logging
    }
);

// Test database connection
sequelize.authenticate()
    .then(() => console.log('Connected to MySQL successfully.'))
    .catch((error) => console.error('Unable to connect to MySQL:', error));

module.exports = { sequelize };
