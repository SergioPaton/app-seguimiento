const Run = require('../../dominio/runs/Run');
const { ValidationError, NotFoundError } = require('../../dominio/shared/Errors');

/**
 * Servicio para modificar una carrera.
 */
class UpdateRun {
    constructor(runRepository) {
        this.runRepository = runRepository;
    }

    execute(id, updateData) {
        const runs = this.runRepository.getAll();
        const existingRun = runs.find(run => run.id === id);

        if (!existingRun) {
            throw new NotFoundError('Carrera no encontrada.');
        }

        // 1. Crear nueva instancia con los datos actualizados para validar

        const { date, ...dataToUpdate } = updateData;
        const runToUpdate = new Run({
            ...existingRun.toJSON(),
            ...dataToUpdate,
            id
        });

        // 2. Validar Duplicados
        const isDuplicate = runs.some(run =>
            run.id !== id &&
            run.date === runToUpdate.date &&
            run.distance === runToUpdate.distance &&
            run.duration === runToUpdate.duration
        );
        if (isDuplicate) {
            throw new ValidationError('Ya existe una carrera registrada con la misma fecha, distancia y duración.');
        }

        // 3. Guardar
        this.runRepository.save(runToUpdate);

        return runToUpdate.toJSON();
    }
}

module.exports = UpdateRun;
