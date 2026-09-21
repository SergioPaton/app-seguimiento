const { ValidationError, ConfirmationRequiredError } = require('../shared/Errors');

/**
 * Validador para la entidad de dominio Run (Carrera).
 * Contiene reglas de negocio estrictas para validar y sanitizar los datos de una carrera.
 * 
 * @class RunValidator
 */
class RunValidator {
    /**
     * Valida de manera integral todos los campos principales de una carrera.
     * 
     * @param {Object} data - Objeto con los datos de la carrera a validar.
     * @param {string} data.userId - Identificador del usuario.
     * @param {number|string} data.distance - Distancia de la carrera.
     * @param {number|string} data.duration - Duración de la carrera.
     * @param {string} data.date - Fecha de la carrera.
     */
    static validate(data) {
        this.validateUserId(data.userId);
        this.validateDistance(data.distance);
        this.validateDuration(data.duration);
        this.validateDate(data.date);
    }

    /**
     * Valida que el ID de usuario esté presente.
     * 
     * @param {string} userId - Identificador de usuario.
     * @throws {ValidationError} Si el ID de usuario no es válido o está ausente.
     */
    static validateUserId(userId) {
        if (!userId) {
            throw new ValidationError('El ID de usuario es obligatorio para registrar una carrera.');
        }
    }

    /**
     * Valida la distancia de la carrera aplicando restricciones de tipo, rango y precisión.
     * 
     * @param {number|string} distance - Distancia a validar.
     * @throws {ValidationError} Si la distancia es negativa, excede el límite razonable o tiene demasiada precisión decimal.
     */
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

    /**
     * Valida la duración de la carrera en minutos.
     * 
     * @param {number|string} duration - Duración en minutos a validar.
     * @throws {ValidationError} Si el valor no es numérico o es menor o igual a cero.
     */
    static validateDuration(duration) {
        if (typeof duration !== 'number' && isNaN(Number(duration))) {
            throw new ValidationError('La duración debe ser un valor numérico (segundos).');
        }
        const d = parseFloat(duration);
        if (d <= 0) {
            throw new ValidationError('La duración debe ser un número positivo.');
        }
        // Mínimo 30 segundos (evitar registros accidentales vacíos)
        if (d < 30) {
            throw new ValidationError('La duración mínima de una carrera es de 30 segundos.');
        }
        // Máximo 24 horas en segundos (86400s) para evitar datos erróneos
        if (d > 86400) {
            throw new ValidationError('La duración parece irreal (máximo 24 horas).');
        }
    }

    /**
     * Valida la fecha de la carrera. Asegura que tenga formato ISO válido,
     * no sea anterior al año 2000 y no pertenezca al futuro.
     * 
     * @param {string} dateStr - Cadena de fecha en formato ISO.
     * @throws {ValidationError} Si la fecha es inválida, anterior a 2000 o futura.
     */
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

    /**
     * Valida el ritmo de carrera provisto vs el calculado.
     * Nota: La validación de ritmo fue eliminada por requerimiento, pero se conserva la firma para compatibilidad.
     * 
     * @param {number} calculatedPace - Ritmo calculado en minutos/km.
     * @param {number|string} providedPace - Ritmo proporcionado.
     * @param {boolean} [force=false] - Bandera de omisión de alertas.
     */
    static validatePace(calculatedPace, providedPace, force = false) {
        // Validación de ritmo eliminada por petición del usuario
    }

    /**
     * Sanitiza la nota de la carrera eliminando etiquetas HTML y controlando el tamaño máximo.
     * 
     * @param {string} note - Nota de carrera a sanitizar.
     * @returns {string} Nota limpia y recortada.
     * @throws {ValidationError} Si la nota original o la resultante exceden los límites de tamaño.
     */
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

