// utils.js
const { Sequelize } = require('sequelize');

// Configuration from environment variables
const dbConfig = {
    username: process.env.DB_USER || '',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || '',
    host: process.env.DB_HOST || '',
    dialect: process.env.DB_DIALECT || 'mysql',
    port: process.env.DB_PORT || 3306
};

console.log(`Connecting to database at ${dbConfig.host} with user ${dbConfig.username} and database ${dbConfig.database}`);

// Initialize Sequelize with the configuration
const sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
        host: dbConfig.host,
        port: dbConfig.port,
        dialect: dbConfig.dialect,
        logging: false
    }
);

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
    bucketName
};