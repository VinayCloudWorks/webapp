const StatsD = require('hot-shots');
const logger = require('./logger');

// Initialize StatsD client to send metrics to CloudWatch agent
const metrics = new StatsD({
    host: 'localhost',
    port: 8125,
    prefix: 'webapp.',
    errorHandler: (error) => {
        logger.error('StatsD Error', { error: error.message });
    }
});

// Middleware to track API usage
const apiMetrics = (req, res, next) => {
    const startTime = Date.now();
    const path = req.path;
    const method = req.method;
    const routeName = path.replace(/\/:[^/]+/g, '/:param')
        .replace(/^\//, '')
        .replace(/\//g, '_') || 'root';

    // Count API calls
    metrics.increment(`api.${method}.${routeName}.count`);

    // Track original end function
    const originalEnd = res.end;

    // Override end function to capture response time
    res.end = function (...args) {
        const responseTime = Date.now() - startTime;

        // Log request completion
        logger.info(`${method} ${path}`, {
            method,
            path,
            statusCode: res.statusCode,
            responseTime
        });

        // Record API response time
        metrics.timing(`api.${method}.${routeName}.time`, responseTime);

        // Call original end function
        return originalEnd.apply(this, args);
    };

    next();
};

// Track database query execution time
const trackDbQuery = async (queryFunc, queryName) => {
    const startTime = Date.now();
    try {
        const result = await queryFunc();
        const duration = Date.now() - startTime;

        // Record database query time
        metrics.timing(`db.query.${queryName}.time`, duration);

        logger.debug(`Database query ${queryName} completed`, {
            duration,
            success: true
        });

        return result;
    } catch (error) {
        const duration = Date.now() - startTime;

        // Still record timing for failed queries
        metrics.timing(`db.query.${queryName}.time`, duration);

        // Count errors
        metrics.increment(`db.query.${queryName}.error`);

        logger.error(`Database query ${queryName} failed`, {
            duration,
            error: error.message
        });

        throw error;
    }
};

// Track S3 operations execution time
const trackS3Operation = async (s3Func, operationType) => {
    const startTime = Date.now();
    try {
        const result = await s3Func();
        const duration = Date.now() - startTime;

        // Record S3 operation time
        metrics.timing(`s3.operation.${operationType}.time`, duration);

        logger.debug(`S3 operation ${operationType} completed`, {
            duration,
            success: true
        });

        return result;
    } catch (error) {
        const duration = Date.now() - startTime;

        // Still record timing for failed operations
        metrics.timing(`s3.operation.${operationType}.time`, duration);

        // Count errors
        metrics.increment(`s3.operation.${operationType}.error`);

        logger.error(`S3 operation ${operationType} failed`, {
            duration,
            error: error.message,
            stack: error.stack
        });

        throw error;
    }
};

module.exports = {
    metrics,
    apiMetrics,
    trackDbQuery,
    trackS3Operation
};