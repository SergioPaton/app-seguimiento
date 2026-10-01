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
 * Service to generate a Training Plan based on periodization principles and runner level.
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

    /**
     * Genera un plan de entrenamiento basado en los parámetros proporcionados.
     */
    execute({ userId, goalDistance, targetDate, targetTime, description, isGeneric, level, cycleWeeks, cycleNumber = 1, trainingMode = 'advanced' }) {
        const user = this.userRepository.getById(userId);
        if (!user) {
            throw new ValidationError('User not found.');
        }

        const userLevel = level || user.getDynamicLevel() || user.level || 'beginner';

        let finalGoalDistance = goalDistance ? parseFloat(goalDistance) : null;
        let finalTargetDate = targetDate;
        let finalDescription = description;
        const isLoopable = Boolean(isGeneric || !targetDate);
        let calculatedCycleWeeks = cycleWeeks ? parseInt(cycleWeeks) : null;

        if (isLoopable || isGeneric || !goalDistance || !targetDate) {
            if (!finalGoalDistance) {
                if (user.pb) {
                    if (user.pb['10k']) finalGoalDistance = 21;
                    else if (user.pb['5k']) finalGoalDistance = 10;
                    else finalGoalDistance = 10;
                } else {
                    finalGoalDistance = 10;
                }
            }

            if (!calculatedCycleWeeks) {
                if (level) {
                    calculatedCycleWeeks = userLevel === 'beginner' ? 4 : (userLevel === 'intermediate' ? 6 : 8);
                } else {
                    calculatedCycleWeeks = 8;
                }
            }

            const target = new Date();
            target.setDate(target.getDate() + calculatedCycleWeeks * 7);
            finalTargetDate = target.toISOString();

            finalDescription = description || (cycleNumber > 1 ? `Rutina Recurrente ${finalGoalDistance}k en Bucle (Ciclo ${cycleNumber})` : 'Plan de Mejora General');
        }

        const startDate = new Date();
        const endDate = new Date(finalTargetDate);

        if (endDate <= startDate) {
            throw new ValidationError('Target date must be in the future.');
        }

        const diffTime = Math.abs(endDate - startDate);
        const totalWeeks = calculatedCycleWeeks || Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24 * 7)));

        const plan = new TrainingPlan({
            userId,
            goal: { distance: finalGoalDistance, description: finalDescription },
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            isGeneric: Boolean(isGeneric || isLoopable),
            isLoopable: isLoopable,
            cycleWeeks: totalWeeks,
            cycleNumber: cycleNumber,
            level: userLevel
        });

        const phases = this.periodizationEngine.definePhases(totalWeeks, plan.isGeneric);
        const zones = this.paceCalculator.calculateZones(user.pb || {}, userLevel);

        let goalPace = null;
        if (targetTime) {
            const totalGoalSeconds = this.paceCalculator.timeToSeconds(targetTime);
            if (totalGoalSeconds > 15 * 60 || (finalGoalDistance > 5 && totalGoalSeconds > 10 * 60)) {
                goalPace = this.paceCalculator.secondsToTime(totalGoalSeconds / finalGoalDistance);
            } else {
                goalPace = targetTime;
            }
        }

        let currentWeek = 1;

        let baseVolume = this._calculateInitialVolume(user, finalGoalDistance, userLevel);
        if (cycleNumber > 1) {
            baseVolume = parseFloat((baseVolume * Math.pow(1.05, cycleNumber - 1)).toFixed(2));
        }
        let lastWeekVolume = baseVolume;

        phases.forEach(phase => {
            const mesociclo = new Mesociclo({ type: phase.type });

            for (let i = 0; i < phase.weeks; i++) {
                const weekStartDate = new Date(startDate);
                weekStartDate.setDate(startDate.getDate() + (currentWeek - 1) * 7);

                const weeklyVolume = this.progressionManager.calculateNextVolume(lastWeekVolume, currentWeek, phase.type, userLevel);
                
                const isRecoveryWeek = (currentWeek % 4 === 0 && !phase.type.includes('Tapering')) || phase.type.includes('Asimilación');
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

                const runningDays = days.filter((day, index) => {
                    const sessionType = this._determineSessionType(day, index, days.length, phase.type, userLevel, trainingMode);
                    return sessionType !== 'Strength';
                }).length;

                let longRunPercent = 0.35;
                if (runningDays === 1) {
                    longRunPercent = 1.0;
                } else if (runningDays === 2) {
                    longRunPercent = 0.50;
                } else if (runningDays === 3) {
                    longRunPercent = 0.45;
                } else if (runningDays >= 4) {
                    longRunPercent = finalGoalDistance >= 35 ? 0.38 : 0.35;
                }

                days.forEach((day, index) => {
                    const sessionType = this._determineSessionType(day, index, days.length, phase.type, userLevel, trainingMode);
                    const isLongRun = sessionType === 'LongRun';
                    const isStrength = sessionType === 'Strength';

                    let targetDistance;
                    if (isStrength) {
                        targetDistance = 0;
                    } else if (isLongRun) {
                        targetDistance = (weeklyVolume * longRunPercent);
                        
                        let safetyFactor = 1.0;
                        if (userLevel === 'advanced') {
                            safetyFactor = 1.5;
                        } else if (userLevel === 'intermediate') {
                            safetyFactor = 1.25;
                        } else {
                            safetyFactor = 1.0;
                        }

                        const maxAllowedLongRun = Math.max(finalGoalDistance * safetyFactor, 5);
                        targetDistance = Math.min(targetDistance, maxAllowedLongRun);
                    } else {
                        const remainingRunningDays = runningDays - 1;
                        const remainingVolume = weeklyVolume * (1 - longRunPercent);
                        targetDistance = remainingVolume / (remainingRunningDays > 0 ? remainingRunningDays : 1);
                        
                        const maxSecondarySession = Math.max(finalGoalDistance * 0.9, 4);
                        targetDistance = Math.min(targetDistance, maxSecondarySession);
                    }

                    if (finalGoalDistance && targetDistance > finalGoalDistance) {
                        targetDistance = finalGoalDistance;
                    }

                    const template = this.workoutLibrary.getWorkoutTemplate(sessionType, zones, parseFloat(targetDistance.toFixed(2)));

                    let finalPace = template.targetPace;
                    if (goalPace && (phase.type.includes('Specific') || phase.type.includes('Desarrollo')) && (sessionType === 'Intervals' || sessionType === 'Farklet')) {
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

        plan.id = Date.now().toString();
        this.trainingRepository.save(plan);

        return plan;
    }

    _calculateInitialVolume(user, goalDistance, userLevel = 'beginner') {
        if (user && user.weeklyVolume && user.weeklyVolume > 0) {
            return parseFloat(user.weeklyVolume);
        }

        const level = userLevel;

        let pbVolume = null;
        if (user && user.pb) {
            const ref = user.pb['5k'] || user.pb['10k'];
            if (ref) {
                const totalSec = this.paceCalculator.timeToSeconds(ref);
                const is5k = Boolean(user.pb['5k']);
                const secPerKm = is5k ? (totalSec / 5) : (totalSec / 10);
                
                if (secPerKm < 270) pbVolume = 35;
                else if (secPerKm < 330) pbVolume = 25;
                else pbVolume = 15;
            }
        }

        let baseVolume = 15;

        if (goalDistance <= 6) {
            if (level === 'beginner') baseVolume = 15;
            else if (level === 'intermediate') baseVolume = 22;
            else baseVolume = 30;
        } else if (goalDistance <= 10) {
            if (level === 'beginner') baseVolume = 20;
            else if (level === 'intermediate') baseVolume = 30;
            else baseVolume = 40;
        } else if (goalDistance <= 21) {
            if (level === 'beginner') baseVolume = 30;
            else if (level === 'intermediate') baseVolume = 40;
            else baseVolume = 55;
        } else {
            if (level === 'beginner') baseVolume = 40;
            else if (level === 'intermediate') baseVolume = 55;
            else baseVolume = 70;
        }

        if (pbVolume && pbVolume > baseVolume) {
            baseVolume = Math.round((baseVolume + pbVolume) / 2);
        }

        return baseVolume;
    }

    _determineSessionType(day, index, totalDays, phaseType, userLevel = 'beginner', trainingMode = 'advanced') {
        if (trainingMode === 'simple') {
            if (day === 'Wednesday' || (totalDays > 3 && index === Math.floor(totalDays / 2))) {
                return 'Easy';
            }
            if (day === 'Sunday' || index === totalDays - 1) {
                return 'LongRun';
            }
            return 'Easy';
        }

        if (day === 'Wednesday' || (totalDays > 3 && index === Math.floor(totalDays / 2))) {
            return 'Strength';
        }

        if (day === 'Sunday' || index === totalDays - 1) {
            return 'LongRun';
        }

        const isBase = phaseType.includes('Base');
        const isSpecific = phaseType.includes('Specific') || phaseType.includes('Desarrollo');
        const isTaper = phaseType.includes('Tapering') || phaseType.includes('Asimilación');

        if (index === 0) {
            if (isBase) {
                if (userLevel === 'beginner') return 'Progression';
                return 'Hills';
            }
            if (isSpecific) {
                if (userLevel === 'beginner') return 'Farklet';
                return userLevel === 'intermediate' ? 'Tempo' : 'Intervals';
            }
            if (isTaper) {
                return 'Farklet';
            }
        }

        if (index === 1 && totalDays > 2) {
            if (isBase) return 'Incremental';
            if (isSpecific) return userLevel === 'beginner' ? 'Easy' : 'Farklet';
            if (isTaper) return 'Recovery';
        }

        if (isTaper) {
            return 'Recovery';
        }
        return 'Easy';
    }
}

module.exports = GeneratePlan;
