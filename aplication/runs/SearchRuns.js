/**
 * Servicio para buscar carreras por criterios.
 */
class SearchRuns {
    constructor(runRepository) {
        this.runRepository = runRepository;
    }

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
