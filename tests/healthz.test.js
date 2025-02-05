// tests/healthz.test.js

const request = require('supertest');
const app = require('../server');
const HealthCheck = require('../models/healthz'); // Adjust the file name if needed
const { sequelize } = require('../utils');

describe('Health Check API (Real DB Connection)', () => {
    // Sync the database and clear the health_check table before tests
    beforeAll(async () => {
        // Force-sync: drops tables and recreates them.
        await sequelize.sync({ force: true });
    });

    // Clean the health_check table before each test.
    beforeEach(async () => {
        await HealthCheck.destroy({ where: {} });
    });

    // Close the Sequelize connection after all tests finish.
    afterAll(async () => {
        await sequelize.close();
    });

    test('GET /healthz with no payload should insert a record and return 200', async () => {
        // Get record count before request
        const countBefore = await HealthCheck.count();

        // Make the request with no payload
        const res = await request(app)
            .get('/healthz')
            .send();

        expect(res.statusCode).toBe(200);
        expect(res.headers['cache-control']).toBe('no-cache, no-store, must-revalidate');
        expect(res.headers['pragma']).toBe('no-cache');
        expect(res.headers['x-content-type-options']).toBe('nosniff');
        expect(res.text).toBe('');

        // Verify a new record was inserted
        const countAfter = await HealthCheck.count();
        expect(countAfter).toBe(countBefore + 1);
    });

    test('GET /healthz with payload returns 400 and does not insert a record', async () => {
        // Get record count before request
        const countBefore = await HealthCheck.count();

        // Make the request with a payload
        const res = await request(app)
            .get('/healthz')
            .send({ some: 'data' });

        expect(res.statusCode).toBe(400);
        expect(res.headers['cache-control']).toBe('no-cache, no-store, must-revalidate');
        expect(res.headers['pragma']).toBe('no-cache');
        expect(res.headers['x-content-type-options']).toBe('nosniff');
        expect(res.text).toBe('');

        // Verify no new record was inserted
        const countAfter = await HealthCheck.count();
        expect(countAfter).toBe(countBefore);
    });

    test('Unsupported HTTP methods (POST) return 405', async () => {
        const res = await request(app)
            .post('/healthz')
            .send();

        expect(res.statusCode).toBe(405);
        expect(res.headers['cache-control']).toBe('no-cache, no-store, must-revalidate');
        expect(res.headers['pragma']).toBe('no-cache');
        expect(res.headers['x-content-type-options']).toBe('nosniff');
        expect(res.text).toBe('');
    });
});

