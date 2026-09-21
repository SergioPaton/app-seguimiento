/**
 * Servicio de Aplicación para obtener la lista de todas las carreras registradas en el sistema.
 * 
 * @class GetAllRuns
 */
class GetAllRuns {
    /**
     * Crea una instancia del servicio.
     * 
     * @param {Object} runRepository - Repositorio de persistencia de carreras.
     */
    constructor(runRepository) {
        this.runRepository = runRepository;
    }

    /**
     * Ejecuta el caso de uso para listar todas las carreras del sistema.
     * Mapea cada entidad Run de dominio a su correspondiente representación JSON.
     * 
     * @returns {Object[]} Lista de carreras en formato de objeto plano.
     */
    execute() {
        return this.runRepository.getAll().map(run => run.toJSON());
    }
}

module.exports = GetAllRuns;

