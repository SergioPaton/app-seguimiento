/**
 * @file Errors.js
 * @description Jerarquía de clases de error específicas del dominio para el manejo estructurado de excepciones.
 */

/**
 * Clase base para todos los errores de dominio.
 * Hereda de la clase nativa Error.
 * 
 * @class DomainError
 * @extends Error
 */
class DomainError extends Error {
    /**
     * Crea una instancia de DomainError.
     * @param {string} message - El mensaje descriptivo del error.
     */
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Error lanzado cuando falla alguna validación de las reglas de negocio o datos de entrada.
 * (Generalmente mapeado a un código de respuesta HTTP 400 Bad Request).
 * 
 * @class ValidationError
 * @extends DomainError
 */
class ValidationError extends DomainError {
    /**
     * Crea una instancia de ValidationError.
     * @param {string} message - El mensaje descriptivo del error de validación.
     */
    constructor(message) {
        super(message);
    }
}

/**
 * Error lanzado cuando no se encuentra un recurso solicitado (usuario, carrera, plan, etc.).
 * (Generalmente mapeado a un código de respuesta HTTP 404 Not Found).
 * 
 * @class NotFoundError
 * @extends DomainError
 */
class NotFoundError extends DomainError {
    /**
     * Crea una instancia de NotFoundError.
     * @param {string} message - El mensaje descriptivo de la entidad no encontrada.
     */
    constructor(message) {
        super(message);
    }
}

/**
 * Error lanzado cuando los datos de entrada son válidos pero atípicos o sospechosos,
 * requiriendo una confirmación explícita adicional por parte del usuario.
 * (Generalmente mapeado a un código de respuesta HTTP 409 Conflict).
 * 
 * @class ConfirmationRequiredError
 * @extends DomainError
 */
class ConfirmationRequiredError extends DomainError {
    /**
     * Crea una instancia de ConfirmationRequiredError.
     * @param {string} message - El mensaje descriptivo que detalla la anomalía que requiere confirmación.
     */
    constructor(message) {
        super(message);
    }
}

module.exports = {
    DomainError,
    ValidationError,
    NotFoundError,
    ConfirmationRequiredError
};

