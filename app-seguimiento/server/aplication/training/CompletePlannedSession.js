const { NotFoundError, ValidationError } = require('../../dominio/shared/Errors');
const AdaptPlan = require('./AdaptPlan');

/**
 * Servicio para marcar una sesión planificada como completada vinculándola a una carrera real.
 * Al completar, actualiza el historial de ritmos del usuario para permitir la adaptación del plan.
 */
class CompletePlannedSession {
    constructor(trainingRepository, runRepository, adaptPlanService) {
        this.trainingRepository = trainingRepository;
        this.runRepository = runRepository;
        this.adaptPlan = adaptPlanService || new AdaptPlan(runRepository, trainingRepository);
    }

    execute(planId, sessionId, runId, autoAdapt = true) {
        // 1. Verificar que la carrera real existe
        const run = this.runRepository.getById(runId);
        if (!run) {
            throw new NotFoundError('La carrera real asociada no fue encontrada.');
        }

        // 2. Cargar el plan
        const plans = this.trainingRepository.getAll();
        const plan = plans.find(p => p.id === planId);
        if (!plan) {
            throw new NotFoundError('Plan de entrenamiento no encontrado.');
        }

        // 3. Encontrar la sesión en la estructura jerárquica
        let foundSession = null;
        for (const mesociclo of plan.mesociclos) {
            for (const microciclo of mesociclo.microciclos) {
                foundSession = microciclo.sessions.find(s => s.id === sessionId);
                if (foundSession) break;
            }
            if (foundSession) break;
        }

        if (!foundSession) {
            throw new NotFoundError('Sesión planificada no encontrada en este plan.');
        }

        // 4. Calcular el pace real y actualizar historial del usuario
        const pacePerKm = run.duration / run.distance;
        this._updateUserPaceHistory(plan.userId, pacePerKm);

        // 5. Actualizar estado de la sesión
        if (typeof foundSession.complete === 'function') {
            foundSession.complete(runId);
        } else {
            foundSession.status = 'completed';
            foundSession.realRunId = runId;
            foundSession.realPace = pacePerKm.toFixed(2);
        }

        // 6. Guardar el plan actualizado
        this.trainingRepository.save(plan);

        // 7. Adaptar el plan si está habilitado
        if (autoAdapt) {
            return this.adaptPlan.execute(plan.userId, {
                distance: run.distance,
                duration: run.duration,
                date: run.date,
                note: run.note || 'Registro automático al completar sesión'
            });
        }

        return {
            plan: plan.toJSON(),
            message: 'Sesión marcada como completada.'
        };
    }

    /**
     * Actualiza el historial de ritmos del usuario (últimas 10 carreras) para calibrar el nivel.
     * @private
     */
    _updateUserPaceHistory(userId, pacePerKm) {
        const user = this.runRepository.getById(userId); // Nota: esto busca en runs, corregir abajo
        // El repositorio de usuarios no está inyectado, usamos el usuario por userId a través de un repositorio global
        // Para simplificar, guardamos en el repositorio de usuarios si se puede acceder
        try {
            const UserRepository = require('../../infrastructure/UserRepository');
            const userRepo = new UserRepository();
            const user = userRepo.getById(userId);
            if (user) {
                const history = user.paceHistory || [];
                history.push(parseFloat(pacePerKm.toFixed(2)));
                if (history.length > 10) history.shift();
                user.paceHistory = history;
                userRepo.save(user);
            }
        } catch (e) {
            console.warn('No se pudo actualizar el historial de ritmos del usuario:', e.message);
        }
    }
}

module.exports = CompletePlannedSession;
