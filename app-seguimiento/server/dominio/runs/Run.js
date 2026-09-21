const { ValidationError } = require('../shared/Errors');
const RunValidator = require('./RunValidator');

/**
 * Clase de dominio que representa una carrera (Run).
 * Centraliza las reglas de negocio, validaciones y cálculos específicos de una actividad de carrera.
 * 
 * @class Run
 */
class Run {
    /**
     * Crea una instancia de la entidad Run.
     * Realiza validaciones y procesa/calcula el ritmo (pace) de la carrera.
     * 
     * @param {Object} params - Parámetros de inicialización.
     * @param {string} params.id - Identificador único de la carrera.
     * @param {string} params.userId - Identificador del usuario que realizó la carrera.
     * @param {number|string} params.distance - Distancia de la carrera en kilómetros.
     * @param {number|string} params.duration - Duración de la carrera en minutos.
     * @param {number|string} [params.pace] - Ritmo de carrera proporcionado (min/km). Si no se provee, se calcula.
     * @param {string} [params.note] - Nota u observación de la carrera.
     * @param {string} [params.date] - Fecha de la carrera en formato ISO. Si no se provee, se usa la fecha actual.
     * @param {boolean} [params.force] - Bandera para omitir advertencias de discrepancia en el ritmo (bypass).
     */
    constructor({ id, userId, distance, duration, pace, note, date, force }) {
        this.id = id;
        this.userId = userId;
        this.date = date || new Date().toISOString();
        this.distance = parseFloat(distance);
        this.duration = parseInt(duration);
        this.note = RunValidator.sanitizeNote(note);

        // Ejecutar validaciones del dominio de carrera delegando en RunValidator
        RunValidator.validate({
            userId: this.userId,
            distance: this.distance,
            duration: this.duration,
            date: this.date
        });

        this.pace = this._processPace(pace, force);
    }

    /**
     * Procesa y valida el ritmo de la carrera.
     * Calcula el ritmo a partir de la duración y la distancia, lo compara con el ritmo provisto
     * y delega su validación a RunValidator.
     * 
     * @private
     * @param {number|string|undefined} providedPace - Ritmo proporcionado externamente.
     * @param {boolean} force - Si es true, ignora advertencias por discrepancia en el ritmo.
     * @returns {string} El ritmo formateado a dos decimales.
     */
    _processPace(providedPace, force) {
        const calculatedPace = parseFloat((this.duration / this.distance).toFixed(2));

        // Validación de ritmo delegada con soporte para bypass de avisos
        RunValidator.validatePace(calculatedPace, providedPace, force);

        return providedPace ? parseFloat(providedPace).toFixed(2) : calculatedPace.toFixed(2);
    }

    /**
     * Obtiene la fecha actual formateada en ISO string.
     * 
     * @private
     * @returns {string} Fecha y hora actual en formato ISO.
     */
    _getCurrentDate() {
        return new Date().toISOString();
    }

    /**
     * Devuelve una representación en objeto plano (JSON) para persistencia o transporte.
     * 
     * @returns {Object} Representación JSON de la carrera.
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

