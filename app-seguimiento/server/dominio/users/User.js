const { ValidationError } = require('../shared/Errors');
const UserValidator = require('./UserValidator');

/**
 * Clase de dominio que representa a un Usuario/Atleta.
 * Encapsula las propiedades de un atleta, la validación de sus datos y las reglas del dominio asociadas.
 * 
 * @class User
 */
class User {
    /**
     * Crea una instancia de un Usuario/Atleta.
     * 
     * @param {Object} params - Datos para inicializar el usuario.
     * @param {string} params.id - Identificador único del usuario.
     * @param {string} params.name - Nombre del usuario.
     * @param {string} params.lastName - Apellido(s) del usuario.
     * @param {string} params.gender - Género del usuario ('M', 'F' u otro).
     * @param {number|string} params.age - Edad del usuario en años.
     * @param {Object} [params.pb] - Mejores marcas personales (Personal Bests).
     * @param {string[]} [params.availableDays] - Días disponibles de entrenamiento a la semana (ej: ['Lunes', 'Miércoles']).
     * @param {number|string} [params.rhr] - Frecuencia cardíaca en reposo (Resting Heart Rate).
     * @param {string} [params.password] - Contraseña de acceso. Por defecto es '1234'.
     * @param {string} [params.level] - Nivel de experiencia del atleta ('beginner', 'intermediate', 'advanced').
     */
    constructor({ id, name, lastName, gender, age, pb, availableDays, rhr, password, level, weeklyVolume }) {
        this.id = id;
        this.name = name;
        this.lastName = lastName;
        this.gender = gender;
        this.age = parseInt(age);

        // Opcionales con valores por defecto
        this.pb = pb || {};
        this.availableDays = availableDays || [];
        this.rhr = rhr ? parseInt(rhr) : null;
        
        // Contraseña por defecto si no existe para compatibilidad de base de datos
        this.password = password || '1234';

        // Nivel de experiencia del atleta
        this.level = level || 'beginner';
        this.weeklyVolume = weeklyVolume ? parseFloat(weeklyVolume) : null;

        this._validate();
    }

    /**
     * Valida de forma interna los datos del usuario delegando en el validador del dominio.
     * 
     * @private
     * @throws {ValidationError} Si alguna regla de validación de usuario no se cumple.
     */
    _validate() {
        UserValidator.validate({
            name: this.name,
            lastName: this.lastName,
            gender: this.gender,
            age: this.age,
            rhr: this.rhr,
            password: this.password,
            level: this.level,
            weeklyVolume: this.weeklyVolume
        });
    }

    /**
     * Añade una carrera al perfil del usuario.
     * Valida que la carrera pertenezca realmente al ID de este usuario antes de asociarla.
     * 
     * @param {Object} run - Instancia o datos de la carrera.
     * @throws {ValidationError} Si la carrera no pertenece a este usuario.
     */
    addRun(run) {
        if (run.userId !== this.id) {
            throw new ValidationError('Esta carrera no pertenece a este usuario.');
        }
        this.runs.push(run);
    }

    /**
     * Calcula las zonas de frecuencia cardíaca de entrenamiento basadas en la fórmula de Karvonen
     * a partir de la Frecuencia Cardíaca en Reposo (RHR) y una Frecuencia Cardíaca Máxima (MaxHR) estimada.
     * 
     * @param {number} maxHr - Frecuencia cardíaca máxima.
     * @returns {Object|null} Objeto con los límites de pulsaciones para cada zona, o null si faltan datos.
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

    /**
     * Serializa los datos del usuario a un formato plano (objeto JSON).
     * 
     * @returns {Object} Representación JSON del usuario.
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            lastName: this.lastName,
            gender: this.gender,
            age: this.age,
            pb: this.pb,
            availableDays: this.availableDays,
            rhr: this.rhr,
            password: this.password,
            level: this.level,
            weeklyVolume: this.weeklyVolume
        };
    }
}

module.exports = User;

