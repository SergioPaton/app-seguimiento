/**
 * Servicio para buscar una carrera por ID.
 */
class GetRunById {
    constructor(runRepository) {
        this.runRepository = runRepository;
    }

    execute(id) {
        const run = this.runRepository.getById(id);
        return run ? run.toJSON() : null;
    }
}

module.exports = GetRunById;
