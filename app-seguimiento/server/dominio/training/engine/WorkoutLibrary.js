/**
 * Biblioteca de plantillas y lógica de estructuración de sesiones de entrenamiento.
 * Define la estructura y descripción de diferentes tipos de entrenamientos (series, tempo, cuestas, recuperación, etc.).
 * 
 * @class WorkoutLibrary
 */
class WorkoutLibrary {
    /**
     * Obtiene una plantilla de sesión estructurada según el tipo de entrenamiento, zonas de ritmo y distancia total.
     * 
     * @param {string} sessionType - Tipo de sesión ('Easy', 'Intervals', 'Farklet', 'Strength', 'LongRun', 'Incremental', 'Tempo', 'Hills', 'Progression', 'Recovery').
     * @param {Object} zones - Zonas de ritmo de entrenamiento calculadas (z1-z5).
     * @param {number} totalDistance - Distancia total objetivo para la sesión de entrenamiento.
     * @returns {Object} Un objeto con el tipo de entrenamiento estructurado, descripción detallada y ritmo objetivo.
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
                const repDist = totalDistance >= 10 ? 1.0 : 0.5;
                let sets = Math.round((totalDistance * 0.5) / repDist);
                if (sets < 3) sets = 3;
                const qualityDist = sets * repDist;
                const remainingDist = totalDistance - qualityDist;
                const warmup = parseFloat((remainingDist * 0.6).toFixed(1));
                const cooldown = parseFloat((remainingDist - warmup).toFixed(1));
                const repLabel = repDist === 1.0 ? '1000m' : '500m';
                return {
                    type: 'Intervals',
                    description: `${warmup}km Trote Suave + ${sets}x${repLabel} @${zones.z4} (rec: 1'30") + ${cooldown}km Trote Suave`,
                    targetPace: zones.z4
                };
 
            case 'Farklet':
                const farkletDist = parseFloat((totalDistance * 0.5).toFixed(1));
                const remainingFarkletDist = totalDistance - farkletDist;
                const warmupFarklet = parseFloat((remainingFarkletDist * 0.6).toFixed(1));
                const cooldownFarklet = parseFloat((remainingFarkletDist - warmupFarklet).toFixed(1));
                
                let structureLabel = "3x(2' fuerte / 1' suave)";
                if (totalDistance >= 12) {
                    structureLabel = "5x(4' fuerte / 2' suave)";
                } else if (totalDistance >= 8) {
                    structureLabel = "4x(3' fuerte / 1'30\" suave)";
                }
                
                return {
                    type: 'Farklet',
                    description: `${warmupFarklet}km Trote Suave + Farklet ${structureLabel} @${zones.z4} + ${cooldownFarklet}km Trote Suave`,
                    targetPace: zones.z4
                };

            case 'Tempo':
                const warmupTempo = 2.0;
                const cooldownTempo = 1.5;
                const activeTempo = Math.max(1.0, parseFloat((totalDistance - warmupTempo - cooldownTempo).toFixed(1)));
                return {
                    type: 'Tempo Run',
                    description: `${warmupTempo}km Trote Suave + ${activeTempo}km a ritmo umbral continuo (@${zones.z3}) + ${cooldownTempo}km Trote Suave`,
                    targetPace: zones.z3
                };

            case 'Hills':
                const warmupHills = 2.0;
                const cooldownHills = 1.5;
                const remainingHills = totalDistance - warmupHills - cooldownHills;
                let hillSets = Math.round(remainingHills / 0.2);
                if (hillSets < 4) hillSets = 4;
                const qualityHills = hillSets * 0.2;
                const adjustedWarmup = parseFloat((totalDistance - qualityHills - cooldownHills).toFixed(1));
                return {
                    type: 'Hill Repeats',
                    description: `${adjustedWarmup > 0 ? adjustedWarmup : warmupHills}km Trote + ${hillSets}x200m subida explosiva (@${zones.z5}) [rec: bajada trote] + ${cooldownHills}km Trote`,
                    targetPace: zones.z5
                };

            case 'Progression':
                const part = (totalDistance / 3).toFixed(1);
                const part1 = parseFloat(part);
                const part2 = parseFloat(part);
                const part3 = parseFloat((totalDistance - part1 - part2).toFixed(1));
                return {
                    type: 'Progression Run',
                    description: `${part1}km suave (@${zones.z1}) + ${part2}km ritmo base (@${zones.z2}) + ${part3}km alegre (@${zones.z3})`,
                    targetPace: zones.z3
                };

            case 'Recovery':
                return {
                    type: 'Recovery Run',
                    description: `Carrera regenerativa muy suave de ${totalDistance}km en zona de recuperación activa (@${zones.z1})`,
                    targetPace: zones.z1
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
                    description: `Carrera continua de ${totalDistance}km a ritmo sostenido para ganar fondo`,
                    targetPace: zones.z2
                };
 
            default:
                return {
                    type: 'Easy Run',
                    description: `Trote suave regenerativo de ${totalDistance}km`,
                    targetPace: zones.z1
                };
        }
    }
}

module.exports = WorkoutLibrary;

