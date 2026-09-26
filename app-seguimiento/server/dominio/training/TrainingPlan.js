const { ValidationError } = require('../shared/Errors');
const Mesociclo = require('./Mesociclo');

/**
 * Entidad de nivel superior que representa el Macrociclo del plan de entrenamiento.
 * Vincula toda la jerarquía de entrenamiento (Mesociclos, Microciclos y Sesiones) a un usuario y a un objetivo global.
 * 
 * @class TrainingPlan
 */
class TrainingPlan {
    /**
     * Crea una instancia de TrainingPlan.
     * Reconstituye profundamente los mesociclos asociados si no son instancias de Mesociclo.
     * 
     * @param {Object} params - Parámetros de inicialización.
     * @param {string} params.id - Identificador único del plan de entrenamiento.
     * @param {string} params.userId - Identificador del usuario/atleta asociado al plan.
     * @param {Object} params.goal - Objetivo del plan de entrenamiento.
     * @param {number} params.goal.distance - Distancia objetivo en kilómetros (ej: 10, 21.097, 42.195).
     * @param {string} [params.goal.targetPace] - Ritmo objetivo en formato "MM:SS".
     * @param {string} [params.goal.description] - Descripción del objetivo.
     * @param {string} params.startDate - Fecha de inicio del plan (YYYY-MM-DD).
     * @param {string} params.endDate - Fecha de finalización del plan (YYYY-MM-DD).
     * @param {Array<Object|Mesociclo>} [params.mesociclos=[]] - Lista de mesociclos que estructuran el plan.
     */
    constructor({ id, userId, goal, startDate, endDate, isGeneric = false, isLoopable = false, cycleWeeks = null, cycleNumber = 1, level = 'beginner', mesociclos = [] }) {
        this.id = id;
        this.userId = userId;
        this.goal = goal; // { distance: number, targetPace: string, description: string }
        this.startDate = startDate;
        this.endDate = endDate;
        this.isGeneric = isGeneric;
        this.isLoopable = isLoopable;
        this.cycleWeeks = cycleWeeks;
        this.cycleNumber = cycleNumber;
        this.level = level;

        // Reconstitución profunda de mesociclos
        this.mesociclos = mesociclos.map(m => m instanceof Mesociclo ? m : new Mesociclo(m));

        this._validate();
    }

    /**
     * Realiza las validaciones de negocio internas de la entidad TrainingPlan.
     * 
     * @private
     * @throws {ValidationError} Si faltan datos clave del plan (usuario, objetivo de distancia, fechas).
     */
    _validate() {
        if (!this.userId) {
            throw new ValidationError('El plan de entrenamiento debe estar vinculado a un usuario.');
        }
        if (!this.goal || !this.goal.distance) {
            throw new ValidationError('El plan de entrenamiento debe tener un objetivo de distancia.');
        }
        if (!this.startDate || !this.endDate) {
            throw new ValidationError('El plan de entrenamiento debe tener fechas de inicio y fin.');
        }
    }

    /**
     * Agrega un mesociclo a la estructura del plan de entrenamiento.
     * 
     * @param {Mesociclo} mesociclo - Bloque de mesociclo a agregar.
     */
    addMesociclo(mesociclo) {
        this.mesociclos.push(mesociclo);
    }

    /**
     * Convierte la entidad de plan de entrenamiento a un formato de objeto plano (JSON).
     * 
     * @returns {Object} Representación JSON del plan de entrenamiento.
     */
    toJSON() {
        return {
            id: this.id,
            userId: this.userId,
            goal: this.goal,
            startDate: this.startDate,
            endDate: this.endDate,
            isGeneric: Boolean(this.isGeneric),
            isLoopable: Boolean(this.isLoopable),
            cycleWeeks: this.cycleWeeks || null,
            cycleNumber: this.cycleNumber || 1,
            level: this.level || 'beginner',
            mesociclos: this.mesociclos.map(m => (typeof m.toJSON === 'function' ? m.toJSON() : m))
        };
    }
}

module.exports = TrainingPlan;

