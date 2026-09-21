const WorkoutLibrary = require('../../dominio/training/engine/WorkoutLibrary');

describe('WorkoutLibrary', () => {
    const library = new WorkoutLibrary();
    const zones = { z1: '6:30', z2: '6:00', z3: '5:30', z4: '5:00', z5: '4:30' };

    test('should return a Strength session template', () => {
        const template = library.getWorkoutTemplate('Strength', zones, 10);
        expect(template.type).toBe('Strength');
        expect(template.targetDistance).toBe(0);
        expect(template.description).toContain('Fortalecimiento');
    });

    test('should return an Incremental session with two blocks', () => {
        const template = library.getWorkoutTemplate('Incremental', zones, 10);
        expect(template.type).toBe('Incremental Run');
        expect(template.description).toContain('6.0km suave');
        expect(template.description).toContain('4.0km alegre');
        expect(template.targetPace).toBe(zones.z3);
    });

    test('should return an Intervals session with specific pace', () => {
        const template = library.getWorkoutTemplate('Intervals', zones, 10);
        expect(template.type).toBe('Intervals');
        expect(template.description).toContain('5x1000m');
        expect(template.targetPace).toBe(zones.z4);
    });

    test('should return an Easy run as default', () => {
        const template = library.getWorkoutTemplate('Unknown', zones, 10);
        expect(template.type).toBe('Easy Run');
        expect(template.targetPace).toBe(zones.z1);
    });

    test('should return a Tempo session', () => {
        const template = library.getWorkoutTemplate('Tempo', zones, 10);
        expect(template.type).toBe('Tempo Run');
        expect(template.description).toContain('ritmo umbral continuo');
        expect(template.targetPace).toBe(zones.z3);
    });

    test('should return a Hills session', () => {
        const template = library.getWorkoutTemplate('Hills', zones, 10);
        expect(template.type).toBe('Hill Repeats');
        expect(template.description).toContain('subida explosiva');
        expect(template.targetPace).toBe(zones.z5);
    });

    test('should return a Progression session', () => {
        const template = library.getWorkoutTemplate('Progression', zones, 12);
        expect(template.type).toBe('Progression Run');
        expect(template.description).toContain('4km suave');
        expect(template.targetPace).toBe(zones.z3);
    });

    test('should return a Recovery session', () => {
        const template = library.getWorkoutTemplate('Recovery', zones, 6);
        expect(template.type).toBe('Recovery Run');
        expect(template.description).toContain('regenerativa muy suave');
        expect(template.targetPace).toBe(zones.z1);
    });
});
