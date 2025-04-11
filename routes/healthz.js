// routes/healthz.js
const express = require('express');
const router = express.Router();
const healthzController = require('../controllers/healthz');
const logger = require('../utils/logger');

// Log route registration during app initialization
logger.info('Registering healthz routes');

// Route: GET /healthz
router.get('/healthz', healthzController.checkHealth);

// Add the new /cicd route that uses the same controller function
//router.get('/cicd', healthzController.checkHealth);

// Handle unsupported methods for /healthz
router.all('/healthz', healthzController.methodNotAllowed);

// Handle unsupported methods for /cicd
//router.all('/cicd', healthzController.methodNotAllowed);

// Log completion of route registration
logger.info('Healthz routes registered successfully');

module.exports = router;