// utils.js
const { Sequelize } = require('sequelize');

// Add debug logging for environment variables
console.log('Environment variables for database connection:');
console.log(`DB_HOST: ${process.env.DB_HOST || 'not set'}`);
console.log(`DB_USER: ${process.env.DB_USER || 'not set'}`);
console.log(`DB_NAME: ${process.env.DB_NAME || 'not set'}`);
console.log(`DB_DIALECT: ${process.env.DB_DIALECT || 'not set'}`);
console.log(`DB_PORT: ${process.env.DB_PORT || 'not set'}`);
console.log(`S3_BUCKET_NAME: ${process.env.S3_BUCKET_NAME || 'not set'}`);

// Configuration from environment variables
const dbConfig = {
    username: process.env.DB_USER || '',
    password: process.env.DB_PASS || process.env.DB_PASSWORD || '',  // Support both env var names
    database: process.env.DB_NAME || '',
    host: process.env.DB_HOST || '',
    dialect: process.env.DB_DIALECT || 'mysql',
    port: process.env.DB_PORT || 3306
};

console.log(`Connecting to database at ${dbConfig.host} with user ${dbConfig.username} and database ${dbConfig.database}`);

// Initialize Sequelize with the configuration and retry logic
const sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
        host: dbConfig.host,
        port: dbConfig.port,
        dialect: dbConfig.dialect,
        logging: false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        // Add retry logic for better resilience
        retry: {
            max: 10,
            match: [
                "SequelizeConnectionError",
                "SequelizeConnectionRefusedError",
                "EAI_AGAIN",
                "ETIMEDOUT",
                "ENOTFOUND"
            ],
            backoffBase: 1000,
            backoffExponent: 1.5
        }
    }
);

// Function to test database connection
const testDatabaseConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');
        return true;
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        return false;
    }
};

// Get bucket name from environment (with fallback)
const bucketName = process.env.S3_BUCKET_NAME || 'test-bucket-name';

// Initialize S3 client
let s3;

// Check if we're in test mode or missing bucket name
if (process.env.NODE_ENV === 'test') {
    // In test mode, create a mock S3 object
    s3 = {
        upload: () => ({
            promise: () => Promise.resolve({ Location: `https://${bucketName}/test-file.jpg` })
        }),
        deleteObject: () => ({
            promise: () => Promise.resolve({})
        })
    };
    console.log('Using mock S3 for testing');
} else {
    // In production mode, use the real AWS SDK
    const AWS = require('aws-sdk');
    s3 = new AWS.S3();
    console.log(`Using S3 bucket: ${bucketName}`);
}

module.exports = {
    sequelize,
    s3,
    bucketName,
    testDatabaseConnection
};