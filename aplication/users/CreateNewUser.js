const User = require('../../dominio/users/User');
const { ValidationError } = require('../../dominio/shared/Errors');

/**
 * Servicio de aplicación para registrar un nuevo usuario en el sistema.
 */
class CreateNewUser {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    execute(userData) {
        // 1. Obtener todos los usuarios para validar duplicados (opcional) y generar ID
        const users = this.userRepository.getAll();

        // 2. Generar el siguiente ID autoincremental
        const maxId = users.reduce((max, user) => Math.max(max, parseInt(user.id)), 0);
        const newId = (maxId + 1).toString();

        // 3. Crear instancia del dominio (Valida Automáticamente)
        const newUser = new User({
            ...userData,
            id: newId
        });

        // 4. Persistir
        this.userRepository.save(newUser);

        return newUser.toJSON();
    }
}

module.exports = CreateNewUser;
