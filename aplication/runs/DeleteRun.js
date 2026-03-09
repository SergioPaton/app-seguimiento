const { NotFoundError } = require('../../dominio/shared/Errors');

/**
 * Servicio para eliminar una carrera.
 */
class DeleteRun {
    constructor(runRepository) {
        this.runRepository = runRepository;
    }

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