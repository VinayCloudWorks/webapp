// controllers/file.js
const { v4: uuidv4 } = require('uuid');
const File = require('../models/file');
const { s3, bucketName } = require('../utils');
const logger = require('../utils/logger');
const { trackDbQuery, trackS3Operation } = require('../utils/metrics');

// Set security headers
const setSecurityHeaders = (res) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('X-Content-Type-Options', 'nosniff');
};

//Handler for unsupported HTTP methods
exports.methodNotAllowed = (req, res) => {
    setSecurityHeaders(res);
    logger.info('Method not allowed request', { path: req.path, method: req.method });
    res.status(405).send();
};

exports.uploadFile = async (req, res) => {
    setSecurityHeaders(res);
    logger.info('File upload request received', { contentType: req.get('Content-Type') });

    // Check for query parameters
    if (req.query && Object.keys(req.query).length > 0) {
        logger.warn('Upload file request rejected - query parameters provided', { query: req.query });
        return res.status(400).send();
    }

    try {
        // Check if file was uploaded
        if (!req.file) {
            logger.warn('Upload file request rejected - no file uploaded');
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
        
        // Track S3 upload operation with metrics
        const s3Result = await trackS3Operation(async () => {
            return await s3.upload(uploadParams).promise();
        }, 'uploadFile');
        
        // Track database operation with metrics
        const file = await trackDbQuery(async () => {
            return await File.create({
                file_name: req.file.originalname,
                url: s3Key,
                upload_date: new Date()
            });
        }, 'createFileRecord');
        
        logger.info('File uploaded successfully', { 
            fileId: file.id, 
            fileName: file.file_name, 
            s3Key: s3Key 
        });
        
        res.status(201).json({
            "message": "File Added",
            file_name: file.file_name,
            id: file.id,
            url: file.url,
            upload_date: file.upload_date
        });
    } catch (error) {
        logger.error('Error uploading file:', { 
            error: error.message, 
            stack: error.stack,
            fileName: req.file ? req.file.originalname : 'unknown'
        });
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getFile = async (req, res) => {
    setSecurityHeaders(res);
    logger.info('Get file request received', { fileId: req.params.id });

    // Check for body and query params
    if (
        (req.body && Object.keys(req.body).length > 0) ||
        (req.query && Object.keys(req.query).length > 0)
    ) {
        logger.warn('Get file request rejected - body or query parameters provided', { 
            bodySize: Object.keys(req.body || {}).length,
            querySize: Object.keys(req.query || {}).length
        });
        return res.status(400).send();
    }

    try {
        const fileId = req.params.id;
        
        // Retrieve the file record from database with metrics tracking
        const file = await trackDbQuery(async () => {
            return await File.findOne({ where: { id: fileId } });
        }, 'findFileById');
        
        if (!file) {
            logger.warn('File not found', { fileId });
            return res.status(400).json({ error: 'Bad request: File not found' });
        }
        
        logger.info('File metadata retrieved successfully', { fileId: file.id, fileName: file.file_name });
        
        // Return file metadata, not the actual file
        res.status(200).json({
            file_name: file.file_name,
            id: file.id,
            url: file.url,
            upload_date: file.upload_date,
        });
    } catch (error) {
        logger.error('Error getting file:', { 
            error: error.message, 
            stack: error.stack,
            fileId: req.params.id
        });
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.deleteFile = async (req, res) => {
    setSecurityHeaders(res);
    logger.info('Delete file request received', { fileId: req.params.id });

    // Check for body and query params
    if (
        (req.body && Object.keys(req.body).length > 0) ||
        (req.query && Object.keys(req.query).length > 0)
    ) {
        logger.warn('Delete file request rejected - body or query parameters provided', { 
            bodySize: Object.keys(req.body || {}).length,
            querySize: Object.keys(req.query || {}).length
        });
        return res.status(400).send();
    }

    try {
        const fileId = req.params.id;
        
        // Retrieve the file record with metrics tracking
        const file = await trackDbQuery(async () => {
            return await File.findOne({ where: { id: fileId } });
        }, 'findFileForDelete');
        
        if (!file) {
            logger.warn('File not found for deletion', { fileId });
            return res.status(400).json({ error: 'Bad request: File not found' });
        }
        
        // Delete from S3 bucket with metrics tracking
        const deleteParams = {
            Bucket: bucketName,
            Key: file.url
        };
        
        await trackS3Operation(async () => {
            return await s3.deleteObject(deleteParams).promise();
        }, 'deleteFile');
        
        // Delete record from database with metrics tracking
        await trackDbQuery(async () => {
            return await file.destroy();
        }, 'deleteFileRecord');
        
        logger.info('File deleted successfully', { fileId: file.id, fileName: file.file_name, s3Key: file.url });
        
        // No content response on successful deletion
        res.status(204).end();
    } catch (error) {
        logger.error('Error deleting file:', { 
            error: error.message, 
            stack: error.stack,
            fileId: req.params.id
        });
        res.status(500).json({ error: 'Internal server error' });
    }
};

//405 Method Not Allowed handlers for unsupported methods
exports.headFile = exports.methodNotAllowed;
exports.optionsFile = exports.methodNotAllowed;
exports.patchFile = exports.methodNotAllowed;
exports.putFile = exports.methodNotAllowed;