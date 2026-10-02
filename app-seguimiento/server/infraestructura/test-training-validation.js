const GeneratePlan = require('../aplication/training/GeneratePlan');

/**
 * Validador de planes de entrenamiento según requisitos-entrenamiento.md
 * Salida: JSON estricto con formato { result, summary, errors, warnings, suggestions }
 */
class TrainingPlanValidator {
    constructor(userRepository, trainingRepository) {
        this.generatePlan = new GeneratePlan(userRepository, trainingRepository);
        this.distances = [5, 10, 21, 42.195];
        this.goalLabels = { 5: '5K', 10: '10K', 21: 'Media', 42.195: 'Maratón' };
    }

    // ==================== Entrada y generación ====================

    validateInputs({ goalDistance, targetDate, level, weeklyVolume, availableDays }) {
        const missing = [];
        if (!goalDistance || !this.distances.includes(goalDistance)) {
            missing.push('distancia objetivo válida (5K/10K/21K/42K)');
        }
        if (!targetDate) missing.push('fecha objetivo');
        if (!level || !['beginner', 'intermediate', 'advanced'].includes(level)) {
            missing.push('nivel (beginner/intermediate/advanced)');
        }
        if (weeklyVolume === undefined || weeklyVolume <= 0) missing.push('volumen semanal base > 0');
        if (!availableDays || !Array.isArray(availableDays) || availableDays.length === 0) {
            missing.push('días disponibles por semana');
        }
        return missing.length === 0 ? true : missing;
    }

    createPlan(userId, input) {
        const { goalDistance, targetDate, level, weeklyVolume, availableDays } = input;
        return this.generatePlan.execute({
            userId,
            goalDistance: goalDistance.toString(),
            targetDate,
            isGeneric: false,
            trainingMode: 'advanced',
            level,
            cycleWeeks: null
        });
    }

    // ==================== Extracción de datos del plan ====================

    getMicrocycles(plan) {
        const result = [];
        plan.mesociclos.forEach(meso => {
            meso.microciclos.forEach(micro => {
                result.push({ ...micro.toJSON(), mesoType: meso.type });
            });
        });
        return result;
    }

    getWeeklyVolumes(microcycles) {
        return microcycles.map(mc => {
            const volume = mc.sessions
                .filter(s => s.type !== 'Strength')
                .reduce((sum, s) => sum + Number(s.targetDistance || 0), 0);
            return parseFloat(volume.toFixed(2));
        });
    }

    getWeeklyChange(volumes) {
        const changes = [];
        for (let i = 1; i < volumes.length; i++) {
            const prev = volumes[i - 1];
            const delta = volumes[i] - prev;
            const pct = prev > 0 ? (delta / prev) * 100 : 0;
            changes.push(parseFloat(pct.toFixed(2)));
        }
        return changes;
    }

    // ==================== Reglas R0 - R5 ====================

    validateR0(microcycles, plan, userId, input) {
        const errors = [];
        const goal = plan.goal;
        const label = this.goalLabels[goal.distance] || `? (${goal.distance}km)`;

        // R0.1 - No campos vacíos, distancias <= 0, semanas vacías, fechas incoherentes
        if (!goal || !goal.distance || Number(goal.distance) <= 0) {
            errors.push({ week: 1, day: 0, rule: 'R0.1', severity: 'crítico',
                calculation: `goal.distance=${goal?.distance}`, detail: 'El plan no tiene un objetivo de distancia válido.' });
        }
        if (microcycles.length === 0) {
            errors.push({ week: 0, day: 0, rule: 'R0.1', severity: 'crítico',
                calculation: '0 semanas generadas', detail: 'El plan no contiene ninguna semana.' });
        }

        // R0.2 - Semanas suficientes
        const minWeeks = { 5: 6, 10: 8, 21: 10, 42.195: 12 };
        const base = minWeeks[goal.distance] || 8;
        const required = base + (input.level === 'beginner' ? 2 : 0);
        const weeks = microcycles.length;
        if (weeks < required) {
            errors.push({ week: 0, day: 0, rule: 'R0.2', severity: 'crítico',
                calculation: `${weeks} semanas vs ${required} mínimas (${label})`,
                detail: `El plan de ${label} necesita al menos ${required} semanas.` });
        }

        // R0.3 - El plan termina en la fecha objetivo (aproximada)
        if (plan.endDate) {
            const start = new Date(plan.startDate);
            const end = new Date(plan.endDate);
            const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
            if (diffDays < weeks * 7 - 1 || diffDays > weeks * 7 + 2) {
                errors.push({ week: 0, day: 0, rule: 'R0.3', severity: 'mayor',
                    calculation: `${diffDays} días (${weeks} semanas)`,
                    detail: 'La fecha fin no coincide con el número de semanas.' });
            }
        }
        return errors;
    }

    validateR1(microcycles, volumes, changes, goalDistance) {
        const errors = [];
        const goal = goalDistance; // Usar la distancia real del plan
        const limits = { 5: { min: 8, max: 10 }, 10: { min: 12, max: 14 },
                         21: { min: 18, max: 22 }, 42.195: { min: 30, max: 35 } };

        microcycles.forEach(mc => {
            const week = mc.weekNumber;
            const volume = volumes[week - 1];
            const nRunning = mc.sessions.filter(s => s.type !== 'Strength').length;
            const maxPct = nRunning <= 3 ? 50 : 40;

            // R1.1 - Sesión larga por distancia objetivo
            const limit = limits[goal];
            const longRun = mc.sessions.find(s => s.type === 'LongRun');
            if (longRun) {
                const d = Number(longRun.targetDistance);
                if (d > limit.max || d < limit.min) {
                    errors.push({ week, day: longRun.day, rule: 'R1.1', severity: 'crítico',
                        calculation: `${d} km (rango ${limit.min}-${limit.max} km)`,
                        detail: `La larga de la semana ${week} está fuera del rango para ${this.goalLabels[goal]}.` });
                }
            }

            // R1.2 - Larga <= 35-40% volumen (<=50% si <=3 sesiones)
            if (longRun && volume > 0) {
                const pct = (Number(longRun.targetDistance) / volume) * 100;
                if (pct > maxPct) {
                    errors.push({ week, day: longRun.day, rule: 'R1.2', severity: 'mayor',
                        calculation: `${pct.toFixed(1)}% vs ${maxPct}% máx`,
                        detail: 'La sesión larga supera el porcentaje permitido del volumen semanal.' });
                }
            }

            // R1.3 - Aumento <= 10% semanal
            if (changes[week - 2] > 10) {
                const prev = volumes[week - 2];
                errors.push({ week, day: 0, rule: 'R1.3', severity: 'mayor',
                    calculation: `${volumes[week - 1]} km vs ${prev} km = +${changes[week - 2]}%`,
                    detail: 'El volumen semanal sube más del 10% respecto a la semana anterior.' });
            }

            // R1.5 - Semana de descarga cada 3-4 semanas (-20/30%)
            if (week % 4 === 0 && week >= 4) {
                const change = changes[week - 2];
                if (change === undefined || change > -15) {
                    errors.push({ week, day: 0, rule: 'R1.5', severity: 'mayor',
                        calculation: `semana ${week}, cambio ${change || 0}%`,
                        detail: 'Falta una semana de descarga (~-20/30%) cada 3-4 semanas.' });
                }
            }
        });
        return errors;
    }

    validateR2(microcycles, goal) {
        const errors = [];
        const minContinuous = { 5: 4, 10: 5, 21: 6, 42.195: 6 };
        const minRecovery = 3;

        microcycles.forEach(mc => {
            mc.sessions.forEach(s => {
                const d = Number(s.targetDistance || 0);
                const type = s.type;
                const desc = (s.description || '').toLowerCase();

                // R2.1 - Rodaje continuo
                if (['Easy', 'Progression', 'Hills', 'Incremental', 'Tempo', 'Intervals'].some(t => type.includes(t) || desc.includes(t.replace(' ', '')))) {
                    const min = minContinuous[goal] || 4;
                    if (d < min && type !== 'Recovery') {
                        errors.push({ week: mc.weekNumber, day: s.day, rule: 'R2.1', severity: 'mayor',
                            calculation: `${d} km < ${min} km mínimos (${goal}km)`,
                            detail: 'La sesión no alcanza el volumen mínimo de rodaje continuo.' });
                    }
                }

                // R2.2 - Recuperación >= 3 km marcada explícitamente
                if (type === 'Recovery') {
                    if (d < minRecovery || !desc.toLowerCase().includes('recuperación')) {
                        errors.push({ week: mc.weekNumber, day: s.day, rule: 'R2.2', severity: 'menor',
                            calculation: `${d} km y descripción="${s.description}"`,
                            detail: 'La sesión de recuperación debe ser >= 3 km y marcarse explícitamente.' });
                    }
                }

                // R2.3 - Fartlek/séries evalúan volumen total
                if (type === 'Farklet' || type === 'Intervals') {
                    if (d < 4) {
                        errors.push({ week: mc.weekNumber, day: s.day, rule: 'R2.3', severity: 'mayor',
                            calculation: `${d} km`,
                            detail: 'Las series/fartlek deben incluir volumen total con calentamiento y vuelta a la calma.' });
                    }
                }

                // R2.4 - Calidad con calentamiento y enfriamiento
                if (['Intervals', 'Farklet', 'Tempo', 'Hills'].includes(type)) {
                    const hasWarmup = desc.toLowerCase().includes('calentamiento');
                    const hasCoolDown = desc.toLowerCase().includes('vuelta a la calma') || desc.toLowerCase().includes('enfriamiento');
                    if (!hasWarmup || !hasCoolDown) {
                        errors.push({ week: mc.weekNumber, day: s.day, rule: 'R2.4', severity: 'mayor',
                            calculation: `calentamiento=${hasWarmup}, enfriamiento=${hasCoolDown}`,
                            detail: 'Toda sesión de calidad debe incluir calentamiento y vuelta a la calma.' });
                    }
                }
            });
        });
        return errors;
    }

    validateR3(microcycles) {
        const errors = [];
        microcycles.forEach(mc => {
            // R3.1 - Mínimo 1 día de descanso
            const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            const daysWithActivity = new Set(mc.sessions.map(s => s.day));
            let restDays = allDays.filter(d => !daysWithActivity.has(d));
            if (restDays.length < 1) {
                errors.push({ week: mc.weekNumber, day: 0, rule: 'R3.1', severity: 'mayor',
                    calculation: `0 días de descanso`,
                    detail: 'Cada semana debe tener al menos 1 día de descanso completo.' });
            }

            // R3.2 - Máximo 2 sesiones de calidad por semana (1 en principiantes)
            const quality = ['Intervals', 'Farklet', 'Tempo', 'Hills'].filter(t =>
                mc.sessions.some(s => s.type === t)
            );
            if (quality.length > 2) {
                errors.push({ week: mc.weekNumber, day: 0, rule: 'R3.2', severity: 'mayor',
                    calculation: `${quality.length} sesiones de calidad`,
                    detail: 'Máximo 2 sesiones de calidad por semana (1 en principiantes).' });
            }

            // R3.3 - Sin calidad en días consecutivos
            const sorted = [...mc.sessions].sort((a, b) => {
                return allDays.indexOf(a.day) - allDays.indexOf(b.day);
            });
            for (let i = 1; i < sorted.length; i++) {
                const prevIdx = allDays.indexOf(sorted[i - 1].day);
                const curIdx = allDays.indexOf(sorted[i].day);
                if (curIdx - prevIdx === 1 && ['Intervals', 'Farklet', 'Tempo', 'Hills'].includes(sorted[i].type)) {
                    errors.push({ week: mc.weekNumber, day: sorted[i].day, rule: 'R3.3', severity: 'crítico',
                        calculation: `${sorted[i].type} tras ${sorted[i-1].type}`,
                        detail: 'No debe haber sesiones de calidad en días consecutivos.' });
                }
            }

            // R3.4 - Sin calidad pegada a la larga (día antes/después)
            const longRunDay = mc.sessions.find(s => s.type === 'LongRun')?.day;
            if (longRunDay) {
                const li = allDays.indexOf(longRunDay);
                for (const s of mc.sessions) {
                    if (['Intervals', 'Farklet', 'Tempo', 'Hills'].includes(s.type)) {
                        const si = allDays.indexOf(s.day);
                        if (Math.abs(si - li) === 1) {
                            errors.push({ week: mc.weekNumber, day: s.day, rule: 'R3.4', severity: 'mayor',
                                calculation: `${s.type} pegado a larga (${longRunDay})`,
                                detail: 'No debe haber sesiones de calidad el día antes o después de la tirada larga.' });
                        }
                    }
                }
            }

            // R3.5 - Principiantes: máximo 3 días seguidos de carrera
            const activeDays = allDays.filter(d => daysWithActivity.has(d));
            let consec = 1, maxConsec = 1;
            for (let i = 1; i < activeDays.length; i++) {
                if (allDays.indexOf(activeDays[i]) - allDays.indexOf(activeDays[i - 1]) === 1) {
                    consec++;
                    maxConsec = Math.max(maxConsec, consec);
                } else {
                    consec = 1;
                }
            }
            if (maxConsec > 3) {
                errors.push({ week: mc.weekNumber, day: 0, rule: 'R3.5', severity: 'menor',
                    calculation: `${maxConsec} días seguidos`,
                    detail: 'Máximo 3 días seguidos de carrera para principiantes.' });
            }
        });
        return errors;
    }

    validateR4(microcycles, volumes, goal, weeks) {
        const errors = [];
        const nWeeks = microcycles.length;

        // R4.1 - La larga progresa hasta el pico con descargas
        const longRuns = microcycles
            .map(mc => ({ week: mc.weekNumber, dist: Number(mc.sessions.find(s => s.type === 'LongRun')?.targetDistance || 0) }))
            .filter(l => l.dist > 0);
        for (let i = 1; i < longRuns.length; i++) {
            if (longRuns[i].dist < longRuns[i - 1].dist * 0.9 && longRuns[i - 1].dist > 0) {
                // descarga válida
            } else if (longRuns[i].dist < longRuns[i - 1].dist) {
                errors.push({ week: longRuns[i].week, day: 0, rule: 'R4.1', severity: 'mayor',
                    calculation: `${longRuns[i].dist} km tras ${longRuns[i-1].dist} km`,
                    detail: 'La sesión larga debe progresar creciente hasta el pico, con descargas intercaladas.' });
            }
        }

        // R4.2 - El pico de volumen cae 2-4 semanas antes de la carrera
        const maxVolIdx = volumes.indexOf(Math.max(...volumes));
        const weeksFromEnd = nWeeks - maxVolIdx - 1;
        if (weeksFromEnd < 2 || weeksFromEnd > 4) {
            errors.push({ week: 0, day: 0, rule: 'R4.2', severity: 'mayor',
                calculation: `pico en semana ${maxVolIdx + 1}, ${weeksFromEnd} semanas antes del final`,
                detail: 'El pico de volumen debe caer 2-4 semanas antes de la carrera, no en la última.' });
        }

        // R4.3 - Taper: reducción 30-50% de 1-3 semanas
        const lastVolume = volumes[nWeeks - 1];
        const preLast = volumes[nWeeks - 2];
        if (preLast > 0 && nWeeks >= 2) {
            const taperPct = (1 - lastVolume / preLast) * 100;
            if (taperPct < 30) {
                errors.push({ week: nWeeks, day: 0, rule: 'R4.3', severity: 'mayor',
                    calculation: `reducción ${taperPct.toFixed(1)}% (30-50% requerido)`,
                    detail: 'La última semana debe ser de taper con reducción del 30-50%.' });
            }
        }

        // R4.5 - Al menos 75-80% del volumen en intensidad fácil
        const easyTypes = ['Easy', 'Recovery', 'Progression'];
        const easyVolume = microcycles.reduce((sum, mc) => {
            return sum + mc.sessions
                .filter(s => easyTypes.some(t => s.type.includes(t)))
                .reduce((s, session) => s + Number(session.targetDistance || 0), 0);
        }, 0);
        const totalVolume = volumes.reduce((a, b) => a + b, 0);
        if (totalVolume > 0) {
            const easyPct = (easyVolume / totalVolume) * 100;
            if (easyPct < 75) {
                errors.push({ week: 0, day: 0, rule: 'R4.5', severity: 'mayor',
                    calculation: `${easyPct.toFixed(1)}% volumen fácil vs 75% mínimo`,
                    detail: 'Al menos 75-80% del volumen debe ser en intensidad fácil.' });
            }
        }

        return errors;
    }

    validateR5(microcycles) {
        const errors = [];
        microcycles.forEach(mc => {
            mc.sessions.forEach(s => {
                const d = Number(s.targetDistance || 0);
                const pace = s.targetPace;
                const duration = Number(s.targetDuration || 0);

                // R5.1 - Consistencia distancia/ritmo/duración
                if (d > 0 && pace && !duration) {
                    const [min, sec] = pace.split(':').map(Number);
                    const paceSecPerKm = (min * 60 + sec) / d;
                    const expectedDuration = (d * paceSecPerKm) / 60;
                    if (expectedDuration < 20 || expectedDuration > 600) {
                        errors.push({ week: mc.weekNumber, day: s.day, rule: 'R5.1', severity: 'mayor',
                            calculation: `${d} km a ritmo ${pace} = ${expectedDuration.toFixed(1)} min`,
                            detail: 'Distancia, ritmo y duración no son consistentes.' });
                    }
                }

                // R5.2 - Los ritmos acordes al nivel (series no al ritmo de carrera)
                if (['Intervals', 'Farklet'].includes(s.type) && s.targetPace) {
                    // Validación simplificada: verificar que no es demasiado rápido para principiantes
                    const [min, sec] = s.targetPace.split(':').map(Number);
                    const paceSec = min * 60 + sec;
                    if (paceSec < 180) { // menos de 3:00/km
                        errors.push({ week: mc.weekNumber, day: s.day, rule: 'R5.2', severity: 'menor',
                            calculation: `ritmo ${s.targetPace} muy rápido para el nivel`,
                            detail: 'Las series no deben ir al ritmo de carrera salvo que sea el objetivo.' });
                    }
                }
            });
        });
        return errors;
    }

    // ==================== Ejecución ====================

    run(input, userId = 'user1') {
        const errors = [];
        const warnings = [];
        const suggestions = [];

        // Paso 1: validación de entrada
        const missing = this.validateInputs(input);
        if (missing !== true) {
            return {
                result: 'DATOS_INSUFICIENTES',
                summary: { weeks: 0, weekly_volumes_km: [], weekly_change_pct: [] },
                errors: [{ week: 0, day: 0, rule: 'R0.0', severity: 'crítico',
                    calculation: 'Faltan campos',
                    detail: `Entradas obligatorias ausentes: ${missing.join(', ')}. ` +
                            `Se requiere: distancia (5K/10K/21K/42K), fecha, nivel, volumen base, días disponibles.` }],
                warnings: [],
                suggestions: ['Proporcionar todos los campos de entrada antes de generar el plan.']
            };
        }

        // Paso 2: generar plan
        let plan;
        try {
            plan = this.createPlan(userId, input);
        } catch (e) {
            return {
                result: 'FAIL',
                summary: { weeks: 0, weekly_volumes_km: [], weekly_change_pct: [] },
                errors: [{ week: 0, day: 0, rule: 'GEN-0.1', severity: 'crítico',
                    calculation: `Error: ${e.message}`,
                    detail: 'No se pudo generar el plan.' }],
                warnings: [],
                suggestions: ['Revisar los parámetros de entrada.']
            };
        }

        // Paso 3: extraer datos
        const microcycles = this.getMicrocycles(plan);
        const volumes = this.getWeeklyVolumes(microcycles);
        const changes = this.getWeeklyChange(volumes);
        const weeks = microcycles.length;
        const goalDistance = plan.goal?.distance || 21;

        // Paso 4: aplicar reglas
        errors.push(...this.validateR0(microcycles, plan, userId, input));
        errors.push(...this.validateR1(microcycles, volumes, changes, goalDistance));
        errors.push(...this.validateR2(microcycles, goalDistance));
        errors.push(...this.validateR3(microcycles));
        errors.push(...this.validateR4(microcycles, volumes, goalDistance, weeks));
        errors.push(...this.validateR5(microcycles));

        // Paso 5: determinar resultado
        const hasCritical = errors.some(e => e.severity === 'crítico');
        const hasMajor = errors.some(e => e.severity === 'mayor');
        const result = hasCritical ? 'FAIL' : (hasMajor ? 'PASS con avisos' : 'PASS');

        // Sugerencias por defecto
        if (result === 'FAIL') {
            suggestions.push('Revisar y ajustar los parámetros del generador (volumen inicial, progresión, fases de periodización).');
        }

        return {
            result,
            summary: { weeks, weekly_volumes_km: volumes, weekly_change_pct: changes },
            errors,
            warnings,
            suggestions
        };
    }
}

// ==================== Ejecución del test ====================
if (require.main === module) {
    const mockUserRepository = {
        getById: (id) => ({
            id,
            name: 'Test Runner',
            gender: 'M',
            age: 30,
            level: 'intermediate',
            weeklyVolume: 25,
            availableDays: ['Monday', 'Wednesday', 'Friday', 'Sunday'],
            pb: { '5k': '25:00' }
        })
    };

    const mockTrainingRepository = {
        save: () => {},
        getAll: () => [],
        getById: () => null
    };

    const validator = new TrainingPlanValidator(mockUserRepository, mockTrainingRepository);

    // Test 1: datos válidos
    console.log('=== TEST 1: Entrada válida (10K, intermedio) ===');
    const validInput = {
        goalDistance: 10,
        targetDate: new Date(Date.now() + 10 * 7 * 24 * 60 * 60 * 1000).toISOString(),
        level: 'intermediate',
        weeklyVolume: 25,
        availableDays: ['Monday', 'Wednesday', 'Friday', 'Sunday']
    };
    console.log(JSON.stringify(validator.run(validInput), null, 2));

    // Test 2: datos insuficientes
    console.log('\n=== TEST 2: Datos insuficientes ===');
    console.log(JSON.stringify(validator.run({ goalDistance: 10, level: 'beginner' }), null, 2));
}

module.exports = TrainingPlanValidator;
