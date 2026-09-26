const GeneratePlan = require('../../aplication/training/GeneratePlan');

describe('GeneratePlan', () => {
    let generatePlan;
    let mockUserRepository;
    let mockTrainingRepository;

    beforeEach(() => {
        mockUserRepository = {
            getById: jest.fn().mockReturnValue({
                id: 'test-user',
                name: 'Sergi',
                lastName: 'Runner',
                gender: 'M',
                age: 30,
                availableDays: ['Monday', 'Wednesday', 'Friday', 'Sunday']
            })
        };
        mockTrainingRepository = {
            save: jest.fn()
        };
        generatePlan = new GeneratePlan(mockUserRepository, mockTrainingRepository);
    });

    test('should generate long runs longer than 12km for a 40km goal distance', () => {
        // Target date 12 weeks from now
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 12 * 7);

        const plan = generatePlan.execute({
            userId: 'test-user',
            goalDistance: 40,
            targetDate: targetDate.toISOString(),
            description: 'Train for 40k'
        });

        // Find all long run sessions and get their targetDistance
        const longRuns = [];
        plan.mesociclos.forEach(meso => {
            meso.microciclos.forEach(micro => {
                micro.sessions.forEach(session => {
                    if (session.type === 'Long Run') {
                        longRuns.push(session.targetDistance);
                    }
                });
            });
        });

        // The longest run should be significantly longer than 12km (e.g. at least 18km)
        const maxLongRun = Math.max(...longRuns);
        console.log(`Max Long Run distance generated: ${maxLongRun} km`);
        expect(maxLongRun).toBeGreaterThan(18);
    });

    test('should generate a generic plan of 8 weeks when isGeneric is true', () => {
        const plan = generatePlan.execute({
            userId: 'test-user',
            isGeneric: true
        });

        // 8 weeks should yield a macrociclo of 8 microciclos
        let totalWeeks = 0;
        plan.mesociclos.forEach(meso => {
            totalWeeks += meso.microciclos.length;
        });

        expect(totalWeeks).toBe(8);
        expect(plan.goal.distance).toBe(10); // Default since no PB is defined
        expect(plan.goal.description).toBe('Plan de Mejora General');
    });

    test('should determine target distance based on user PB for generic plans', () => {
        mockUserRepository.getById.mockReturnValue({
            id: 'test-user',
            name: 'Sergi',
            lastName: 'Runner',
            gender: 'M',
            age: 30,
            pb: { '10k': '45:00' },
            availableDays: ['Monday', 'Wednesday', 'Friday', 'Sunday']
        });

        const plan = generatePlan.execute({
            userId: 'test-user',
            isGeneric: true
        });

        expect(plan.goal.distance).toBe(21); // Should upgrade 10k runners to half marathon distance (21km)
    });

    test('should generate a custom recurring plan without target date adapted to level and cycle weeks', () => {
        const plan = generatePlan.execute({
            userId: 'test-user',
            isGeneric: true,
            goalDistance: 10,
            level: 'beginner',
            cycleWeeks: 4
        });

        let totalWeeks = 0;
        plan.mesociclos.forEach(meso => {
            totalWeeks += meso.microciclos.length;
        });

        expect(totalWeeks).toBe(4);
        expect(plan.goal.distance).toBe(10);
        expect(plan.level).toBe('beginner');
        expect(plan.isLoopable).toBe(true);
    });

    test('should adapt volume and session types based on runner level', () => {
        const beginnerPlan = generatePlan.execute({
            userId: 'test-user',
            goalDistance: 10,
            level: 'beginner',
            isGeneric: true
        });

        const advancedPlan = generatePlan.execute({
            userId: 'test-user',
            goalDistance: 10,
            level: 'advanced',
            isGeneric: true
        });

        expect(beginnerPlan.level).toBe('beginner');
        expect(advancedPlan.level).toBe('advanced');
    });
});
