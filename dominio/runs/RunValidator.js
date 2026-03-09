const { ValidationError, ConfirmationRequiredError } = require('../shared/Errors');

/**
 * Validador para la entidad de dominio Run.
 */
class RunValidator {
    static validate(data) {
        this.validateUserId(data.userId);
        this.validateDistance(data.distance);
        this.validateDuration(data.duration);
        this.validateDate(data.date);
    }

    static validateUserId(userId) {
        if (!userId) {
            throw new ValidationError('El ID de usuario es obligatorio para registrar una carrera.');
        }
    }

    static validateDistance(distance) {
        // Validación de tipo estricta
        if (typeof distance !== 'number' && isNaN(Number(distance))) {
            throw new ValidationError('La distancia debe ser un valor numérico.');
        }

        const d = parseFloat(distance);
        if (d <= 0) {
            throw new ValidationError('La distancia es obligatoria y debe ser un número positivo.');
        }
        if (d > 500) {
            throw new ValidationError('La distancia parece irreal (máximo 500km).');
        }

        // Limitar decimales (máximo 3) para precisión técnica
        const decimalPart = distance.toString().split('.')[1];
        if (decimalPart && decimalPart.length > 3) {
            throw new ValidationError('La distancia no puede tener más de 3 decimales.');
        }
    }

    static validateDuration(duration) {
        if (typeof duration !== 'number' && isNaN(Number(duration))) {
            throw new ValidationError('La duración debe ser un valor numérico.');
        }
        if (parseFloat(duration) <= 0) {
            throw new ValidationError('La duración debe ser un número positivo.');
        }
    }

    static validateDate(dateStr) {
        if (!dateStr) return;

        // Validar formato ISO simplificado (YYYY-MM-DD...)
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
            throw new ValidationError('La fecha proporcionada no es válida (debe ser formato ISO).');
        }

        if (date.getFullYear() < 2000) {
            throw new ValidationError('No se permiten fechas anteriores al año 2000.');
        }

        if (date > new Date()) {
            throw new ValidationError('No puedes registrar carreras en el futuro.');
        }
    }

    static validatePace(calculatedPace, providedPace, force = false) {
        // Validación de ritmo eliminada por petición del usuario
    }

    static sanitizeNote(note) {
        if (!note) return '';

        // Evitar payloads gigantes antes de procesar
        if (note.toString().length > 1000) {
            throw new ValidationError('La nota excede el límite de tamaño permitido.');
        }

        const cleanNote = note.toString().replace(/<[^>]*>?/gm, '').trim();
        if (cleanNote.length > 200) {
            throw new ValidationError('La nota es demasiado larga (máximo 200 caracteres tras limpieza).');
        }
        return cleanNote;
    }
}

module.exports = RunValidator;
