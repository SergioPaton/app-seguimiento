const TrainingPlan = require('../../dominio/training/TrainingPlan');
const Mesociclo = require('../../dominio/training/Mesociclo');
const Microciclo = require('../../dominio/training/Microciclo');
const PlannedSession = require('../../dominio/training/PlannedSession');

describe('TrainingPlan Deep Reconstitution', () => {
    test('should reconstitute nested entities correctly from plain objects', () => {
        const rawData = {
            id: 'plan-1',
            userId: 'user-1',
            goal: { distance: 10, targetPace: '5:00', description: 'Test Goal' },
            startDate: '2026-01-01T00:00:00.000Z',
            endDate: '2026-03-01T00:00:00.000Z',
            mesociclos: [
                {
                    type: 'Base',
                    microciclos: [
                        {
                            weekNumber: 1,
                            startDate: '2026-01-05',
                            sessions: [
                                {
                                    id: 's1',
                                    day: 'Monday',
                                    type: 'Easy Run',
                                    targetDistance: 5,
                                    status: 'planned'
                                }
                            ]
                        }
                    ]
                }
            ]
        };

        const plan = new TrainingPlan(rawData);

        expect(plan.mesociclos[0]).toBeInstanceOf(Mesociclo);
        expect(plan.mesociclos[0].microciclos[0]).toBeInstanceOf(Microciclo);
        expect(plan.mesociclos[0].microciclos[0].sessions[0]).toBeInstanceOf(PlannedSession);

        // Verify method availability
        expect(typeof plan.mesociclos[0].microciclos[0].sessions[0].complete).toBe('function');
    });
});
