/**
 * Servicio de Aplicación para buscar y filtrar carreras según criterios de consulta específicos.
 * 
 * @class SearchRuns
 */
class SearchRuns {
    /**
     * Crea una instancia del servicio.
     * 
     * @param {Object} runRepository - Repositorio de persistencia de carreras.
     */
    constructor(runRepository) {
        this.runRepository = runRepository;
    }

    /**
     * Ejecuta el caso de uso para buscar carreras filtrando por fecha o texto contenido en las notas.
     * 
     * @param {Object} query - Criterios de búsqueda.
     * @param {string} [query.date] - Fecha exacta a filtrar (YYYY-MM-DD).
     * @param {string} [query.note] - Texto parcial para buscar dentro de las observaciones de las carreras.
     * @returns {Object[]} Lista de carreras que coinciden con los filtros en formato de objeto plano.
     */
    execute(query) {
        let runs = this.runRepository.getAll();

        if (query.date) {
            runs = runs.filter(run => run.date === query.date);
        }

        if (query.note) {
            const searchTerm = query.note.toLowerCase();
            runs = runs.filter(run => run.note.toLowerCase().includes(searchTerm));
        }

        return runs.map(run => run.toJSON());
    }
}

module.exports = SearchRuns;

