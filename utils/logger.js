const winston = require('winston');

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
);

// Create the logger instance
const logger = winston.createLogger({
    level: 'info',
    format: logFormat,
    defaultMeta: { service: 'webapp' },
    transports: [
        // Write all logs to the application.log file
        new winston.transports.File({
            filename: '/var/log/webapp/application.log'
        }),
        // Write error logs to error.log file
        new winston.transports.File({
            level: 'error',
            filename: '/var/log/webapp/error.log'
        }),
        // Console output for development
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