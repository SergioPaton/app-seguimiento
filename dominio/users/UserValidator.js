const { ValidationError } = require('../shared/Errors');

/**
 * Validador para la entidad de dominio User.
 */
class UserValidator {
    static validate(data) {
        this.validateName(data.name);
        this.validateLastName(data.lastName);
        this.validateGender(data.gender);
        this.validateAge(data.age);
        this.validateRhr(data.rhr);
    }

    static validateName(name) {
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            throw new ValidationError('El nombre es obligatorio.');
        }
        if (name.length > 50) {
            throw new ValidationError('el nombre es demasiado largo.');
        }
    }

    static validateLastName(lastName) {
        if (!lastName || typeof lastName !== 'string' || lastName.trim().length === 0) {
            throw new ValidationError('El apellido es obligatorio.');
        }
        if (lastName.length > 50) {
            throw new ValidationError('El apellido es demasiado largo.');
        }
    }

    static validateGender(gender) {
        const validGenders = ['M', 'F', 'Otro'];
        if (!gender || !validGenders.includes(gender)) {
            throw new ValidationError('El sexo es obligatorio y debe ser M, F o Otro.');
        }
    }

    static validateAge(age) {
        const a = parseInt(age);
        if (isNaN(a) || a < 0 || a > 120) {
            throw new ValidationError('La edad es obligatoria y debe ser un número entre 0 y 120.');
        }
    }

    static validateRhr(rhr) {
        if (rhr === undefined || rhr === null) return;
        const rate = parseInt(rhr);
        if (isNaN(rate) || rate < 30 || rate > 220) {
            throw new ValidationError('La frecuencia cardíaca en reposo parece irreal.');
        }
    }

    // Se podrían añadir validaciones para PBs o días disponibles si fuera necesario
}

module.exports = UserValidator;
