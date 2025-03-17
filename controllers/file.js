// controllers/file.js
const { v4: uuidv4 } = require('uuid');
const File = require('../models/file');
const { s3, bucketName } = require('../utils');

exports.uploadFile = async (req, res) => {
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

        const s3Result = await s3.upload(uploadParams).promise();

        // Create file record in database
        const file = await File.create({
            file_name: req.file.originalname,
            s3_bucket_path: s3Key,
            date_created: new Date()
        });

        res.status(201).json({
            file_id: file.file_id,
            file_name: file.file_name,
            s3_bucket_path: file.s3_bucket_path,
            date_created: file.date_created
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getFile = async (req, res) => {
    try {
        const fileId = req.params.id;

        // Retrieve the file record from database
        const file = await File.findOne({ where: { file_id: fileId } });
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Return file metadata, not the actual file
        res.status(200).json({
            file_id: file.file_id,
            file_name: file.file_name,
            s3_bucket_path: file.s3_bucket_path,
            date_created: file.date_created
        });
    } catch (error) {
        console.error('Error getting file:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.deleteFile = async (req, res) => {
    try {
        const fileId = req.params.id;

        // Retrieve the file record
        const file = await File.findOne({ where: { file_id: fileId } });
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Delete from S3 bucket using IAM role authentication
        const deleteParams = {
            Bucket: bucketName,
            Key: file.s3_bucket_path
        };

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