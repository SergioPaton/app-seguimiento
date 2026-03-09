/**
 * Templates and logic for specific types of workouts.
 * Placeholder for future implementation.
 */
class WorkoutLibrary {
    /**
     * @param {string} sessionType - 'Easy', 'Intervals', 'Farklet', 'Strength', 'LongRun', 'Incremental'.
     * @param {Object} zones - Calculated training zones (z1-z5).
     * @param {number} totalDistance - Goal distance for the session.
     * @returns {Object} Structured description and target pace/type.
     */
    getWorkoutTemplate(sessionType, zones, totalDistance) {
        switch (sessionType) {
            case 'Incremental':
                const baseDist = (totalDistance * 0.6).toFixed(1);
                const fastDist = (totalDistance - baseDist).toFixed(1);
                return {
                    type: 'Incremental Run',
                    description: `${baseDist}km suave (@${zones.z2}) + ${fastDist}km alegre (@${zones.z3})`,
                    targetPace: zones.z3
                };

            case 'Intervals':
                const sets = 5;
                const distPerSet = 0.5; // 500m like in the image
                return {
                    type: 'Intervals',
                    description: `3km Trote Suave + ${sets}x500m @${zones.z4} (rec: 1'30") + 1km Trote Suave`,
                    targetPace: zones.z4
                };

            case 'Farklet':
                return {
                    type: 'Farklet',
                    description: `3km Trote Suave + Farklet 2x2' @${zones.z4} (rec: 1') + 1km Trote Suave`,
                    targetPace: zones.z4
                };

            case 'Strength':
                return {
                    type: 'Strength',
                    description: 'Fortalecimiento 45 min (CORE, piernas, estabilidad)',
                    targetPace: 'N/A',
                    targetDistance: 0
                };

            case 'LongRun':
                return {
                    type: 'Long Run',
                    description: `Carrera continua a ritmo sostenido para ganar fondo`,
                    targetPace: zones.z2
                };

            default:
                return {
                    type: 'Easy Run',
                    description: 'Trote suave regenerativo',
                    targetPace: zones.z1
                };
        }
    }
}

module.exports = WorkoutLibrary;
