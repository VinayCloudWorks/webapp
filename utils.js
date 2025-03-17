// utils.js
const { Sequelize } = require('sequelize');
const AWS = require('aws-sdk');

// Configuration from environment variables set by user data in EC2
const dbConfig = {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT || 'mysql',
    port: process.env.DB_PORT || 3306
};

// S3 bucket name from environment variable set by user data
const bucketName = process.env.S3_BUCKET_NAME;

console.log(`Connecting to database at ${dbConfig.host}`);
console.log(`Using S3 bucket: ${bucketName}`);

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

// AWS S3 Configuration - using IAM role attached to EC2 (no credentials needed)
const s3 = new AWS.S3();

module.exports = {
    sequelize,
    s3,
    bucketName
};