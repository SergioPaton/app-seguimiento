const fs = require('fs');
const path = require('path');
const TrainingPlan = require('../dominio/training/TrainingPlan');

/**
 * Repository for Training Plans.
 * Matches the pattern used in RunRepository and UserRepository.
 */
class TrainingRepository {
    constructor(filePath = null) {
        this.filePath = filePath || path.join(__dirname, '..', 'data', 'training_plans.json');
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

    _readRaw() {
        try {
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
        return rawData.map(planData => new TrainingPlan(planData));
    }

    getByUserId(userId) {
        return this.getAll().find(plan => plan.userId === userId);
    }

    save(trainingPlan) {
        const all = this._readRaw();
        const planData = trainingPlan.toJSON();
        const index = all.findIndex(p => p.id === planData.id);

        if (index !== -1) {
            all[index] = planData;
        } else {
            all.push(planData);
        }

        this._writeRaw(all);
        return trainingPlan;
    }

    delete(id) {
        const all = this._readRaw();
        const filtered = all.filter(p => p.id !== id);
        this._writeRaw(filtered);
    }

    deleteByUserId(userId) {
        const all = this._readRaw();
        const filtered = all.filter(p => p.userId !== userId);
        this._writeRaw(filtered);
    }
}

module.exports = TrainingRepository;
