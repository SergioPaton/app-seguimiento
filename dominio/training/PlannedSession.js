/**
 * Represents a single planned workout session.
 */
class PlannedSession {
    constructor({ id, day, type, description, targetDistance, targetDuration, targetPace, status = 'planned' }) {
        this.id = id;
        this.day = day; // e.g., 'Monday', 'Tuesday' or 1-7
        this.type = type; // e.g., 'Easy Run', 'Intervals', 'Long Run'
        this.description = description;
        this.targetDistance = targetDistance;
        this.targetDuration = targetDuration;
        this.targetPace = targetPace;
        this.status = status; // 'planned', 'completed', 'skipped'
        this.realRunId = null; // Link to the Run entity when completed
    }

    complete(runId) {
        this.status = 'completed';
        this.realRunId = runId;
    }

    toJSON() {
        return {
            id: this.id,
            day: this.day,
            type: this.type,
            description: this.description,
            targetDistance: this.targetDistance,
            targetDuration: this.targetDuration,
            targetPace: this.targetPace,
            status: this.status,
            realRunId: this.realRunId
        };
    }
}

module.exports = PlannedSession;
