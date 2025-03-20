// middleware/upload.js
const multer = require('multer');

// Set up multer for file upload handling with memory storage
const storage = multer.memoryStorage();

// Filter to allow only images
const fileFilter = (req, file, cb) => {
    const allowedFileTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowedFileTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, JPG, and PNG are allowed.'), false);
    }
};

const validateRequest = (req, res, next) => {
    if (
        (req.body && Object.keys(req.body).length > 0 && req.method !== 'POST') || // Allow body in POST
        (req.query && Object.keys(req.query).length > 0) ||
        (req.params && Object.keys(req.params).length > 0 && !req.route.path.includes(':id')) // Allow id param where needed
    ) {
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('X-Content-Type-Options', 'nosniff');
        return res.status(400).send(); // 400 Bad Request with no body
    }
    next();
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});

module.exports = {
    upload: upload,
    validateRequest
};