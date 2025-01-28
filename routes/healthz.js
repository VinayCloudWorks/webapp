// routes/healthz.js
const express = require('express');
const router = express.Router();
const healthzController = require('../controllers/healthz');

// Route: GET /healthz
router.get('/healthz', healthzController.checkHealth);

// Handle unsupported methods for /healthz
router.all('/healthz', healthzController.methodNotAllowed);

module.exports = router;


