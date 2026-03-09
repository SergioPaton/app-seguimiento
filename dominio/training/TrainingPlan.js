const { ValidationError } = require('../shared/Errors');
const Mesociclo = require('./Mesociclo');

/**
 * Top-level entity representing the Macrociclo of a training system.
 * Links the entire hierarchy to a user and a global goal.
 */
class TrainingPlan {
    constructor({ id, userId, goal, startDate, endDate, mesociclos = [] }) {
        this.id = id;
        this.userId = userId;
        this.goal = goal; // { distance: number, targetPace: string, description: string }
        this.startDate = startDate;
        this.endDate = endDate;

        // Deep Reconstitution
        this.mesociclos = mesociclos.map(m => m instanceof Mesociclo ? m : new Mesociclo(m));

        this._validate();
    }

    _validate() {
        if (!this.userId) {
            throw new ValidationError('A training plan must be linked to a user.');
        }
        if (!this.goal || !this.goal.distance) {
            throw new ValidationError('A training plan must have a distance goal.');
        }
        if (!this.startDate || !this.endDate) {
            throw new ValidationError('A training plan must have start and end dates.');
        }
    }

    addMesociclo(mesociclo) {
        this.mesociclos.push(mesociclo);
    }

    toJSON() {
        return {
            id: this.id,
            userId: this.userId,
            goal: this.goal,
            startDate: this.startDate,
            endDate: this.endDate,
            mesociclos: this.mesociclos.map(m => (typeof m.toJSON === 'function' ? m.toJSON() : m))
        };
    }
}

module.exports = TrainingPlan;
