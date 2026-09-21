const request = require('supertest');
const app = require('../../server');
const fs = require('fs');
const path = require('path');

describe('Cascade Deletion', () => {
    const trainingFile = path.join(__dirname, '../../data/training_plans.json');
    const runsFile = path.join(__dirname, '../../data/runs.json');

    test('should delete runs and training plans when a user is deleted', async () => {
        // 1. Create User
        const userRes = await request(app)
            .post('/api/users')
            .send({ name: `Cascade-${Date.now()}`, lastName: 'Test', gender: 'M', age: 25, password: 'password123' });
        const userId = userRes.body.id;

        // 2. Create Training Plan for that user
        const trainRes = await request(app)
            .post('/api/training/generate')
            .send({ userId, goalDistance: 10, targetDate: '2026-12-31' });
        expect(trainRes.statusCode).toBe(201);

        // 3. Create a Run for that user
        await request(app)
            .post('/api/runs')
            .send({ userId, distance: 5, duration: 1500, date: '2025-01-01' });

        // Verify they exist in files
        let trainingPlans = JSON.parse(fs.readFileSync(trainingFile, 'utf8'));
        let runs = JSON.parse(fs.readFileSync(runsFile, 'utf8'));

        expect(trainingPlans.some(p => p.userId === userId)).toBe(true);
        expect(runs.some(r => r.userId === userId)).toBe(true);

        // 4. Delete User
        const deleteRes = await request(app).delete(`/api/users/${userId}`);
        expect(deleteRes.statusCode).toBe(200);

        // 5. Verify Cascade Deletion
        trainingPlans = JSON.parse(fs.readFileSync(trainingFile, 'utf8'));
        runs = JSON.parse(fs.readFileSync(runsFile, 'utf8'));

        expect(trainingPlans.some(p => p.userId === userId)).toBe(false);
        expect(runs.some(r => r.userId === userId)).toBe(false);
    });
});
