const { ValidationError } = require('../shared/Errors');

/**
 * Validador para la entidad de dominio User (Usuario/Atleta).
 * Proporciona métodos estáticos para asegurar que los datos del perfil del usuario cumplan con las reglas de negocio.
 * 
 * @class UserValidator
 */
class UserValidator {
    /**
     * Valida integralmente todos los campos obligatorios y opcionales de un usuario.
     * 
     * @param {Object} data - Objeto con los datos del usuario.
     * @param {string} data.name - Nombre del usuario.
     * @param {string} data.lastName - Apellido del usuario.
     * @param {string} data.gender - Género del usuario.
     * @param {number|string} data.age - Edad del usuario.
     * @param {number|string} [data.rhr] - Frecuencia cardíaca en reposo.
     * @param {string} data.password - Contraseña del usuario.
     */
    static validate(data) {
        this.validateName(data.name);
        this.validateLastName(data.lastName);
        this.validateGender(data.gender);
        this.validateAge(data.age);
        this.validateRhr(data.rhr);
        this.validatePassword(data.password);
        this.validateLevel(data.level);
        this.validateWeeklyVolume(data.weeklyVolume);
    }

    /**
     * Valida la contraseña del usuario.
     * 
     * @param {string} password - Contraseña a validar.
     * @throws {ValidationError} Si la contraseña es vacía, no es cadena o tiene menos de 4 caracteres.
     */
    static validatePassword(password) {
        if (!password || typeof password !== 'string' || password.trim().length === 0) {
            throw new ValidationError('La contraseña es obligatoria.');
        }
        if (password.length < 4) {
            throw new ValidationError('La contraseña debe tener al menos 4 caracteres.');
        }
    }

    /**
     * Valida el nombre del usuario.
     * 
     * @param {string} name - Nombre a validar.
     * @throws {ValidationError} Si el nombre está vacío o supera los 50 caracteres.
     */
    static validateName(name) {
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            throw new ValidationError('El nombre es obligatorio.');
        }
        if (name.length > 50) {
            throw new ValidationError('el nombre es demasiado largo.');
        }
    }

    /**
     * Valida el apellido del usuario.
     * 
     * @param {string} lastName - Apellido a validar.
     * @throws {ValidationError} Si el apellido está vacío o supera los 50 caracteres.
     */
    static validateLastName(lastName) {
        if (!lastName || typeof lastName !== 'string' || lastName.trim().length === 0) {
            throw new ValidationError('El apellido es obligatorio.');
        }
        if (lastName.length > 50) {
            throw new ValidationError('El apellido es demasiado largo.');
        }
    }

    /**
     * Valida el género del usuario.
     * 
     * @param {string} gender - Género a validar.
     * @throws {ValidationError} Si el género no es uno de los permitidos ('M', 'F', 'Otro').
     */
    static validateGender(gender) {
        const validGenders = ['M', 'F', 'Otro'];
        if (!gender || !validGenders.includes(gender)) {
            throw new ValidationError('El sexo es obligatorio y debe ser M, F o Otro.');
        }
    }

    /**
     * Valida la edad del usuario.
     * 
     * @param {number|string} age - Edad a validar.
     * @throws {ValidationError} Si la edad no es un número válido o está fuera del rango [0, 120].
     */
    static validateAge(age) {
        const a = parseInt(age);
        if (isNaN(a) || a < 0 || a > 120) {
            throw new ValidationError('La edad es obligatoria y debe ser un número entre 0 y 120.');
        }
    }

    /**
     * Valida la frecuencia cardíaca en reposo (RHR) si está presente.
     * 
     * @param {number|string|null|undefined} rhr - Frecuencia cardíaca en reposo.
     * @throws {ValidationError} Si el valor numérico no está en un rango razonable [30, 220].
     */
    static validateRhr(rhr) {
        if (rhr === undefined || rhr === null) return;
        const rate = parseInt(rhr);
        if (isNaN(rate) || rate < 30 || rate > 220) {
            throw new ValidationError('La frecuencia cardíaca en reposo parece irreal.');
        }
    }

    /**
     * Valida el nivel de experiencia del atleta.
     * 
     * @param {string|null|undefined} level - Nivel de experiencia.
     * @throws {ValidationError} Si el valor no es uno de los permitidos.
     */
    static validateLevel(level) {
        if (level === undefined || level === null || level === '') return;
        const validLevels = ['beginner', 'intermediate', 'advanced'];
        if (!validLevels.includes(level)) {
            throw new ValidationError('El nivel de experiencia debe ser beginner, intermediate o advanced.');
        }
    }

    /**
     * Valida el volumen semanal habitual/deseado si está presente.
     * 
     * @param {number|string|null|undefined} weeklyVolume - Volumen en km.
     * @throws {ValidationError} Si el valor es negativo o irreal.
     */
    static validateWeeklyVolume(weeklyVolume) {
        if (weeklyVolume === undefined || weeklyVolume === null || weeklyVolume === '') return;
        const vol = parseFloat(weeklyVolume);
        if (isNaN(vol) || vol < 0 || vol > 300) {
            throw new ValidationError('El volumen semanal debe ser un número entre 0 y 300 km.');
        }
    }
}

module.exports = UserValidator;

