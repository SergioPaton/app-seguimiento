const Run = require('../../dominio/runs/Run');
const { ValidationError, NotFoundError } = require('../../dominio/shared/Errors');

/**
 * Servicio de Aplicación para actualizar una carrera existente en el sistema.
 * 
 * @class UpdateRun
 */
class UpdateRun {
    /**
     * Crea una instancia del servicio.
     * 
     * @param {Object} runRepository - Repositorio de persistencia de carreras.
     */
    constructor(runRepository) {
        this.runRepository = runRepository;
    }

    /**
     * Ejecuta el caso de uso para modificar una carrera.
     * Recupera la carrera existente, crea una instancia temporal con los nuevos valores para aplicar
     * validaciones de dominio, descarta duplicados y finalmente persiste los cambios.
     * 
     * @param {string} id - Identificador único de la carrera a modificar.
     * @param {Object} updateData - Nuevos datos para actualizar la carrera.
     * @returns {Object} El objeto plano de la carrera actualizada (JSON).
     * @throws {NotFoundError} Si la carrera con el ID proporcionado no existe.
     * @throws {ValidationError} Si la modificación genera un registro idéntico a otra carrera existente (duplicado).
     */
    execute(id, updateData) {
        const runs = this.runRepository.getAll();
        const existingRun = runs.find(run => run.id === id);

        if (!existingRun) {
            throw new NotFoundError('Carrera no encontrada.');
        }

        // 1. Crear nueva instancia con los datos actualizados para validar a nivel de dominio
        const { date, ...dataToUpdate } = updateData;
        const runToUpdate = new Run({
            ...existingRun.toJSON(),
            ...dataToUpdate,
            id
        });

        // 2. Validar Duplicados excluyendo la carrera que estamos editando
        const isDuplicate = runs.some(run =>
            run.id !== id &&
            run.date === runToUpdate.date &&
            run.distance === runToUpdate.distance &&
            run.duration === runToUpdate.duration
        );
        if (isDuplicate) {
            throw new ValidationError('Ya existe una carrera registrada con la misma fecha, distancia y duración.');
        }

        // 3. Guardar cambios
        this.runRepository.save(runToUpdate);

        return runToUpdate.toJSON();
    }
}

module.exports = UpdateRun;

