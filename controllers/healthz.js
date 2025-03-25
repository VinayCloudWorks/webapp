// controllers/healthzController.js
const HealthCheck = require('../models/healthz');
const logger = require('../utils/logger');
const { trackDbQuery } = require('../utils/metrics');

// Handle GET /healthz
exports.checkHealth = async (req, res) => {
    // Check if the request contains a payload, query params, or route params
    if (
        (req.body && Object.keys(req.body).length > 0) ||
        (req.query && Object.keys(req.query).length > 0) ||
        (req.params && Object.keys(req.params).length > 0)
    ) {
        logger.warn('Health check received with invalid parameters', {
            body: Object.keys(req.body).length > 0,
            query: Object.keys(req.query).length > 0,
            params: Object.keys(req.params).length > 0
        });

        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('X-Content-Type-Options', 'nosniff');
        return res.status(400).send(); // 400 Bad Request
    }

    try {
        // Insert a row into the health_check table with current datetime using tracked DB query
        await trackDbQuery(async () => {
            return await HealthCheck.create({
                datetime: new Date(),
            });
        }, 'healthCheckCreate');

        logger.info('Health check passed successfully');

        // Return 200 OK with no response body
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('X-Content-Type-Options', 'nosniff');
        return res.status(200).send(); // No body
    } catch (error) {
        logger.error('Health check failed', {
            error: error.message,
            stack: error.stack
        });

        // Return 503 Service Unavailable with no response body
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('X-Content-Type-Options', 'nosniff');
        return res.status(503).send(); // No body
    }
};

// Handle unsupported HTTP methods
exports.methodNotAllowed = (req, res) => {
    logger.warn('Health check received unsupported HTTP method', {
        method: req.method
    });

    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('X-Content-Type-Options', 'nosniff');
    return res.status(405).send(); // 405 Method Not Allowed
};