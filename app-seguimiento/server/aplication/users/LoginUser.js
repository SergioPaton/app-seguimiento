const { ValidationError } = require('../../dominio/shared/Errors');

/**
 * Servicio de aplicación para autenticar un usuario en el sistema.
 */
class LoginUser {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    execute({ name, password }) {
        if (!name || !password) {
            throw new ValidationError('El nombre y la contraseña son obligatorios.');
        }

        const users = this.userRepository.getAll();
        const user = users.find(u => u.name.toLowerCase() === name.trim().toLowerCase());

        if (!user) {
            throw new ValidationError('Usuario no encontrado.');
        }

        if (user.password !== password) {
            throw new ValidationError('Contraseña incorrecta.');
        }

        return user.toJSON();
    }
}

module.exports = LoginUser;
