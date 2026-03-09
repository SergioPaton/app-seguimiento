const PlannedSession = require('./PlannedSession');

/**
 * Represents a Microciclo: a single week of training sessions.
 */
class Microciclo {
    constructor({ weekNumber, startDate, sessions = [] }) {
        this.weekNumber = weekNumber;
        this.startDate = startDate; // Monday of the week

        // Deep Reconstitution
        this.sessions = sessions.map(s => s instanceof PlannedSession ? s : new PlannedSession(s));
    }

    addSession(session) {
        this.sessions.push(session);
    }

    toJSON() {
        return {
            weekNumber: this.weekNumber,
            startDate: this.startDate,
            sessions: this.sessions.map(s => (typeof s.toJSON === 'function' ? s.toJSON() : s))
        };
    }
}

module.exports = Microciclo;
