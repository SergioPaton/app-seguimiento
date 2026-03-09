const User = require('../../dominio/users/User');
const { NotFoundError } = require('../../dominio/shared/Errors');

/**
 * Servicio de aplicación para actualizar los datos de un usuario.
 */
class UpdateUser {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    execute(id, updateData) {
        const existingUser = this.userRepository.getById(id);
        if (!existingUser) {
            throw new NotFoundError('Usuario no encontrado.');
        }

        // Crear una nueva instancia del dominio con los datos mezclados para validar
        const updatedUser = new User({
            ...existingUser.toJSON(),
            ...updateData,
            id // Asegurar que el ID no cambie
        });

        this.userRepository.save(updatedUser);

        return updatedUser.toJSON();
    }
}

module.exports = UpdateUser;
