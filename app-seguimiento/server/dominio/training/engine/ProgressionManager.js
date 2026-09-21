/**
 * Administrador de progresión de cargas de entrenamiento.
 * Controla el incremento o decremento de volumen semanal (kilometraje o tiempo) basándose en
 * principios de progresión segura y fases de entrenamiento.
 * 
 * @class ProgressionManager
 */
class ProgressionManager {
    /**
     * Calcula el volumen objetivo (distancia o tiempo) para una semana basándose en la semana previa,
     * la fase actual del mesociclo y la posición dentro del ciclo de carga/descarga.
     * 
     * @param {number} baseVolume - El volumen de entrenamiento de la semana anterior.
     * @param {number} weekInPlan - El número de semana absoluto en el macrociclo.
     * @param {string} phaseType - El tipo de fase de entrenamiento ('General Base', 'Specific Preparation', 'Tapering & Goal').
     * @returns {number} El volumen objetivo calculado con dos decimales de precisión.
     */
    calculateNextVolume(baseVolume, weekInPlan, phaseType, level = null) {
        // Semana de descarga/recuperación cada 4 semanas (excepto en fase de tapering)
        const isRecoveryWeek = weekInPlan % 4 === 0 && !phaseType.includes('Tapering');

        if (isRecoveryWeek) {
            return parseFloat((baseVolume * 0.85).toFixed(2)); // Reducción del 15% para asimilación de cargas
        }

        if (phaseType.includes('Tapering')) {
            return parseFloat((baseVolume * 0.70).toFixed(2)); // Reducción significativa para la puesta a punto (taper)
        }

        if (phaseType.includes('Specific')) {
            return parseFloat((baseVolume * 1.05).toFixed(2)); // Progresión más moderada (5%) en fase específica
        }

        // Progresión en Fase Base General conservadora según nivel ("tirar por abajo" para principiantes e intermedios)
        let growthRate = 1.10; // 10% por defecto / nivel avanzado
        if (level === 'beginner') {
            growthRate = 1.05; // 5% para principiantes (seguro y asequible)
        } else if (level === 'intermediate') {
            growthRate = 1.07; // 7% para nivel intermedio
        }

        return parseFloat((baseVolume * growthRate).toFixed(2));
    }
}

module.exports = ProgressionManager;

