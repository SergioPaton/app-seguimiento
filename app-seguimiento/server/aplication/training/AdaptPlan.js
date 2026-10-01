const TrainingPlan = require('../../dominio/training/TrainingPlan');
const Mesociclo = require('../../dominio/training/Mesociclo');
const Microciclo = require('../../dominio/training/Microciclo');
const PlannedSession = require('../../dominio/training/PlannedSession');
const { ValidationError } = require('../../dominio/shared/Errors');
const GeneratePlan = require('./GeneratePlan');
const PaceCalculator = require('../../dominio/training/engine/PaceCalculator');

/**
 * Servicio de Adaptación de Plan de Entrenamiento.
 * Analiza los registros de carreras reales del usuario y ajusta el plan automáticamente:
 *  - Actualiza las Mejores Marcas (PBs) cuando hay mejora.
 *  - Detecta si el usuario está rindiendo por encima del plan y aumenta el volumen de las semanas restantes.
 *  - Regenera las zonas de ritmo basadas en el rendimiento real reciente del usuario.
 * 
 * @class AdaptPlan
 */
class AdaptPlan {
    constructor(userRepository, trainingRepository) {
        this.userRepository = userRepository;
        this.trainingRepository = trainingRepository;
        this.paceCalculator = new PaceCalculator();
    }

    /**
     * Ejecuta la adaptación del plan basándose en una carrera real registrada.
     * 
     * @param {string} userId - Identificador del usuario.
     * @param {Object} run - Carrera registrada { distance, duration, date, note }.
     * @returns {Object} { plan: JSON, message: string }.
     */
    execute(userId, run) {
        if (!run || !run.distance || !run.duration) {
            throw new ValidationError('Los datos de la carrera son insuficientes para adaptar el plan.');
        }

        const user = this.userRepository.getById(userId);
        if (!user) {
            throw new ValidationError('Usuario no encontrado.');
        }

        const currentPlan = this.trainingRepository.getByUserId(userId);
        if (!currentPlan) {
            throw new ValidationError('No hay un plan de entrenamiento activo para este usuario.');
        }

        // Calcular pace real de la carrera (min/km)
        const pacePerKm = run.duration / run.distance;
        const paceStr = this.paceCalculator.secondsToTime(pacePerKm * 60);

        // 1. Actualizar PBs si hay mejora
        this._updatePbs(user, run.distance, paceStr);

        // 2. Calcular progreso del plan
        const progress = this._calculatePlanProgress(currentPlan);

        // 3. Si se ha completado al menos el 25% y se rinde por encima del plan -> ajustar volumen
        const performance = this._assessPerformance(user, pacePerKm, currentPlan);
        if (progress.completedRatio >= 0.25 && performance.isImproving) {
            const adjustedPlan = this._adjustPlanProgressive(currentPlan, performance.paceImprovement, run.distance);
            this.trainingRepository.save(adjustedPlan);
            return {
                plan: adjustedPlan.toJSON(),
                message: `¡Has superado el plan! Tu ritmo es un ${Math.round(performance.paceImprovement * 100)}% más rápido. Hemos aumentado la carga de las semanas restantes.`
            };
        }

        return {
            plan: currentPlan.toJSON(),
            message: 'Entrenamiento registrado. Tus marcas se han actualizado correctamente.'
        };
    }

    /**
     * Calcula el progreso completado del plan actual.
     * @private
     */
    _calculatePlanProgress(plan) {
        let totalSessions = 0;
        let completedSessions = 0;
        plan.mesociclos.forEach(meso => {
            meso.microciclos.forEach(micro => {
                micro.sessions.forEach(s => {
                    totalSessions++;
                    if (s.status === 'completed') completedSessions++;
                });
            });
        });
        return {
            totalSessions,
            completedSessions,
            completedRatio: totalSessions > 0 ? completedSessions / totalSessions : 0
        };
    }

    /**
     * Evalúa el rendimiento del usuario comparando sus carreras reales con el plan.
     * @private
     */
    _assessPerformance(user, currentPacePerKm, plan) {
        const recentPaces = (user.paceHistory || []).slice(-5); // Últimas 5 carreras
        let planPace = null;

        // Buscar el pace objetivo de una sesión "Easy Run" típica del plan como referencia
        for (const meso of plan.mesociclos) {
            for (const micro of meso.microciclos) {
                const easy = micro.sessions.find(s => s.type.includes('Easy') || s.type.includes('Suave'));
                if (easy && easy.targetPace && easy.targetPace !== 'N/A') {
                    planPace = parseFloat(easy.targetPace);
                    break;
                }
            }
            if (planPace) break;
        }

        if (!planPace || !recentPaces.length) {
            return { isImproving: false, paceImprovement: 0 };
        }

        // Calcular pace promedio real reciente
        const avgRecentPace = recentPaces.reduce((a, b) => a + b, 0) / recentPaces.length;
        const improvement = (planPace - avgRecentPace) / planPace;

        // Se considera mejor si el pace real es al menos 3% más rápido que el del plan
        return {
            isImproving: improvement > 0.03,
            paceImprovement: improvement,
            currentPace: currentPacePerKm,
            avgRecentPace
        };
    }

    /**
     * Ajusta progresivamente el plan: aumenta volumen en % y actualiza sesiones futuras.
     * @private
     */
    _adjustPlanProgressive(plan, improvement, recentDistance) {
        const planDistance = plan.goal.distance || 10;
        // Factor de ajuste: 1 + (mejora * 1.5) * 10%, con máximo de +40% para no sobrecargar
        const adjustmentFactor = Math.min(1.40, 1 + (improvement * 1.5) * 1.0);
        const newGoalDistance = Math.round((planDistance * adjustmentFactor) * 100) / 100;

        // Recalcular volumen semanal de microciclos futuros
        let currentWeek = 1;
        plan.mesociclos.forEach(meso => {
            meso.microciclos.forEach(micro => {
                if (micro.weekNumber >= currentWeek) {
                    micro.sessions.forEach(s => {
                        if (s.targetDistance > 0 && s.targetPace !== 'N/A') {
                            // Ajustar distancia de la sesión
                            s.targetDistance = parseFloat((s.targetDistance * adjustmentFactor).toFixed(2));
                            // Ajustar ritmo objetivo ligeramente (el usuario está más rápido)
                            if (s.type !== 'Strength' && s.targetPace && s.targetPace !== 'N/A') {
                                const p = parseFloat(s.targetPace);
                                s.targetPace = (p * (1 - improvement * 0.25)).toFixed(2);
                            }
                        }
                    });
                }
            });
        });

        plan.goal.distance = newGoalDistance;
        plan.goal.description = `Plan adaptado al progreso: objetivo ${newGoalDistance}km`;
        plan.endDate = this._addWeeksToDate(new Date(plan.endDate), Math.round((newGoalDistance - planDistance) * 3)).toISOString();

        return plan;
    }

    /**
     * Suma semanas a una fecha.
     * @private
     */
    _addWeeksToDate(date, weeks) {
        const d = new Date(date);
        d.setDate(d.getDate() + weeks * 7);
        return d;
    }

    /**
     * Actualiza los PBs del usuario con el nuevo rendimiento.
     * @private
     */
    _updatePbs(user, distance, paceStr) {
        const pbs = user.pb || {};
        let changed = false;
        const refKey = distance <= 5.5 ? '5k' : '10k';

        if (!pbs[refKey]) {
            pbs[refKey] = paceStr;
            changed = true;
        } else {
            const currentBest = this.paceCalculator.timeToSeconds(pbs[refKey]);
            const newBest = this.paceCalculator.timeToSeconds(paceStr);
            if (newBest < currentBest) {
                pbs[refKey] = paceStr;
                changed = true;
            }
        }

        if (changed) {
            user.pb = pbs;
            this.userRepository.save(user);
        }
    }
}

module.exports = AdaptPlan;
