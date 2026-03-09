const fs = require('fs');
const path = require('path');
const Run = require('../dominio/runs/Run');

/**
 * Repositorio para la entidad Run.
 * Maneja la persistencia en JSON y la conversión a entidades de Dominio.
 */
class RunRepository {
    constructor(filePath = null) {
        this.filePath = filePath || path.join(__dirname, '..', 'data', 'runs.json');
    }

    _readRaw() {
        try {
            if (!fs.existsSync(this.filePath)) return [];
            const data = fs.readFileSync(this.filePath, 'utf8');
            return JSON.parse(data);
        } catch (err) {
            return [];
        }
    }

    _writeRaw(data) {
        fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf8');
    }

    getAll() {
        const rawData = this._readRaw();
        return rawData.map(run => new Run(run));
    }

    getById(id) {
        const all = this.getAll();
        return all.find(run => run.id === id);
    }

    save(run) {
        const all = this._readRaw();
        const index = all.findIndex(r => r.id === run.id);

        const runData = run.toJSON();

        if (index !== -1) {
            all[index] = runData;
        } else {
            all.push(runData);
        }

        this._writeRaw(all);
        return run;
    }

    delete(id) {
        const all = this._readRaw();
        const filtered = all.filter(r => r.id !== id);
        this._writeRaw(filtered);
    }

    deleteByUserId(userId) {
        const all = this._readRaw();
        const filtered = all.filter(r => r.userId !== userId);
        this._writeRaw(filtered);
    }
}

module.exports = RunRepository;
