// controllers/healthzController.js
const HealthCheck = require('../models/healthz');

// Handle GET /healthz
exports.checkHealth = async (req, res) => {
    // Check if the request contains a payload
    if (req.body && Object.keys(req.body).length > 0) {
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('X-Content-Type-Options', 'nosniff');
        return res.status(400).send(); // 400 Bad Request
    }

    try {
        // Insert a row into the health_check table with current datetime
        await HealthCheck.create({
            datetime: new Date(),
        });

        // Return 200 OK with no response body
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('X-Content-Type-Options', 'nosniff');
        return res.status(200).send(); // No body
    } catch (error) {
        console.error('Failed to insert HealthCheck record:', error);

        // Return 503 Service Unavailable with no response body
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('X-Content-Type-Options', 'nosniff');
        return res.status(503).send(); // No body
    }
};

// Handle unsupported HTTP methods
exports.methodNotAllowed = (req, res) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('X-Content-Type-Options', 'nosniff');
    return res.status(405).send(); // 405 Method Not Allowed with no body
};

