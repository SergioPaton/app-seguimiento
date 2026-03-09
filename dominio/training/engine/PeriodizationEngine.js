/**
 * Logic to distribute a training plan into thematic phases (Mesociclos).
 * Placeholder for future implementation.
 */
class PeriodizationEngine {
    /**
     * @param {number} totalWeeks - Number of weeks until the goal.
     * @returns {Array} List of Mesociclo definitions with their durations.
     */
    definePhases(totalWeeks) {
        if (totalWeeks < 2) {
            return [{ type: 'Tapering', weeks: totalWeeks }];
        }

        const taperWeeks = totalWeeks > 12 ? 3 : 2;
        const remainingWeeks = totalWeeks - taperWeeks;

        // Roughly 60% of remaining for specific, 40% for base
        const specificWeeks = Math.floor(remainingWeeks * 0.6);
        const baseWeeks = remainingWeeks - specificWeeks;

        const phases = [];
        if (baseWeeks > 0) {
            phases.push({ type: 'General Base', weeks: baseWeeks });
        }
        if (specificWeeks > 0) {
            phases.push({ type: 'Specific Preparation', weeks: specificWeeks });
        }
        phases.push({ type: 'Tapering & Goal', weeks: taperWeeks });

        return phases;
    }
}

module.exports = PeriodizationEngine;
