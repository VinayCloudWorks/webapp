// middleware/upload.js
const multer = require('multer');
const logger = require('../utils/logger');

// Set up multer for file upload handling with memory storage
const storage = multer.memoryStorage();

// Filter to allow only images with logging
const fileFilter = (req, file, cb) => {
    const allowedFileTypes = ['image/jpeg', 'image/jpg', 'image/png'];

    if (allowedFileTypes.includes(file.mimetype)) {
        logger.debug('Valid file type received', {
            fileName: file.originalname,
            mimeType: file.mimetype
        });
        cb(null, true);
    } else {
        logger.warn('Invalid file type rejected', {
            fileName: file.originalname,
            mimeType: file.mimetype,
            allowedTypes: allowedFileTypes
        });
        cb(new Error('Invalid file type. Only JPEG, JPG, and PNG are allowed.'), false);
    }
};

// Create multer instance with error handling
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
}).single('file');

// Wrap multer in a middleware with error handling
const uploadMiddleware = (req, res, next) => {
    upload(req, res, (err) => {
        if (err) {
            // Log the error from multer
            if (err instanceof multer.MulterError) {
                // A multer error occurred
                logger.warn('Multer error', {
                    error: err.message,
                    code: err.code
                });

                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
                }
            } else {
                // Another error occurred
                logger.error('File upload error', {
                    error: err.message
                });
            }
            return res.status(400).json({ error: err.message });
        }

        // Log successful file upload processing
        if (req.file) {
            logger.debug('File processed by multer middleware', {
                fileName: req.file.originalname,
                size: req.file.size,
                mimeType: req.file.mimetype
            });
        }

        next();
    });
};

module.exports = uploadMiddleware;