const Microciclo = require('./Microciclo');

/**
 * Represents a Mesociclo: a thematic block of several weeks (Microciclos).
 */
class Mesociclo {
    constructor({ type, microciclos = [] }) {
        this.type = type; // e.g., 'Base', 'Strength', 'Specific', 'Tapering'

        // Deep Reconstitution
        this.microciclos = microciclos.map(mc => mc instanceof Microciclo ? mc : new Microciclo(mc));
    }

    addMicrociclo(microciclo) {
        this.microciclos.push(microciclo);
    }

    toJSON() {
        return {
            type: this.type,
            microciclos: this.microciclos.map(mc => (typeof mc.toJSON === 'function' ? mc.toJSON() : mc))
        };
    }
}

module.exports = Mesociclo;
