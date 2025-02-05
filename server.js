// server.js
const express = require('express');
const { sequelize } = require('./utils');
const healthzRoute = require('./routes/healthz');

const app = express();

app.use(express.json());
app.use('/', healthzRoute);

// Skip auto-sync when running tests (or integration tests) so that test files control syncing.
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
    const PORT = 3000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

module.exports = app;


