const request = require('supertest');
const app = require('../../server');

describe('Training API Integration', () => {
    let testUserId = 'test-athlete';

    beforeAll(async () => {
        // Create a test user first to satisfy dependencies
        const response = await request(app)
            .post('/api/users')
            .send({
                name: `TestAthlete-${Date.now()}`,
                lastName: 'Athlete',
                gender: 'M',
                age: 30,
                password: 'password123',
                availableDays: ['Monday', 'Wednesday', 'Friday']
            });
        testUserId = response.body.id;
    });

    test('POST /api/training/generate should create a hierarchical plan', async () => {
        const generationData = {
            userId: testUserId,
            goalDistance: 10,
            targetDate: '2026-12-31',
            description: 'Test Training Plan'
        };

        const response = await request(app)
            .post('/api/training/generate')
            .send(generationData);

        expect(response.statusCode).toBe(201);
        expect(response.body.userId).toBe(testUserId);
        expect(response.body.mesociclos.length).toBeGreaterThan(0);
        expect(response.body.mesociclos[0].microciclos.length).toBeGreaterThan(0);

        // Verify nested session structure
        const firstSession = response.body.mesociclos[0].microciclos[0].sessions[0];
        expect(firstSession).toHaveProperty('status', 'planned');
    });

    test('GET /api/users/:id/training-plan should retrieve the plan', async () => {
        const response = await request(app).get(`/api/users/${testUserId}/training-plan`);
        expect(response.statusCode).toBe(200);
        expect(response.body.userId).toBe(testUserId);
    });
});
