// routes/file.js
const express = require('express');
const router = express.Router();
const fileController = require('../controllers/file');
const upload = require('../middleware/upload');
const logger = require('../utils/logger');

// Log route registration during app initialization
logger.info('Registering file routes');

// File upload endpoint - uses multer middleware for multipart processing
router.post('/v1/file', upload, fileController.uploadFile);

// Get file metadata endpoint
router.get('/v1/file/:id', fileController.getFile);

// Delete file endpoint
router.delete('/v1/file/:id', fileController.deleteFile);

// Handle unsupported methods with 405 responses
router.head('/v1/file/:id', fileController.headFile);
router.options('/v1/file/:id', fileController.optionsFile);
router.patch('/v1/file/:id', fileController.patchFile);
router.put('/v1/file/:id', fileController.putFile);

// Also handle routes without ID parameter
router.head('/v1/file', fileController.headFile);
router.options('/v1/file', fileController.optionsFile);
router.patch('/v1/file', fileController.patchFile);
router.put('/v1/file', fileController.putFile);

// Log completion of route registration
logger.info('File routes registered successfully');

module.exports = router;