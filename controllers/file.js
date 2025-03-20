// controllers/file.js
const { v4: uuidv4 } = require('uuid');
const File = require('../models/file');
const { s3, bucketName } = require('../utils');

// Set security headers
const setSecurityHeaders = (res) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('X-Content-Type-Options', 'nosniff');
};

//Handler for unsupported HTTP methods
exports.methodNotAllowed = (req, res) => {
    setSecurityHeaders(res);
    res.status(405).send();
};

exports.uploadFile = async (req, res) => {
    setSecurityHeaders(res);

    // Check for query parameters
    if (req.query && Object.keys(req.query).length > 0) {
        return res.status(400).send();
    }

    try {
        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        // Generate a unique file name for S3
        const fileExtension = req.file.originalname.split('.').pop();
        const fileName = `${uuidv4()}.${fileExtension}`;
        const s3Key = `files/${fileName}`;
        // Upload to S3 using IAM role authentication
        const uploadParams = {
            Bucket: bucketName,
            Key: s3Key,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
            Metadata: {
                'Content-Type': req.file.mimetype,
                'Original-Name': req.file.originalname,
                'Upload-Date': new Date().toISOString()
            }
        };
        // This will work both in production and test environment now
        const s3Result = await s3.upload(uploadParams).promise();
        // Create file record in database
        const file = await File.create({
            file_name: req.file.originalname,
            url: s3Key,
            upload_date: new Date()
        });
        res.status(201).json({
            "message": "File Added",
            file_name: file.file_name,
            id: file.id,
            url: file.url,
            upload_date: file.upload_date
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getFile = async (req, res) => {
    setSecurityHeaders(res);

    // Check for body and query params
    if (
        (req.body && Object.keys(req.body).length > 0) ||
        (req.query && Object.keys(req.query).length > 0)
    ) {
        return res.status(400).send();
    }

    try {
        const fileId = req.params.id;
        // Retrieve the file record from database
        const file = await File.findOne({ where: { id: fileId } });
        if (!file) {
            return res.status(400).json({ error: 'Bad request: File not found' });
        }
        // Return file metadata, not the actual file
        res.status(200).json({
            url: file.url,
        });
    } catch (error) {
        console.error('Error getting file:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.deleteFile = async (req, res) => {
    setSecurityHeaders(res);

    // Check for body and query params
    if (
        (req.body && Object.keys(req.body).length > 0) ||
        (req.query && Object.keys(req.query).length > 0)
    ) {
        return res.status(400).send();
    }

    try {
        const fileId = req.params.id;
        // Retrieve the file record
        const file = await File.findOne({ where: { id: fileId } });
        if (!file) {
            return res.status(400).json({ error: 'Bad request: File not found' });
        }
        // Delete from S3 bucket
        const deleteParams = {
            Bucket: bucketName,
            Key: file.url
        };
        // This will work both in production and test environment now
        await s3.deleteObject(deleteParams).promise();
        // Delete record from database
        await file.destroy();
        // No content response on successful deletion
        res.status(204).end();
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

//405 Method Not Allowed handlers for unsupported methods
exports.headFile = exports.methodNotAllowed;
exports.optionsFile = exports.methodNotAllowed;
exports.patchFile = exports.methodNotAllowed;
exports.putFile = exports.methodNotAllowed;