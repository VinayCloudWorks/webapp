// server.js
const express = require('express');
const { sequelize } = require('./utils');
const healthzRoute = require('./routes/healthz');
const fileRoutes = require('./routes/file');

const app = express();
app.use(express.json());

// Routes
app.use('/', healthzRoute);
app.use('/', fileRoutes);

// Skip auto-sync when running tests
if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'integration') {
    (async () => {
        try {
            await sequelize.sync({ alter: true });
            console.log('Database synced successfully.');
        } catch (error) {
            console.error('Error syncing database:', error);
        }
    })();
}

if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

module.exports = app;