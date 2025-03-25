const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
);

// Determine log directory based on environment
const getLogDirectory = () => {
    // Use a different directory for tests to avoid permission issues
    if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'integration') {
        const testLogDir = path.join(__dirname, '..', 'test-logs');

        // Create test log directory if it doesn't exist
        if (!fs.existsSync(testLogDir)) {
            try {
                fs.mkdirSync(testLogDir, { recursive: true });
            } catch (err) {
                console.error('Error creating test log directory', err);
            }
        }

        return testLogDir;
    }

    // For production, use the standard directory
    return '/var/log/webapp';
};

const logDirectory = getLogDirectory();

// Create the logger instance
const logger = winston.createLogger({
    level: 'info',
    format: logFormat,
    defaultMeta: { service: 'webapp' },
    transports: [
        // Write all logs to the application.log file
        new winston.transports.File({
            filename: path.join(logDirectory, 'application.log')
        }),
        // Write error logs to error.log file
        new winston.transports.File({
            level: 'error',
            filename: path.join(logDirectory, 'error.log')
        }),
        // Console output for development and testing
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});

// Log uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', {
        error: error.message,
        stack: error.stack
    });
});

// Log unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', {
        reason: reason instanceof Error ? reason.message : reason,
        stack: reason instanceof Error ? reason.stack : null
    });
});

module.exports = logger;