/**
 * Servicio para listar todas las carreras.
 */
class GetAllRuns {
    constructor(runRepository) {
        this.runRepository = runRepository;
    }

    execute() {
        return this.runRepository.getAll().map(run => run.toJSON());
    }
}

module.exports = GetAllRuns;
