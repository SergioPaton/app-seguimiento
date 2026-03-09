const fs = require('fs');
const path = require('path');
const User = require('../dominio/users/User');

/**
 * Repositorio de Infraestructura para Usuarios.
 * Maneja la persistencia en users.json utilizando entidades de dominio.
 */
class UserRepository {
    constructor() {
        this.filePath = path.join(__dirname, '../data/users.json');
        this._ensureFileExists();
    }

    _ensureFileExists() {
        const dir = path.dirname(this.filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        if (!fs.existsSync(this.filePath)) {
            fs.writeFileSync(this.filePath, JSON.stringify([], null, 2));
        }
    }

    getAll() {
        const data = fs.readFileSync(this.filePath, 'utf-8');
        const usersJson = JSON.parse(data);
        return usersJson.map(userData => new User(userData));
    }

    getById(id) {
        const users = this.getAll();
        return users.find(user => user.id === id);
    }

    save(user) {
        const users = this.getAll();
        const index = users.findIndex(u => u.id === user.id);

        const userJson = user.toJSON();

        if (index !== -1) {
            users[index] = userJson;
        } else {
            users.push(userJson);
        }

        fs.writeFileSync(this.filePath, JSON.stringify(users, null, 2));
    }

    delete(id) {
        const users = this.getAll();
        const filteredUsers = users.filter(user => user.id !== id);
        fs.writeFileSync(this.filePath, JSON.stringify(filteredUsers.map(u => u.toJSON()), null, 2));
    }
}

module.exports = UserRepository;
