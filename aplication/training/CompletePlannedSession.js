const { NotFoundError, ValidationError } = require('../../dominio/shared/Errors');

/**
 * Service to mark a planned session as completed by linking it to a real run.
 */
class CompletePlannedSession {
    constructor(trainingRepository, runRepository) {
        this.trainingRepository = trainingRepository;
        this.runRepository = runRepository;
    }

    execute(planId, sessionId, runId) {
        // 1. Verify the run exists
        const run = this.runRepository.getById(runId);
        if (!run) {
            throw new NotFoundError('Run not found.');
        }

        // 2. Load the plan
        const plans = this.trainingRepository.getAll();
        const plan = plans.find(p => p.id === planId);
        if (!plan) {
            throw new NotFoundError('Training plan not found.');
        }

        // 3. Find the session in the hierarchical structure
        let foundSession = null;
        for (const mesociclo of plan.mesociclos) {
            for (const microciclo of mesociclo.microciclos) {
                foundSession = microciclo.sessions.find(s => s.id === sessionId);
                if (foundSession) break;
            }
            if (foundSession) break;
        }

        if (!foundSession) {
            throw new NotFoundError('Planned session not found in this plan.');
        }

        // 4. Update session status
        if (typeof foundSession.complete === 'function') {
            foundSession.complete(runId);
        } else {
            // Fallback for plain objects from JSON
            foundSession.status = 'completed';
            foundSession.realRunId = runId;
        }

        // 5. Save the updated plan
        this.trainingRepository.save(plan);

        return plan.toJSON();
    }
}

module.exports = CompletePlannedSession;
