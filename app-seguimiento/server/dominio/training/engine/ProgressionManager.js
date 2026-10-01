/**
 * Administrador de progresión de cargas de entrenamiento.
 */
class ProgressionManager {
    calculateNextVolume(baseVolume, weekInPlan, phaseType, level = null) {
        const isRecoveryWeek = (weekInPlan % 4 === 0 && !phaseType.includes('Tapering')) || phaseType.includes('Asimilación');

        if (isRecoveryWeek) {
            return parseFloat((baseVolume * 0.85).toFixed(2));
        }

        if (phaseType.includes('Tapering')) {
            return parseFloat((baseVolume * 0.70).toFixed(2));
        }

        if (phaseType.includes('Specific')) {
            return parseFloat((baseVolume * 1.08).toFixed(2));
        }

        let growthRate = 1.12;
        if (level === 'beginner') {
            growthRate = 1.08;
        } else if (level === 'intermediate') {
            growthRate = 1.10;
        }

        return parseFloat((baseVolume * growthRate).toFixed(2));
    }
}

module.exports = ProgressionManager;
