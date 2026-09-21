/**
 * Servicio de Aplicación para buscar y obtener los detalles de una carrera específica por su ID.
 * 
 * @class GetRunById
 */
class GetRunById {
    /**
     * Crea una instancia del servicio.
     * 
     * @param {Object} runRepository - Repositorio de persistencia de carreras.
     */
    constructor(runRepository) {
        this.runRepository = runRepository;
    }

    /**
     * Ejecuta el caso de uso para buscar una carrera por su identificador único.
     * 
     * @param {string} id - Identificador de la carrera buscada.
     * @returns {Object|null} El objeto plano de la carrera (JSON) o null si no se encuentra.
     */
    execute(id) {
        const run = this.runRepository.getById(id);
        return run ? run.toJSON() : null;
    }
}

module.exports = GetRunById;

