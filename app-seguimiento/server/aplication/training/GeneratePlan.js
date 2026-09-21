const TrainingPlan = require('../../dominio/training/TrainingPlan');
const Mesociclo = require('../../dominio/training/Mesociclo');
const Microciclo = require('../../dominio/training/Microciclo');
const PlannedSession = require('../../dominio/training/PlannedSession');
const { ValidationError } = require('../../dominio/shared/Errors');

const PeriodizationEngine = require('../../dominio/training/engine/PeriodizationEngine');
const ProgressionManager = require('../../dominio/training/engine/ProgressionManager');
const PaceCalculator = require('../../dominio/training/engine/PaceCalculator');
const WorkoutLibrary = require('../../dominio/training/engine/WorkoutLibrary');

/**
 * Service to generate a Training Plan based on periodization principles.
 */
class GeneratePlan {
    constructor(userRepository, trainingRepository) {
        this.userRepository = userRepository;
        this.trainingRepository = trainingRepository;
        this.baseInitialVolume = 20; // Default starting volume
        this.periodizationEngine = new PeriodizationEngine();
        this.progressionManager = new ProgressionManager();
        this.paceCalculator = new PaceCalculator();
        this.workoutLibrary = new WorkoutLibrary();
    }

    execute({ userId, goalDistance, targetDate, targetTime, description, isGeneric }) {
        const user = this.userRepository.getById(userId);
        if (!user) {
            throw new ValidationError('User not found.');
        }

        let finalGoalDistance = goalDistance;
        let finalTargetDate = targetDate;
        let finalDescription = description;

        if (isGeneric || !goalDistance || !targetDate) {
            // Determinar la distancia basada en marcas personales (PB) del usuario
            if (user.pb) {
                if (user.pb['10k']) {
                    finalGoalDistance = 21; // Si corre 10k, sugerir Medio Maratón
                } else if (user.pb['5k']) {
                    finalGoalDistance = 10; // Si corre 5k, sugerir 10k
                } else {
                    finalGoalDistance = 10; // Por defecto
                }
            } else {
                finalGoalDistance = 10; // Por defecto
            }

            // Duración por defecto de 8 semanas
            const target = new Date();
            target.setDate(target.getDate() + 8 * 7);
            finalTargetDate = target.toISOString();

            finalDescription = description || 'Plan de Mejora General';
        }

        const startDate = new Date();
        const endDate = new Date(finalTargetDate);

        if (endDate <= startDate) {
            throw new ValidationError('Target date must be in the future.');
        }

        const plan = new TrainingPlan({
            userId,
            goal: { distance: finalGoalDistance, description: finalDescription },
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
        });

        const diffTime = Math.abs(endDate - startDate);
        const totalWeeks = Math.round(diffTime / (1000 * 60 * 60 * 24 * 7));

        const phases = this.periodizationEngine.definePhases(totalWeeks);
        const zones = this.paceCalculator.calculateZones(user.pb || {}, user.level || 'beginner');

        // Calculate Goal Pace if targetTime is provided
        let goalPace = null;
        if (targetTime) {
            const totalGoalSeconds = this.paceCalculator.timeToSeconds(targetTime);
            // If targetTime looks like a pace (e.g. 5:00), we don't divide by distance. 
            // If it looks like a total time (e.g. 45:00 for 10k), we divide.
            // Simple heuristic: if totalGoalSeconds < 15 * 60 (15 min), it's probably a pace per km (unless they are world record holders for 5k/10k)
            // But better: if it's 5km and time is e.g. 25:00, distance is 5.
            if (totalGoalSeconds > 15 * 60 || (finalGoalDistance > 5 && totalGoalSeconds > 10 * 60)) {
                goalPace = this.paceCalculator.secondsToTime(totalGoalSeconds / finalGoalDistance);
            } else {
                goalPace = targetTime;
            }
        }

        let currentWeek = 1;

        // Initial volume based on User level, custom weekly volume, PB, and adapted to goal distance
        let lastWeekVolume = this._calculateInitialVolume(user, finalGoalDistance);

        phases.forEach(phase => {
            const mesociclo = new Mesociclo({ type: phase.type });

            for (let i = 0; i < phase.weeks; i++) {
                const weekStartDate = new Date(startDate);
                weekStartDate.setDate(startDate.getDate() + (currentWeek - 1) * 7);

                // Calculate volume for this week using conservative level-based progression
                const weeklyVolume = this.progressionManager.calculateNextVolume(lastWeekVolume, currentWeek, phase.type, user.level || 'beginner');
                
                // If it was a recovery week, we do not update lastWeekVolume with the reduced recovery volume.
                // This keeps the baseline progressive.
                const isRecoveryWeek = currentWeek % 4 === 0 && !phase.type.includes('Tapering');
                if (!isRecoveryWeek) {
                    lastWeekVolume = weeklyVolume;
                }

                const micro = new Microciclo({
                    weekNumber: currentWeek,
                    startDate: weekStartDate.toISOString().split('T')[0]
                });

                const days = user.availableDays && user.availableDays.length > 0
                    ? user.availableDays
                    : ['Monday', 'Wednesday', 'Friday'];

                // Determinar el número de días de carrera efectivos en la semana
                const runningDays = days.filter((day, index) => {
                    const sessionType = this._determineSessionType(day, index, days.length, phase.type);
                    return sessionType !== 'Strength';
                }).length;

                // Determinar porcentaje dinámico equilibrado de la tirada larga
                let longRunPercent = 0.35;
                if (runningDays === 1) {
                    longRunPercent = 1.0;
                } else if (runningDays === 2) {
                    longRunPercent = 0.50; // Reparto equilibrado (50%) si solo hay 2 días de carrera
                } else if (runningDays === 3) {
                    longRunPercent = 0.40;
                } else if (runningDays >= 4) {
                    longRunPercent = finalGoalDistance >= 35 ? 0.38 : 0.35;
                }

                days.forEach((day, index) => {
                    const sessionType = this._determineSessionType(day, index, days.length, phase.type);
                    const isLongRun = sessionType === 'LongRun';
                    const isStrength = sessionType === 'Strength';

                    // Weighted Distribution: Long Run gets dynamic percentage of volume, others share the rest
                    let targetDistance;
                    if (isStrength) {
                        targetDistance = 0;
                    } else if (isLongRun) {
                        targetDistance = (weeklyVolume * longRunPercent);
                        
                        // LÍMITE DE SEGURIDAD POR META ("Tirar por abajo" y asequible para amateur/principiante)
                        const userLevel = user.level || 'beginner';
                        let safetyFactor = 1.0; // En fase base no supera la distancia de la meta para principiante/intermedio
                        if (userLevel === 'advanced') {
                            safetyFactor = 1.4;
                        } else if (phase.type.includes('Specific')) {
                            safetyFactor = 1.15;
                        }

                        const maxAllowedLongRun = Math.max(finalGoalDistance * safetyFactor, 3);
                        targetDistance = Math.min(targetDistance, maxAllowedLongRun);
                    } else {
                        const remainingRunningDays = runningDays - 1;
                        const remainingVolume = weeklyVolume * (1 - longRunPercent);
                        targetDistance = remainingVolume / (remainingRunningDays > 0 ? remainingRunningDays : 1);
                        
                        // Limitar sesiones secundarias para que no excedan el 80% de la meta
                        const maxSecondarySession = Math.max(finalGoalDistance * 0.8, 2.5);
                        targetDistance = Math.min(targetDistance, maxSecondarySession);
                    }

                    const template = this.workoutLibrary.getWorkoutTemplate(sessionType, zones, parseFloat(targetDistance.toFixed(2)));

                    // Override pace if it's a Goal Pace session in Specific Phase
                    let finalPace = template.targetPace;
                    if (goalPace && phase.type.includes('Specific') && (sessionType === 'Intervals' || sessionType === 'Farklet')) {
                        finalPace = goalPace;
                    }

                    micro.addSession(new PlannedSession({
                        id: `${currentWeek}-${day}`,
                        day,
                        type: template.type,
                        description: template.description + (finalPace === goalPace ? ' (Ritmo Objetivo)' : ''),
                        targetDistance: template.targetDistance !== undefined ? template.targetDistance : parseFloat(targetDistance.toFixed(2)),
                        targetPace: finalPace
                    }));
                });

                mesociclo.addMicrociclo(micro);
                currentWeek++;
            }

            plan.addMesociclo(mesociclo);
        });

        // Generate ID and persist
        plan.id = Date.now().toString();
        this.trainingRepository.save(plan);

        return plan;
    }


    /**
     * Estimates initial running volume based on User level, custom weekly volume, PB, and goal distance.
     */
    _calculateInitialVolume(user, goalDistance) {
        // 1. Si el usuario definió un volumen semanal personalizado explícito, usarlo como base
        if (user && user.weeklyVolume && user.weeklyVolume > 0) {
            return parseFloat(user.weeklyVolume);
        }

        const level = user ? (user.level || 'beginner') : 'beginner';

        // 2. Si hay Marcas Personales (PB), calcular el nivel real del corredor basándose en el ritmo por km
        let pbVolume = null;
        if (user && user.pb) {
            const ref = user.pb['5k'] || user.pb['10k'];
            if (ref) {
                const totalSec = this.paceCalculator.timeToSeconds(ref);
                const is5k = Boolean(user.pb['5k']);
                const secPerKm = is5k ? (totalSec / 5) : (totalSec / 10);
                
                if (secPerKm < 270) pbVolume = 28;      // Ritmo < 4:30 min/km -> Corredor rápido
                else if (secPerKm < 330) pbVolume = 18; // Ritmo < 5:30 min/km -> Intermedio
                else pbVolume = 10;                     // Ritmo > 5:30 min/km -> Principiante
            }
        }

        // 3. Matriz de volumen inicial realista según Nivel y Distancia de Meta (Goal Distance)
        let baseVolume = 8;

        if (goalDistance <= 6) {
            // Meta corta (5k - 6k)
            if (level === 'beginner') baseVolume = 8;        // 8 km/semana (ej: 2 carreras de 4.0 km)
            else if (level === 'intermediate') baseVolume = 14; // 14 km/semana (ej: 2 carreras de 7.0 km)
            else baseVolume = 24;                             // 24 km/semana
        } else if (goalDistance <= 10) {
            // Meta 10k
            if (level === 'beginner') baseVolume = 12;        // 12 km/semana
            else if (level === 'intermediate') baseVolume = 20; // 20 km/semana
            else baseVolume = 32;                             // 32 km/semana
        } else if (goalDistance <= 21) {
            // Medio Maratón (21k)
            if (level === 'beginner') baseVolume = 20;
            else if (level === 'intermediate') baseVolume = 30;
            else baseVolume = 45;
        } else {
            // Maratón (42k)
            if (level === 'beginner') baseVolume = 35;
            else if (level === 'intermediate') baseVolume = 48;
            else baseVolume = 65;
        }

        if (pbVolume && pbVolume > baseVolume) {
            baseVolume = Math.round((baseVolume + pbVolume) / 2);
        }

        return baseVolume;
    }

    /**
     * Internal logic to vary session types within a week.
     */
    _determineSessionType(day, index, totalDays, phaseType) {
        // Wednesday or middle of the week is often Strength in the reference image
        if (day === 'Wednesday' || (totalDays > 3 && index === Math.floor(totalDays / 2))) {
            return 'Strength';
        }

        // Sunday or last session is often the Long Run
        if (day === 'Sunday' || index === totalDays - 1) {
            return 'LongRun';
        }

        const isBase = phaseType.includes('Base');
        const isSpecific = phaseType.includes('Specific');
        const isTaper = phaseType.includes('Tapering');

        // Quality Session (Usually first session of the week)
        if (index === 0) {
            if (isBase) {
                // Base Phase: Hills or Progression
                return Math.random() > 0.5 ? 'Hills' : 'Progression';
            }
            if (isSpecific) {
                // Specific Phase: Intervals or Tempo
                return Math.random() > 0.5 ? 'Intervals' : 'Tempo';
            }
            if (isTaper) {
                // Tapering Phase: Farklet (short neuromuscular quality)
                return 'Farklet';
            }
        }

        // Secondary Running Day (if available)
        if (index === 1 && totalDays > 2) {
            if (isBase) {
                return 'Incremental';
            }
            if (isSpecific) {
                return 'Farklet';
            }
            if (isTaper) {
                return 'Recovery';
            }
        }

        // Third/other running days or recovery days
        if (isTaper) {
            return 'Recovery';
        }
        return 'Easy';
    }
}

module.exports = GeneratePlan;

