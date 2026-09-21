const UserRepository = require('../infrastructure/UserRepository');
const TrainingRepository = require('../infrastructure/TrainingRepository');
const GeneratePlan = require('../aplication/training/GeneratePlan');
const CreateNewUser = require('../aplication/users/CreateNewUser');

async function runMultiUserDemo() {
    const userRepo = new UserRepository();
    const trainingRepo = new TrainingRepository();
    const createUser = new CreateNewUser(userRepo);
    const generatePlan = new GeneratePlan(userRepo, trainingRepo);

    console.log('=== MULTI-USER DEMO: ADAPTABILIDAD DEL MOTOR ===');

    // --- ESCENARIO 1: ATLETA OCUPADO (2 días/semana) ---
    console.log('\n--- Escenario 1: Corredor con poco tiempo ---');
    const user1Data = {
        name: 'Busy Runner',
        lastName: 'Test',
        gender: 'F',
        age: 35,
        pb: { '5k': '28:00' }, // Su marca actual (~5:36/km)
        availableDays: ['Tuesday', 'Saturday']
    };

    const user1 = createUser.execute(user1Data);
    console.log(`Usuario: ${user1.name}, Disponibilidad: ${user1.availableDays.join(', ')}`);

    // Meta: 5k a 5:00 min/km (le damos 8 semanas para prepararlo ya que no tiene prisa)
    const targetDate1 = new Date();
    targetDate1.setDate(targetDate1.getDate() + (8 * 7));

    const plan1 = generatePlan.execute({
        userId: user1.id,
        goalDistance: 5,
        targetDate: targetDate1.toISOString().split('T')[0],
        description: 'Bajar de 25 min en 5k (ritmo 5:00)'
    });

    console.log(`Plan generado: ${plan1.goal.description}`);
    _printPlanBrief(plan1);

    // --- ESCENARIO 2: ATLETA AVANZADO (5 días/semana) ---
    console.log('\n--- Escenario 2: Corredor Avanzado ---');
    const user2Data = {
        name: 'Elite Runner',
        lastName: 'Test',
        gender: 'M',
        age: 28,
        pb: { '5k': '17:30' }, // Marca rápida (~3:30/km)
        availableDays: ['Monday', 'Tuesday', 'Thursday', 'Friday', 'Sunday']
    };

    const user2 = createUser.execute(user2Data);
    console.log(`Usuario: ${user2.name}, Disponibilidad: ${user2.availableDays.join(', ')}`);

    const targetDate2 = new Date();
    targetDate2.setDate(targetDate2.getDate() + (16 * 7)); // 16 semanas

    const plan2 = generatePlan.execute({
        userId: user2.id,
        goalDistance: 21, // Media Maratón
        targetDate: targetDate2.toISOString().split('T')[0],
        description: 'Preparación Media Maratón'
    });

    console.log(`Plan generado: ${plan2.goal.description}`);
    _printPlanBrief(plan2);

    console.log('\n=== Fin de Multi-Demo ===');
}

function _printPlanBrief(plan) {
    console.log(`  Estructura: ${plan.mesociclos.length} bloques principales.`);
    // Primeras 2 semanas del bloque específico (donde está la chicha)
    const specificMeso = plan.mesociclos.find(m => m.type.includes('Specific')) || plan.mesociclos[0];
    console.log(`  Muestra de Bloque '${specificMeso.type}':`);
    specificMeso.microciclos.slice(0, 2).forEach(micro => {
        process.stdout.write(`    S${micro.weekNumber}: `);
        const sessionEx = micro.sessions.map(s => `${s.day}(${s.targetDistance}km@${s.targetPace})`).join(' | ');
        console.log(sessionEx);
    });
}

runMultiUserDemo().catch(console.error);
