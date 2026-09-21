const PaceCalculator = require('../../dominio/training/engine/PaceCalculator');

describe('PaceCalculator', () => {
    const calculator = new PaceCalculator();

    test('should return default paces if no PB is provided', () => {
        const zones = calculator.calculateZones({});
        expect(zones.z1).toBe('6:30');
        expect(zones.z2).toBe('6:00');
    });

    test('should calculate zones correctly for a 20:00 5k PB', () => {
        // 20:00 / 5 = 4:00 min/km = 240 seconds
        // Z2 (1.14) = 240 * 1.14 = 273.6 seconds = 4:34 min/km
        const zones = calculator.calculateZones({ '5k': '20:00' });
        expect(zones.z2).toBe('4:34');
        expect(zones.z4).toBe('3:50'); // 240 * 0.96 = 230.4 -> 3:50
    });

    test('should calculate zones correctly for a 40:00 10k PB', () => {
        // 40:00 / 10 = 4:00 min/km
        const zones = calculator.calculateZones({ '10k': '40:00' });
        expect(zones.z2).toBe('4:34');
    });

    test('should pad seconds with leading zero', () => {
        // 25:00 / 5 = 5:00 min/km = 300 seconds
        // Z3 (1.05) = 300 * 1.05 = 315 seconds = 5:15
        const zones = calculator.calculateZones({ '5k': '25:00' });
        expect(zones.z3).toBe('5:15');
    });
});
