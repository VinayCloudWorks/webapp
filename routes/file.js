// routes/file.js
const express = require('express');
const router = express.Router();
const fileController = require('../controllers/file');
const upload = require('../middleware/upload');

// File upload endpoint - uses multer middleware for multipart processing
router.post('/v1/file', upload.single('file'), fileController.uploadFile);

// Get file metadata endpoint
router.get('/v1/file/:id', fileController.getFile);

// Delete file endpoint
router.delete('/v1/file/:id', fileController.deleteFile);

module.exports = router;