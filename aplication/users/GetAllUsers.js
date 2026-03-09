/**
 * Servicio de aplicación para listar todos los usuarios registrados.
 */
class GetAllUsers {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    execute() {
        return this.userRepository.getAll().map(user => user.toJSON());
    }
}

module.exports = GetAllUsers;
