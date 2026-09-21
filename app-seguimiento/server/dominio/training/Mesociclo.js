const Microciclo = require('./Microciclo');

/**
 * Representa un Mesociclo: un bloque temático de entrenamiento que abarca varias semanas (Microciclos).
 * 
 * @class Mesociclo
 */
class Mesociclo {
    /**
     * Crea una instancia de Mesociclo.
     * Reconstituye profundamente los microciclos asociados si no son ya instancias de la clase.
     * 
     * @param {Object} params - Parámetros de inicialización.
     * @param {string} params.type - Tipo/enfoque del mesociclo (ej: 'Base', 'Strength', 'Specific', 'Tapering').
     * @param {Array<Object|Microciclo>} [params.microciclos=[]] - Listado de microciclos que componen el mesociclo.
     */
    constructor({ type, microciclos = [] }) {
        this.type = type; // Ej: 'Base', 'Strength', 'Specific', 'Tapering'

        // Reconstitución profunda de instancias de Microciclo
        this.microciclos = microciclos.map(mc => mc instanceof Microciclo ? mc : new Microciclo(mc));
    }

    /**
     * Agrega un microciclo al final del mesociclo.
     * 
     * @param {Microciclo} microciclo - Instancia del microciclo a agregar.
     */
    addMicrociclo(microciclo) {
        this.microciclos.push(microciclo);
    }

    /**
     * Convierte el mesociclo a un formato de objeto plano (JSON).
     * 
     * @returns {Object} Representación JSON del mesociclo.
     */
    toJSON() {
        return {
            type: this.type,
            microciclos: this.microciclos.map(mc => (typeof mc.toJSON === 'function' ? mc.toJSON() : mc))
        };
    }
}

module.exports = Mesociclo;

