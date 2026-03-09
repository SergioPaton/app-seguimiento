const Run = require('../../dominio/runs/Run');
const { ValidationError } = require('../../dominio/shared/Errors');

/**
 * Servicio para crear una nueva carrera.
 */
class CreateNewRun {
    constructor(runRepository) {
        this.runRepository = runRepository;
    }

    execute(runData) {
        // 1. Crear la instancia del dominio
        const { date, ...dataToCreate } = runData;
        const newRun = new Run(dataToCreate);

        const runs = this.runRepository.getAll();

        // 2. Validar Duplicados
        const isDuplicate = runs.some(run =>
            run.date === newRun.date &&
            run.distance === newRun.distance &&
            run.duration === newRun.duration
        );
        if (isDuplicate) {
            throw new ValidationError('Ya existe una carrera registrada con la misma fecha, distancia y duración.');
        }

        // 3. Asignar ID autoincremental
        const maxId = runs.reduce((max, run) => Math.max(max, parseInt(run.id)), 0);
        newRun.id = (maxId + 1).toString();

        // 4. Guardar
        this.runRepository.save(newRun);

        return newRun.toJSON();
    }
}

module.exports = CreateNewRun;
