const ProgressionManager = require('../../dominio/training/engine/ProgressionManager');

describe('ProgressionManager', () => {
    const manager = new ProgressionManager();

    test('should apply 10% rule in General Base phase', () => {
        const nextVolume = manager.calculateNextVolume(100, 1, 'General Base');
        expect(nextVolume).toBe(110);
    });

    test('should apply recovery week (15% reduction) every 4th week', () => {
        const nextVolume = manager.calculateNextVolume(100, 4, 'General Base');
        expect(nextVolume).toBe(85);
    });

    test('should apply 5% growth in Specific phase', () => {
        const nextVolume = manager.calculateNextVolume(100, 1, 'Specific Preparation');
        expect(nextVolume).toBe(105);
    });

    test('should apply 30% reduction in Tapering phase', () => {
        const nextVolume = manager.calculateNextVolume(100, 1, 'Tapering');
        expect(nextVolume).toBe(70);
    });

    test('should handle decimal volume and round to 2 digits', () => {
        const nextVolume = manager.calculateNextVolume(20, 1, 'General Base');
        expect(nextVolume).toBe(22.00);
    });
});
