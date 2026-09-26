/**
 * @file server.js
 * @description Servidor Express principal de la aplicación. Configura rutas de API,
 * controladores, inyección de dependencias básicas y middleware de manejo de errores.
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Errores del Dominio
const { ValidationError, NotFoundError, ConfirmationRequiredError } = require('./dominio/shared/Errors');

// Capa de Infraestructura (Repositores en memoria / almacenamiento)
const RunRepository = require('./infrastructure/RunRepository');
const UserRepository = require('./infrastructure/UserRepository');
const TrainingRepository = require('./infrastructure/TrainingRepository');

// Instanciación de los repositorios
const runRepository = new RunRepository();
const userRepository = new UserRepository();
const trainingRepository = new TrainingRepository();

// Servicios de Aplicación - Carreras (Instanciados con Inyección de Dependencias)
const GetAllRuns = require('./aplication/runs/GetAllRuns');
const GetRunById = require('./aplication/runs/GetRunById');
const CreateNewRun = require('./aplication/runs/CreateNewRun');
const UpdateRun = require('./aplication/runs/UpdateRun');
const DeleteRun = require('./aplication/runs/DeleteRun');
const SearchRuns = require('./aplication/runs/SearchRuns');

// Servicios de Aplicación - Usuarios
const CreateNewUser = require('./aplication/users/CreateNewUser');
const GetAllUsers = require('./aplication/users/GetAllUsers');
const GetUserById = require('./aplication/users/GetUserById');
const UpdateUser = require('./aplication/users/UpdateUser');
const DeleteUser = require('./aplication/users/DeleteUser');
const LoginUser = require('./aplication/users/LoginUser');

// Servicios de Aplicación - Entrenamiento
const GeneratePlan = require('./aplication/training/GeneratePlan');
const DeleteTrainingPlan = require('./aplication/training/DeleteTrainingPlan');
const CompletePlannedSession = require('./aplication/training/CompletePlannedSession');
const AdvancePlanCycle = require('./aplication/training/AdvancePlanCycle');

// Instanciación de los casos de uso / servicios de aplicación
const generatePlan = new GeneratePlan(userRepository, trainingRepository);
const deleteTrainingPlan = new DeleteTrainingPlan(trainingRepository);
const completePlannedSession = new CompletePlannedSession(trainingRepository, runRepository);
const advancePlanCycle = new AdvancePlanCycle(trainingRepository, userRepository, generatePlan);

const getAllRuns = new GetAllRuns(runRepository);
const getRunById = new GetRunById(runRepository);
const createNewRun = new CreateNewRun(runRepository);
const updateRun = new UpdateRun(runRepository);
const deleteRun = new DeleteRun(runRepository);
const searchRuns = new SearchRuns(runRepository);

const createNewUser = new CreateNewUser(userRepository);
const getAllUsers = new GetAllUsers(userRepository);
const getUserById = new GetUserById(userRepository);
const updateUser = new UpdateUser(userRepository);
const deleteUser = new DeleteUser(userRepository, runRepository, trainingRepository);
const loginUser = new LoginUser(userRepository);

// Inicialización de la aplicación Express
const app = express();
const PORT = 3000;

// Configuración de middlewares globales
app.use(cors());
app.use(bodyParser.json());

/**
 * Middleware para manejo de errores centralizado en la API.
 * Captura excepciones del dominio (validación, no encontrado, confirmaciones requeridas)
 * y devuelve la respuesta HTTP adecuada con el formato correspondiente.
 * 
 * @param {Error} error - El objeto de error capturado.
 * @param {import('express').Request} req - Objeto de solicitud HTTP Express.
 * @param {import('express').Response} res - Objeto de respuesta HTTP Express.
 * @param {import('express').NextFunction} next - Siguiente middleware en la cadena.
 */
const errorHandler = (error, req, res, next) => {
    if (error instanceof ValidationError) {
        return res.status(400).json({ error: error.message });
    }
    if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message });
    }
    if (error instanceof ConfirmationRequiredError) {
        return res.status(409).json({
            error: error.message,
            confirmationRequired: true
        });
    }
    res.status(500).json({ error: 'Error interno del servidor: ' + (error.message || error) });
};

// --- RUTAS DE USUARIO ---

/**
 * Obtener todos los usuarios.
 * @route GET /api/users
 */
app.get('/api/users', (req, res, next) => {
    try {
        const users = getAllUsers.execute();
        res.json(users);
    } catch (error) {
        next(error);
    }
});

/**
 * Obtener un usuario por su ID único.
 * @route GET /api/users/:id
 */
app.get('/api/users/:id', (req, res, next) => {
    try {
        const user = getUserById.execute(req.params.id);
        if (!user) throw new NotFoundError('Usuario no encontrado');
        res.json(user);
    } catch (error) {
        next(error);
    }
});

/**
 * Crear un nuevo usuario.
 * @route POST /api/users
 */
app.post('/api/users', (req, res, next) => {
    try {
        const newUser = createNewUser.execute(req.body);
        res.status(201).json(newUser);
    } catch (error) {
        next(error);
    }
});

/**
 * Iniciar sesión de usuario (autenticación básica).
 * @route POST /api/users/login
 */
app.post('/api/users/login', (req, res, next) => {
    try {
        const user = loginUser.execute(req.body);
        res.json(user);
    } catch (error) {
        next(error);
    }
});

/**
 * Actualizar los datos de un usuario existente.
 * @route PUT /api/users/:id
 */
app.put('/api/users/:id', (req, res, next) => {
    try {
        const updatedUser = updateUser.execute(req.params.id, req.body);
        res.json(updatedUser);
    } catch (error) {
        next(error);
    }
});

/**
 * Eliminar un usuario del sistema por su ID.
 * @route DELETE /api/users/:id
 */
app.delete('/api/users/:id', (req, res, next) => {
    try {
        deleteUser.execute(req.params.id);
        res.json({ message: 'Usuario eliminado con éxito' });
    } catch (error) {
        next(error);
    }
});

/**
 * Obtener todas las carreras registradas para un usuario específico.
 * @route GET /api/users/:id/runs
 */
app.get('/api/users/:id/runs', (req, res, next) => {
    try {
        const userId = req.params.id;
        const allRuns = getAllRuns.execute();
        const userRuns = allRuns.filter(run => run.userId === userId);
        res.json(userRuns);
    } catch (error) {
        next(error);
    }
});

// --- RUTAS DE CARRERAS (RUNS) ---

/**
 * Obtener todas las carreras del sistema.
 * @route GET /api/runs
 */
app.get('/api/runs', (req, res, next) => {
    try {
        const runs = getAllRuns.execute();
        res.json(runs);
    } catch (error) {
        next(error);
    }
});

/**
 * Buscar y filtrar carreras según parámetros de consulta.
 * @route GET /api/runs/search
 */
app.get('/api/runs/search', (req, res, next) => {
    try {
        const runs = searchRuns.execute(req.query);
        res.json(runs);
    } catch (error) {
        next(error);
    }
});

/**
 * Obtener los detalles de una carrera específica por su ID.
 * @route GET /api/runs/:id
 */
app.get('/api/runs/:id', (req, res, next) => {
    try {
        const run = getRunById.execute(req.params.id);
        if (!run) throw new NotFoundError('Carrera no encontrada');
        res.json(run);
    } catch (error) {
        next(error);
    }
});

/**
 * Registrar una nueva carrera.
 * @route POST /api/runs
 */
app.post('/api/runs', (req, res, next) => {
    try {
        const newRun = createNewRun.execute(req.body);
        res.status(201).json(newRun);
    } catch (error) {
        next(error);
    }
});

/**
 * Actualizar los datos de una carrera existente.
 * @route PUT /api/runs/:id
 */
app.put('/api/runs/:id', (req, res, next) => {
    try {
        const updatedRun = updateRun.execute(req.params.id, req.body);
        res.json(updatedRun);
    } catch (error) {
        next(error);
    }
});

/**
 * Eliminar una carrera por su ID.
 * @route DELETE /api/runs/:id
 */
app.delete('/api/runs/:id', (req, res, next) => {
    try {
        deleteRun.execute(req.params.id);
        res.json({ message: 'Carrera eliminada con éxito' });
    } catch (error) {
        next(error);
    }
});

// --- RUTAS DE ENTRENAMIENTO (TRAINING) ---

/**
 * Generar un nuevo plan de entrenamiento adaptado para un usuario.
 * @route POST /api/training/generate
 */
app.post('/api/training/generate', (req, res, next) => {
    try {
        const plan = generatePlan.execute(req.body);
        res.status(201).json(plan.toJSON());
    } catch (error) {
        next(error);
    }
});

/**
 * Obtener el plan de entrenamiento activo para un usuario.
 * @route GET /api/users/:id/training-plan
 */
app.get('/api/users/:id/training-plan', (req, res, next) => {
    try {
        const plan = trainingRepository.getByUserId(req.params.id);
        if (!plan) throw new NotFoundError('No se encontró un plan de entrenamiento para este usuario.');
        res.json(plan.toJSON());
    } catch (error) {
        next(error);
    }
});

/**
 * Avanzar un plan en bucle / rutina al siguiente ciclo con sobrecarga progresiva.
 * @route POST /api/training/:id/next-cycle
 */
app.post('/api/training/:id/next-cycle', (req, res, next) => {
    try {
        const newPlan = advancePlanCycle.execute(req.params.id);
        res.json(newPlan.toJSON());
    } catch (error) {
        next(error);
    }
});

/**
 * Eliminar un plan de entrenamiento por su ID.
 * @route DELETE /api/training/:id
 */
app.delete('/api/training/:id', (req, res, next) => {
    try {
        deleteTrainingPlan.execute(req.params.id);
        res.json({ message: 'Plan de entrenamiento eliminado con éxito.' });
    } catch (error) {
        next(error);
    }
});

/**
 * Marcar una sesión planificada de entrenamiento como completada, asociándole un registro de carrera.
 * @route POST /api/training/:planId/sessions/:sessionId/complete
 */
app.post('/api/training/:planId/sessions/:sessionId/complete', (req, res, next) => {
    try {
        const { runId } = req.body;
        const updatedPlan = completePlannedSession.execute(req.params.planId, req.params.sessionId, runId);
        res.json(updatedPlan);
    } catch (error) {
        next(error);
    }
});

// Aplicación del middleware de errores centralizado al final de la definición de rutas
app.use(errorHandler);

// Inicializar el servidor en el puerto configurado si se ejecuta este módulo directamente
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
}

module.exports = app;

