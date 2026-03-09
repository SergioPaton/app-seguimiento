/**
 * Logic to calculate personalized training paces.
 * Placeholder for future implementation.
 */
class PaceCalculator {
    /**
     * Calculates training zones based on a reference PB (e.g., 5k).
     * @param {Object} userPBs - e.g., { "5k": "20:00", "10k": "42:00" }
     * @returns {Object} Paces for different intensity zones in "MM:SS" format.
     */
    calculateZones(userPBs) {
        // Use 10k as secondary or 5k as primary reference
        const referenceTime = userPBs['5k'] || userPBs['10k'];
        const distance = userPBs['5k'] ? 5 : 10;

        if (!referenceTime) {
            // Default paces if no PB is provided
            return {
                z1: '6:30',
                z2: '6:00',
                z3: '5:15',
                z4: '4:45',
                z5: '4:15'
            };
        }

        const totalSeconds = this.timeToSeconds(referenceTime);
        const secondPerKm = totalSeconds / distance;

        return {
            z1: this.secondsToTime(secondPerKm * 1.40), // Recovery / Easy
            z2: this.secondsToTime(secondPerKm * 1.25), // Aerobic / Long Run
            z3: this.secondsToTime(secondPerKm * 1.10), // Threshold / Tempo
            z4: this.secondsToTime(secondPerKm * 0.98), // Intervals / VO2Max
            z5: this.secondsToTime(secondPerKm * 0.90)  // Sprints
        };
    }

    timeToSeconds(timeStr) {
        if (!timeStr) return 0;
        const parts = timeStr.split(':').map(Number);
        if (parts.length === 2) {
            return (parts[0] * 60) + parts[1];
        }
        return parts[0] * 60; // Just minutes
    }

    secondsToTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.round(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    }
}

module.exports = PaceCalculator;
