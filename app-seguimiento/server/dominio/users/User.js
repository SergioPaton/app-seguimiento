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
     * @param {number} [params.weeklyVolume] - Volumen semanal habitual/deseado en km.
     * @param {number[]} [params.paceHistory] - Historial de ritmos registrados en min/km (auto-actualizado).
     */
    constructor({ id, name, lastName, gender, age, pb, availableDays, rhr, password, level, weeklyVolume, paceHistory }) {
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

        // Historial de ritmos (auto-actualizado al registrar carreras)
        this.paceHistory = paceHistory && Array.isArray(paceHistory) ? paceHistory : [];

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
        if (!this.runs) this.runs = [];
        this.runs.push(run);
    }

    /**
     * Registra un ritmo (min/km) en el historial de rendimiento del usuario.
     * Mantiene solo las últimas 10 marcas para calibración.
     * 
     * @param {number} pacePerKm - Ritmo en minutos por kilómetro.
     */
    addPaceToHistory(pacePerKm) {
        if (!this.paceHistory) this.paceHistory = [];
        this.paceHistory.push(parseFloat(pacePerKm.toFixed(2)));
        if (this.paceHistory.length > 10) {
            this.paceHistory.shift();
        }
    }

    /**
     * Calcula el nivel dinámico basado en el historial de ritmos si está disponible.
     * 
     * @returns {string} Nivel recalculado ('beginner', 'intermediate' o 'advanced').
     */
    getDynamicLevel() {
        if (!this.paceHistory || this.paceHistory.length < 3) {
            return this.level;
        }
        const avgPace = this.paceHistory.reduce((a, b) => a + b, 0) / this.paceHistory.length;
        if (avgPace < 4.5) return 'advanced';
        if (avgPace < 5.5) return 'intermediate';
        return 'beginner';
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
            weeklyVolume: this.weeklyVolume,
            paceHistory: this.paceHistory || []
        };
    }
}

module.exports = User;
