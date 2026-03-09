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

    execute({ userId, goalDistance, targetDate, targetTime, description }) {
        const user = this.userRepository.getById(userId);
        if (!user) {
            throw new ValidationError('User not found.');
        }

        const startDate = new Date();
        const endDate = new Date(targetDate);

        if (endDate <= startDate) {
            throw new ValidationError('Target date must be in the future.');
        }

        const plan = new TrainingPlan({
            userId,
            goal: { distance: goalDistance, description },
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
        });

        const diffTime = Math.abs(endDate - startDate);
        const totalWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));

        const phases = this.periodizationEngine.definePhases(totalWeeks);
        const zones = this.paceCalculator.calculateZones(user.pb || {});

        // Calculate Goal Pace if targetTime is provided
        let goalPace = null;
        if (targetTime) {
            const totalGoalSeconds = this.paceCalculator.timeToSeconds(targetTime);
            // If targetTime looks like a pace (e.g. 5:00), we don't divide by distance. 
            // If it looks like a total time (e.g. 45:00 for 10k), we divide.
            // Simple heuristic: if totalGoalSeconds < 15 * 60 (15 min), it's probably a pace per km (unless they are world record holders for 5k/10k)
            // But better: if it's 5km and time is e.g. 25:00, distance is 5.
            if (totalGoalSeconds > 15 * 60 || (goalDistance > 5 && totalGoalSeconds > 10 * 60)) {
                goalPace = this.paceCalculator.secondsToTime(totalGoalSeconds / goalDistance);
            } else {
                goalPace = targetTime;
            }
        }

        let currentWeek = 1;

        // Initial volume based on PB (if exists) or a safe default
        let lastWeekVolume = this._calculateInitialVolume(user.pb);

        phases.forEach(phase => {
            const mesociclo = new Mesociclo({ type: phase.type });

            for (let i = 0; i < phase.weeks; i++) {
                const weekStartDate = new Date(startDate);
                weekStartDate.setDate(startDate.getDate() + (currentWeek - 1) * 7);

                // Calculate volume for this week
                const weeklyVolume = this.progressionManager.calculateNextVolume(lastWeekVolume, currentWeek, phase.type);
                lastWeekVolume = weeklyVolume;

                const micro = new Microciclo({
                    weekNumber: currentWeek,
                    startDate: weekStartDate.toISOString().split('T')[0]
                });

                const days = user.availableDays && user.availableDays.length > 0
                    ? user.availableDays
                    : ['Monday', 'Wednesday', 'Friday'];

                days.forEach((day, index) => {
                    const sessionType = this._determineSessionType(day, index, days.length, phase.type);
                    const isLongRun = sessionType === 'LongRun';
                    const isStrength = sessionType === 'Strength';

                    // Weighted Distribution: Long Run gets ~35% of volume, others share the rest
                    let targetDistance;
                    if (isStrength) {
                        targetDistance = 0;
                    } else if (isLongRun) {
                        targetDistance = (weeklyVolume * 0.35);
                    } else {
                        const runningDays = days.filter(d => d !== 'Wednesday').length; // Simple proxy for non-strength days
                        const remainingVolume = weeklyVolume * 0.65;
                        targetDistance = remainingVolume / (runningDays > 0 ? runningDays : 1);
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
     * Estimates initial running volume based on existing PBs.
     */
    _calculateInitialVolume(pb) {
        if (!pb) return 15; // Safe default for brand new runners

        const ref = pb['5k'] || pb['10k'];
        if (!ref) return 20;

        // Estimate based on 5k pace (lower pace = higher volume capacity)
        const [min, sec] = ref.split(':').map(Number);
        const totalMin = min + (sec / 60);

        if (totalMin < 18) return 50; // High level
        if (totalMin < 22) return 35; // Intermediate
        if (totalMin < 26) return 25; // Casual
        return 15; // Beginner
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

        // Quality sessions in Specific phase
        if (phaseType.includes('Specific') && index === 0) {
            return Math.random() > 0.5 ? 'Intervals' : 'Farklet';
        }

        // Incremental runs for variety in Base phase
        if (phaseType.includes('Base') && index === 1) {
            return 'Incremental';
        }

        return 'Easy';
    }
}

module.exports = GeneratePlan;

