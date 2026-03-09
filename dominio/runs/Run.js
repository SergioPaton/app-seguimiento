const { ValidationError } = require('../shared/Errors');
const RunValidator = require('./RunValidator');

/**
 * Clase de dominio que representa una carrera (Run).
 * Centraliza las validaciones y cálculos de negocio.
 */
class Run {
    constructor({ id, userId, distance, duration, pace, note, date, force }) {
        this.id = id;
        this.userId = userId;
        this.date = date || new Date().toISOString();
        this.distance = parseFloat(distance);
        this.duration = parseInt(duration);
        this.note = RunValidator.sanitizeNote(note);

        // Ejecutar validaciones externas
        RunValidator.validate({
            userId: this.userId,
            distance: this.distance,
            duration: this.duration,
            date: this.date
        });

        this.pace = this._processPace(pace, force);
    }

    _processPace(providedPace, force) {
        const calculatedPace = parseFloat((this.duration / this.distance).toFixed(2));

        // Validación de ritmo delegada con soporte para bypass de avisos
        RunValidator.validatePace(calculatedPace, providedPace, force);

        return providedPace ? parseFloat(providedPace).toFixed(2) : calculatedPace.toFixed(2);
    }

    _getCurrentDate() {
        return new Date().toISOString();
    }

    /**
     * Devuelve una representación plana para persistencia.
     */
    toJSON() {
        return {
            id: this.id,
            userId: this.userId,
            date: this.date,
            distance: this.distance,
            duration: this.duration,
            pace: this.pace,
            note: this.note
        };
    }
}

module.exports = Run;
