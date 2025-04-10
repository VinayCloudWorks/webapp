// server.js
require('dotenv').config();
const express = require('express');
const { sequelize } = require('./utils');
const healthzRoute = require('./routes/healthz');
const fileRoutes = require('./routes/file');
const logger = require('./utils/logger');
const { apiMetrics, trackDbQuery } = require('./utils/metrics');

// Log environment variables for debugging (excluding sensitive information)
const logEnv = () => {
    const safeEnv = { ...process.env };
    ['DB_PASS', 'DB_PASSWORD', 'MYSQL_PASSWORD', 'MYSQL_ROOT_PASSWORD'].forEach(key => {
        if (safeEnv[key]) safeEnv[key] = '********';
    });

    logger.info('Application starting with environment variables:', {
        DB_HOST: safeEnv.DB_HOST,
        DB_NAME: safeEnv.DB_NAME,
        DB_USER: safeEnv.DB_USER,
        PORT: safeEnv.PORT,
        NODE_ENV: safeEnv.NODE_ENV,
        S3_BUCKET_NAME: safeEnv.S3_BUCKET_NAME
    });
};

// Log environment information at startup
logEnv();

const app = express();

// Apply metrics middleware for all API requests
app.use(apiMetrics);
app.use(express.json());

// Routes
app.use('/', healthzRoute);
app.use('/', fileRoutes);

// Initialize database connection with retry logic
const initializeDatabase = async () => {
    if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'integration') {
        logger.info('Skipping database sync in test/integration environment');
        return;
    }

    const maxRetries = 5;
    let retryCount = 0;
    let connected = false;

    while (!connected && retryCount < maxRetries) {
        try {
            logger.info(`Database connection attempt ${retryCount + 1}/${maxRetries}`);

            // Wrap database sync with trackDbQuery for metrics
            await trackDbQuery(async () => {
                // Test connection first
                await sequelize.authenticate();
                // Then sync
                return await sequelize.sync({ alter: true });
            }, 'databaseSync');

            logger.info('Database synced successfully.');
            connected = true;
        } catch (error) {
            retryCount++;
            const waitTime = Math.min(1000 * Math.pow(2, retryCount), 30000); // Exponential backoff with max 30s

            logger.error('Error syncing database:', {
                error: error.message,
                stack: error.stack,
                attempt: retryCount,
                maxRetries,
                waitTime
            });

            if (retryCount < maxRetries) {
                logger.info(`Retrying database connection in ${waitTime}ms...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            } else {
                logger.error('Maximum database connection retries reached. Starting server anyway.');
            }
        }
    }
};

// Add error handling middleware
app.use((err, req, res, next) => {
    logger.error('Express error handler caught error', {
        path: req.path,
        method: req.method,
        error: err.message,
        stack: err.stack
    });
    res.status(500).json({ error: 'Internal server error' });
});

// Start server function
const startServer = () => {
    const PORT = process.env.PORT || 3000;
    return app.listen(PORT, () => {
        logger.info(`Server is running on port ${PORT}`);
        logger.info(`Database host: ${process.env.DB_HOST || 'not set'}`);
    });
};

// Only start the server if this file is run directly
if (require.main === module) {
    // Initialize database but don't block server startup
    initializeDatabase().finally(() => {
        startServer();
    });
}

module.exports = app;