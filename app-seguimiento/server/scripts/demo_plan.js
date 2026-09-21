const UserRepository = require('../infrastructure/UserRepository');
const TrainingRepository = require('../infrastructure/TrainingRepository');
const GeneratePlan = require('../aplication/training/GeneratePlan');
const CreateNewUser = require('../aplication/users/CreateNewUser');

async function runDemo() {
    const userRepo = new UserRepository();
    const trainingRepo = new TrainingRepository();
    const createUser = new CreateNewUser(userRepo);
    const generatePlan = new GeneratePlan(userRepo, trainingRepo);

    console.log('--- 1. Creando Usuario de Prueba ---');
    const userData = {
        name: 'Sergi',
        lastName: 'Runner',
        gender: 'M',
        age: 30,
        pb: { '5k': '22:30' }, // Ritmo base ~4:30
        availableDays: ['Monday', 'Wednesday', 'Friday', 'Sunday']
    };

    let user;
    try {
        user = createUser.execute(userData);
        console.log(`Usuario creado: ${user.name} (ID: ${user.id})`);
    } catch (e) {
        // Si ya existe o hay error, intentamos recuperarlo
        console.log('El usuario ya podría existir, continuando...');
        user = userRepo.getAll()[0];
    }

    console.log('\n--- 2. Generando Plan de Entrenamiento (10k a 12 semanas) ---');
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + (12 * 7)); // 12 semanas vista

    const planData = {
        userId: user.id,
        goalDistance: 10,
        targetDate: targetDate.toISOString().split('T')[0],
        description: 'Mi primer gran objetivo 10k'
    };

    const plan = generatePlan.execute(planData);
    console.log(`Plan generado con ID: ${plan.id}`);
    console.log(`Total Mesociclos: ${plan.mesociclos.length}`);

    console.log('\n--- 3. Muestra de la Estructura (Primeras semanas) ---');
    plan.mesociclos.forEach((meso, mIdx) => {
        console.log(`\nMesociclo ${mIdx + 1}: ${meso.type}`);
        meso.microciclos.forEach(micro => {
            console.log(`  Semana ${micro.weekNumber}:`);
            micro.sessions.forEach(s => {
                console.log(`    - [${s.day}] ${s.type}: ${s.targetDistance}km @ ${s.targetPace} -> ${s.description}`);
            });
        });
    });

    console.log('\n--- Demo Finalizada ---');
}

runDemo().catch(console.error);
