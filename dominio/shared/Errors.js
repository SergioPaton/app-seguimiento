/**
 * Error base para el dominio.
 */
class DomainError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Error lanzado cuando una validación falla (Equivalente a HTTP 400).
 */
class ValidationError extends DomainError {
    constructor(message) {
        super(message);
    }
}

/**
 * Error lanzado cuando un recurso no existe (Equivalente a HTTP 404).
 */
class NotFoundError extends DomainError {
    constructor(message) {
        super(message);
    }
}

/**
 * Error lanzado cuando los datos son sospechosos y requieren confirmación (Equivalente a HTTP 409 o sub-error 400).
 */
class ConfirmationRequiredError extends DomainError {
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
