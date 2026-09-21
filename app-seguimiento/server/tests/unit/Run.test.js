const Run = require('../../dominio/runs/Run');

describe('Run Entity', () => {
    test('should calculate pace correctly when not provided', () => {
        const run = new Run({
            userId: '1',
            distance: 10,
            duration: 60, // 60 mins / 10 km = 6.00 min/km
            note: 'Morning run'
        });
        expect(run.pace).toBe('6.00');
    });

    test('should default to current date in ISO format if not provided', () => {
        const run = new Run({
            userId: '1',
            distance: 5,
            duration: 30
        });
        expect(run.date).toMatch(/^\d{4}-\d{2}-\d{2}T/); // Check if it's an ISO string
    });

    test('should validate that distance is positive', () => {
        expect(() => {
            new Run({
                userId: '1',
                distance: -5,
                duration: 30
            });
        }).toThrow('La distancia es obligatoria y debe ser un número positivo.');
    });

    test('should preserve provided date', () => {
        const customDate = '2025-01-01T10:00:00.000Z';
        const run = new Run({
            userId: '1',
            distance: 5,
            duration: 30,
            date: customDate
        });
        expect(run.date).toBe(customDate);
    });
});
