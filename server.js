// server.js
require('dotenv').config();
const express = require('express');
const { sequelize } = require('./utils');
const healthzRoute = require('./routes/healthz');
const fileRoutes = require('./routes/file');
const logger = require('./utils/logger');
const { apiMetrics, trackDbQuery } = require('./utils/metrics');

const app = express();

// Apply metrics middleware for all API requests
app.use(apiMetrics);

app.use(express.json());

// Routes
app.use('/', healthzRoute);
app.use('/', fileRoutes);

// Skip auto-sync when running tests
if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'integration') {
    (async () => {
        try {
            // Wrap database sync with trackDbQuery for metrics
            await trackDbQuery(async () => {
                return await sequelize.sync({ alter: true });
            }, 'databaseSync');

            logger.info('Database synced successfully.');
        } catch (error) {
            logger.error('Error syncing database:', { error: error.message, stack: error.stack });
        }
    })();
}

// Add error handling middleware
app.use((err, req, res, next) => {
    logger.error('Express error handler caught error', {
        path: req.path,
        method: req.method,
        error: err.message,
        stack: err.stack
    });

    res.status(500).json({ error: 'Internal server error' });
});

if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        logger.info(`Server is running on port ${PORT}`);
    });
}

module.exports = app;