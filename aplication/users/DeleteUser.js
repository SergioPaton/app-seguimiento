const { NotFoundError } = require('../../dominio/shared/Errors');

/**
 * Servicio de aplicación para eliminar un usuario.
 */
class DeleteUser {
    constructor(userRepository, runRepository, trainingRepository) {
        this.userRepository = userRepository;
        this.runRepository = runRepository;
        this.trainingRepository = trainingRepository;
    }

    execute(id) {
        const existingUser = this.userRepository.getById(id);
        if (!existingUser) {
            throw new NotFoundError('Usuario no encontrado.');
        }

        // 1. Borramos sus carreras (Cascada)
        this.runRepository.deleteByUserId(id);

        // 2. Borramos su plan de entrenamiento (Cascada)
        if (this.trainingRepository) {
            this.trainingRepository.deleteByUserId(id);
        }

        // 3. Luego borramos el usuario
        this.userRepository.delete(id);
        return true;
    }
}

module.exports = DeleteUser;
