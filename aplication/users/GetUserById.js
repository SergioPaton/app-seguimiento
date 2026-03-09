/**
 * Servicio de aplicación para obtener un usuario por su ID.
 */
class GetUserById {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    execute(id) {
        const user = this.userRepository.getById(id);
        return user ? user.toJSON() : null;
    }
}

module.exports = GetUserById;
