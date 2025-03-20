// routes/file.js
const express = require('express');
const router = express.Router();
const fileController = require('../controllers/file');
const upload = require('../middleware/upload');

// File upload endpoint - uses multer middleware for multipart processing
router.post('/v1/file', validateRequest,  upload.single('file'), fileController.uploadFile);

// Get file metadata endpoint
router.get('/v1/file/:id', validateRequest,  fileController.getFile);

// Delete file endpoint
router.delete('/v1/file/:id', validateRequest, fileController.deleteFile);

// Handle unsupported methods with 405 responses
router.head('/v1/file/:id', validateRequest, fileController.headFile);
router.options('/v1/file/:id', validateRequest, fileController.optionsFile);
router.patch('/v1/file/:id', validateRequest, fileController.patchFile);
router.put('/v1/file/:id', validateRequest, fileController.putFile);

// Also handle routes without ID parameter
router.head('/v1/file', validateRequest, fileController.headFile);
router.options('/v1/file', validateRequest, fileController.optionsFile);
router.patch('/v1/file', validateRequest, fileController.patchFile);
router.put('/v1/file', validateRequest, fileController.putFile);

module.exports = router;