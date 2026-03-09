const { ValidationError } = require('../shared/Errors');
const UserValidator = require('./UserValidator');

/**
 * Clase de dominio que representa a un Usuario/Atleta.
 */
class User {
    constructor({ id, name, lastName, gender, age, pb, availableDays, rhr }) {
        this.id = id;
        this.name = name;
        this.lastName = lastName;
        this.gender = gender;
        this.age = parseInt(age);

        // Opcionales con valores por defecto
        this.pb = pb || {};
        this.availableDays = availableDays || [];
        this.rhr = rhr ? parseInt(rhr) : null;

        this._validate();
    }

    _validate() {
        UserValidator.validate({
            name: this.name,
            lastName: this.lastName,
            gender: this.gender,
            age: this.age,
            rhr: this.rhr
        });
    }

    /**
     * Añade una carrera al perfil del usuario.
     * Aquí podríamos validar si la carrera "encaja" con su perfil.
     */
    addRun(run) {
        if (run.userId !== this.id) {
            throw new ValidationError('Esta carrera no pertenece a este usuario.');
        }
        this.runs.push(run);
    }

    /**
     * Calcula zonas de entrenamiento basadas en la RHR.
     */
    calculateHeartRateZones(maxHr) {
        if (!this.rhr || !maxHr) return null;
        // Fórmula de Karvonen u otra...
        const reserve = maxHr - this.rhr;
        return {
            zone1: Math.round(this.rhr + reserve * 0.6),
            zone2: Math.round(this.rhr + reserve * 0.7),
            // ... etc
        };
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            lastName: this.lastName,
            gender: this.gender,
            age: this.age,
            pb: this.pb,
            availableDays: this.availableDays,
            rhr: this.rhr
        };
    }
}

module.exports = User;
