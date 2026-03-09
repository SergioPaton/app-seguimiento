/**
 * Logic to manage weekly mileage progression and safety rules.
 * Placeholder for future implementation.
 */
class ProgressionManager {
    /**
     * Calculates the target volume for a week based on the previous week,
     * the current phase, and the cycle position.
     * 
     * @param {number} baseVolume - The volume (distance or time) of the previous week.
     * @param {number} weekInPlan - The absolute week number in the macrociclo.
     * @param {string} phaseType - 'Base', 'Specific', or 'Tapering'.
     * @returns {number} The calculated target volume.
     */
    calculateNextVolume(baseVolume, weekInPlan, phaseType) {
        // Recovery cycle Every 4th week (except in tapering)
        const isRecoveryWeek = weekInPlan % 4 === 0 && !phaseType.includes('Tapering');

        if (isRecoveryWeek) {
            return parseFloat((baseVolume * 0.85).toFixed(2)); // 15% reduction for recovery
        }

        if (phaseType.includes('Tapering')) {
            return parseFloat((baseVolume * 0.70).toFixed(2)); // Significant reduction for taper
        }

        if (phaseType.includes('Specific')) {
            return parseFloat((baseVolume * 1.05).toFixed(2)); // Slower growth (5%)
        }

        // Default: General Base progression (10% rule)
        return parseFloat((baseVolume * 1.10).toFixed(2));
    }
}

module.exports = ProgressionManager;
