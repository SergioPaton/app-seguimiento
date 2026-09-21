const Run = require('../../dominio/runs/Run');
const { ValidationError } = require('../../dominio/shared/Errors');

/**
 * Servicio de Aplicación para crear y registrar una nueva carrera en el sistema.
 * 
 * @class CreateNewRun
 */
class CreateNewRun {
    /**
     * Crea una instancia del servicio.
     * 
     * @param {Object} runRepository - Repositorio de persistencia de carreras.
     */
    constructor(runRepository) {
        this.runRepository = runRepository;
    }

    /**
     * Ejecuta el caso de uso para registrar una nueva carrera.
     * Crea la entidad Run, valida que no sea duplicada y le asigna un ID autoincremental antes de guardarla.
     * 
     * @param {Object} runData - Datos de la carrera a registrar.
     * @returns {Object} El objeto plano de la carrera registrada (JSON).
     * @throws {ValidationError} Si ya existe una carrera idéntica (misma fecha, distancia y duración).
     */
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

        // 4. Guardar en el repositorio
        this.runRepository.save(newRun);

        return newRun.toJSON();
    }
}

module.exports = CreateNewRun;

