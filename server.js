// server.js
const express = require('express');
const { sequelize } = require('./utils');
const healthzRoute = require('./routes/healthz');

// Create the Express app
const app = express();

// Middleware to parse JSON if needed (for other routes)
app.use(express.json());

// Attach the /healthz route to the app
app.use('/', healthzRoute);

// Sync (auto-create/alter) the DB tables on server startup
(async () => {
    try {
        await sequelize.sync({ alter: true });
        // 'alter: true' tries to update existing table(s) to match the model
        console.log('Database synced successfully.');
    } catch (error) {
        console.error('Error syncing database:', error);
    }
})();

// Start the server on port 3000
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
