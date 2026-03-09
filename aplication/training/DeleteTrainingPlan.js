const { NotFoundError } = require('../../dominio/shared/Errors');

/**
 * Service to delete a training plan.
 */
class DeleteTrainingPlan {
    constructor(trainingRepository) {
        this.trainingRepository = trainingRepository;
    }

    execute(id) {
        const plan = this.trainingRepository.getAll().find(p => p.id === id);
        if (!plan) {
            throw new NotFoundError('Training plan not found.');
        }

        this.trainingRepository.delete(id);
    }
}

module.exports = DeleteTrainingPlan;
