/**
 * Motor de periodización lógica para la planificación deportiva.
 * Distribuye el plan de entrenamiento global en fases temáticas (Mesociclos) a lo largo de las semanas disponibles.
 * 
 * @class PeriodizationEngine
 */
class PeriodizationEngine {
    /**
     * Define las fases y la cantidad de semanas correspondientes a cada una, basándose en la duración total.
     * 
     * @param {number} totalWeeks - Número total de semanas disponibles hasta la fecha objetivo.
     * @returns {Array<{type: string, weeks: number}>} Lista de definiciones de mesociclos con sus duraciones estimadas.
     */
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

        // Distribución: Aproximadamente 60% de las semanas restantes para preparación específica, 40% para base
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

