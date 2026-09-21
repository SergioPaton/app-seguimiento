const request = require('supertest');
const app = require('../../server');

describe('Runs API Integration', () => {
    let testUserId = 'test-runner';

    beforeAll(async () => {
        const response = await request(app)
            .post('/api/users')
            .send({
                name: `TestRunsAPI-${Date.now()}`,
                lastName: 'Runner',
                gender: 'M',
                age: 30,
                password: 'password123'
            });
        testUserId = response.body.id;
    });
    beforeAll(() => {
        // Set environment or mock repository to use test database if possible
        // For simplicity in this demo, we'll just test against the existing API
        // but normally we would point the repository to a test file.
    });

    test('GET /api/runs should return an array', async () => {
        const response = await request(app).get('/api/runs');
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });

    test('POST /api/runs should create a new run with ISO date', async () => {
        const runData = {
            userId: testUserId,
            distance: 10,
            duration: 50,
            note: 'Integration Test Run'
        };

        const response = await request(app)
            .post('/api/runs')
            .send(runData);

        expect(response.statusCode).toBe(201);
        expect(response.body.distance).toBe(10);
        expect(response.body.date).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
});
