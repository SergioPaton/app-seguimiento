/**
 * Calculadora lógica para ritmos de entrenamiento personalizados.
 */
class PaceCalculator {
    calculateZones(userPBs = {}, level = 'intermediate') {
        const userPBsObj = userPBs || {};
        const referenceTime = userPBsObj['5k'] || userPBsObj['10k'];
        const distance = userPBsObj['5k'] ? 5 : 10;

        if (!referenceTime) {
            if (level === 'advanced') {
                return {
                    z1: '5:30',
                    z2: '5:00',
                    z3: '4:30',
                    z4: '4:00',
                    z5: '3:30'
                };
            } else if (level === 'intermediate') {
                return {
                    z1: '6:30',
                    z2: '6:00',
                    z3: '5:15',
                    z4: '4:45',
                    z5: '4:15'
                };
            } else {
                return {
                    z1: '7:30',
                    z2: '7:00',
                    z3: '6:15',
                    z4: '5:45',
                    z5: '5:15'
                };
            }
        }

        const totalSeconds = this.timeToSeconds(referenceTime);
        const secondPerKm = totalSeconds / distance;

        return {
            z1: this.secondsToTime(secondPerKm * 1.22),
            z2: this.secondsToTime(secondPerKm * 1.14),
            z3: this.secondsToTime(secondPerKm * 1.05),
            z4: this.secondsToTime(secondPerKm * 0.96),
            z5: this.secondsToTime(secondPerKm * 0.86)
        };
    }

    timeToSeconds(timeStr) {
        if (!timeStr) return 0;
        const parts = timeStr.split(':').map(Number);
        if (parts.length === 2) {
            return (parts[0] * 60) + parts[1];
        }
        return parts[0] * 60;
    }

    secondsToTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.round(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    }
}

module.exports = PaceCalculator;
