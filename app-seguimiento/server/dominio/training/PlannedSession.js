/**
 * Representa una única sesión de entrenamiento planificada.
 * Define los objetivos de una sesión específica (distancia, duración, ritmo) y hace seguimiento de su estado de completitud.
 * 
 * @class PlannedSession
 */
class PlannedSession {
    /**
     * Crea una instancia de PlannedSession.
     * 
     * @param {Object} params - Parámetros de inicialización.
     * @param {string} params.id - Identificador único de la sesión.
     * @param {string|number} params.day - Día asignado para la sesión (ej: 'Lunes', 'Martes' o un número del 1 al 7).
     * @param {string} params.type - Tipo de sesión (ej: 'Easy Run', 'Intervals', 'Long Run').
     * @param {string} params.description - Descripción detallada del entrenamiento.
     * @param {number} params.targetDistance - Distancia objetivo en kilómetros.
     * @param {number} params.targetDuration - Duración objetivo en minutos.
     * @param {string} params.targetPace - Ritmo objetivo (ej: "5:30").
     * @param {string} [params.status='planned'] - Estado actual de la sesión ('planned', 'completed', 'skipped').
     */
    constructor({ id, day, type, description, targetDistance, targetDuration, targetPace, status = 'planned' }) {
        this.id = id;
        this.day = day; // Ej: 'Monday', 'Tuesday' o del 1 al 7
        this.type = type; // Ej: 'Easy Run', 'Intervals', 'Long Run'
        this.description = description;
        this.targetDistance = targetDistance;
        this.targetDuration = targetDuration;
        this.targetPace = targetPace;
        this.status = status; // 'planned', 'completed', 'skipped'
        this.realRunId = null; // Enlace a la entidad Run una vez completada
    }

    /**
     * Marca la sesión planificada como completada asociándole el identificador de una carrera real.
     * 
     * @param {string} runId - Identificador único de la carrera completada en el sistema.
     */
    complete(runId) {
        this.status = 'completed';
        this.realRunId = runId;
    }

    /**
     * Convierte la sesión planificada a un formato de objeto plano (JSON).
     * 
     * @returns {Object} Representación JSON de la sesión planificada.
     */
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

