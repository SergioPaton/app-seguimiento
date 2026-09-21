const { NotFoundError } = require('../../dominio/shared/Errors');

/**
 * Servicio de Aplicación para eliminar una carrera del sistema.
 * 
 * @class DeleteRun
 */
class DeleteRun {
    /**
     * Crea una instancia del servicio.
     * 
     * @param {Object} runRepository - Repositorio de persistencia de carreras.
     */
    constructor(runRepository) {
        this.runRepository = runRepository;
    }

    /**
     * Ejecuta el caso de uso para eliminar una carrera por su identificador único.
     * Verifica la existencia de la carrera antes de proceder con su eliminación.
     * 
     * @param {string} id - Identificador de la carrera a eliminar.
     * @returns {boolean} Retorna true si la carrera fue eliminada exitosamente.
     * @throws {NotFoundError} Si la carrera con el ID especificado no existe.
     */
    execute(id) {
        const existingRun = this.runRepository.getById(id);
        if (!existingRun) {
            throw new NotFoundError('Carrera no encontrada.');
        }

        this.runRepository.delete(id);
        return true;
    }
}

module.exports = DeleteRun;