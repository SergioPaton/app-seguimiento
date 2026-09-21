const PlannedSession = require('./PlannedSession');

/**
 * Representa un Microciclo: una única semana del plan de entrenamiento que agrupa sesiones planificadas.
 * 
 * @class Microciclo
 */
class Microciclo {
    /**
     * Crea una instancia de Microciclo.
     * Reconstituye profundamente las sesiones asociadas si no son instancias de PlannedSession.
     * 
     * @param {Object} params - Parámetros de inicialización.
     * @param {number} params.weekNumber - Número secuencial de la semana dentro del plan.
     * @param {string} params.startDate - Fecha de inicio de la semana (por lo general, el lunes) en formato YYYY-MM-DD.
     * @param {Array<Object|PlannedSession>} [params.sessions=[]] - Lista de sesiones planificadas para este microciclo.
     */
    constructor({ weekNumber, startDate, sessions = [] }) {
        this.weekNumber = weekNumber;
        this.startDate = startDate; // Lunes de la semana

        // Reconstitución profunda de las sesiones
        this.sessions = sessions.map(s => s instanceof PlannedSession ? s : new PlannedSession(s));
    }

    /**
     * Agrega una sesión planificada al microciclo.
     * 
     * @param {PlannedSession} session - Sesión de entrenamiento a agregar.
     */
    addSession(session) {
        this.sessions.push(session);
    }

    /**
     * Convierte el microciclo a un formato de objeto plano (JSON).
     * 
     * @returns {Object} Representación JSON del microciclo.
     */
    toJSON() {
        return {
            weekNumber: this.weekNumber,
            startDate: this.startDate,
            sessions: this.sessions.map(s => (typeof s.toJSON === 'function' ? s.toJSON() : s))
        };
    }
}

module.exports = Microciclo;

