// jest.setup.js
process.env.DB_USER = 'root';
process.env.DB_PASS = 'vinaysathe'; // Use the same password as your CI MySQL setup
process.env.DB_NAME = 'CLOUD';
process.env.DB_HOST = 'localhost';
process.env.DB_DIALECT = 'mysql';
process.env.S3_BUCKET_NAME = 'test-bucket';
process.env.NODE_ENV = 'test';