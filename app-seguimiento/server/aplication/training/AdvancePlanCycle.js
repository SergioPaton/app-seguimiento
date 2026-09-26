const { NotFoundError, ValidationError } = require('../../dominio/shared/Errors');

/**
 * Caso de uso para avanzar una rutina recurrente en bucle al siguiente ciclo (sobrecarga progresiva).
 */
class AdvancePlanCycle {
    constructor(trainingRepository, userRepository, generatePlanService) {
        this.trainingRepository = trainingRepository;
        this.userRepository = userRepository;
        this.generatePlanService = generatePlanService;
    }

    execute(planId) {
        const currentPlan = this.trainingRepository.getById(planId);
        if (!currentPlan) {
            throw new NotFoundError('Plan de entrenamiento no encontrado.');
        }

        const user = this.userRepository.getById(currentPlan.userId);
        if (!user) {
            throw new ValidationError('Usuario del plan no encontrado.');
        }

        const nextCycleNumber = (currentPlan.cycleNumber || 1) + 1;

        // Eliminar plan actual
        this.trainingRepository.delete(planId);

        // Generar nuevo plan con el siguiente número de ciclo (incremento progresivo)
        const newPlan = this.generatePlanService.execute({
            userId: currentPlan.userId,
            goalDistance: currentPlan.goal.distance,
            isGeneric: true,
            cycleWeeks: currentPlan.cycleWeeks,
            cycleNumber: nextCycleNumber,
            level: currentPlan.level || user.level || 'beginner',
            description: `Rutina Recurrente ${currentPlan.goal.distance}k en Bucle (Ciclo ${nextCycleNumber})`
        });

        return newPlan;
    }
}

module.exports = AdvancePlanCycle;
