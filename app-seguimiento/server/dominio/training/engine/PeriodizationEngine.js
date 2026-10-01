/**
 * Motor de periodización lógica para la planificación deportiva.
 */
class PeriodizationEngine {
    definePhases(totalWeeks, isGeneric = false) {
        if (isGeneric) {
            if (totalWeeks <= 2) {
                return [{ type: 'Base General', weeks: totalWeeks }];
            }
            const evalWeeks = 1;
            const remaining = totalWeeks - evalWeeks;
            const devWeeks = Math.floor(remaining * 0.5);
            const baseWeeks = remaining - devWeeks;

            const phases = [];
            if (baseWeeks > 0) phases.push({ type: 'Base General', weeks: baseWeeks });
            if (devWeeks > 0) phases.push({ type: 'Desarrollo Progresivo', weeks: devWeeks });
            phases.push({ type: 'Asimilación y Evaluación', weeks: evalWeeks });

            return phases;
        }

        if (totalWeeks < 2) {
            return [{ type: 'Tapering', weeks: totalWeeks }];
        }

        const taperWeeks = totalWeeks > 12 ? 3 : 2;
        const remainingWeeks = totalWeeks - taperWeeks;

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
