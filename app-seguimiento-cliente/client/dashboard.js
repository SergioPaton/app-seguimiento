const API_BASE_URL = 'http://localhost:3000/api';

function showToast(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('toast-fade-out');
        setTimeout(() => {
            toast.remove();
            if (container.children.length === 0) {
                container.remove();
            }
        }, 300);
    }, 4000);
}

const userId = localStorage.getItem('stride_user_id');

if (!userId) {
    window.location.href = './login.html';
}

let currentPlan = null;
let currentUser = null;

async function init() {
    await fetchUser();
    await fetchPlan();
    setupNavigation();
    attachHelpIconListeners();
}

async function fetchUser() {
    try {
        const res = await fetch(`${API_BASE_URL}/users/${userId}`);
        if (res.ok) {
            currentUser = await res.json();
            document.getElementById('userNameDisplay').textContent = `Hola, ${currentUser.name}!`;
            populateUserStats(currentUser);
        }
    } catch (e) {
        console.error('Error fetching user:', e);
    }
}

function populateUserStats(user) {
    if (!user) return;
    document.getElementById('statsName').value = user.name || '';
    document.getElementById('statsLastName').value = user.lastName || '';
    document.getElementById('statsGender').value = user.gender || 'M';
    document.getElementById('statsAge').value = user.age || '';
    document.getElementById('statsPb5k').value = (user.pb && user.pb['5k']) || '';
    document.getElementById('statsPb10k').value = (user.pb && user.pb['10k']) || '';
    document.getElementById('statsRhr').value = user.rhr || '';
    const statsCheckboxes = document.querySelectorAll('input[name="statsDays"]');
    statsCheckboxes.forEach(cb => {
        cb.checked = user.availableDays && user.availableDays.includes(cb.value);
    });
    document.getElementById('inlineGender').value = user.gender || 'M';
    document.getElementById('inlineAge').value = user.age || '';
    if (document.getElementById('inlineLevel')) document.getElementById('inlineLevel').value = user.level || 'beginner';
    if (document.getElementById('inlineWeeklyVolume')) document.getElementById('inlineWeeklyVolume').value = user.weeklyVolume || '';
    document.getElementById('inlinePb5k').value = (user.pb && user.pb['5k']) || '';
    document.getElementById('inlinePb10k').value = (user.pb && user.pb['10k']) || '';
    document.getElementById('inlineRhr').value = user.rhr || '';
    const inlineCheckboxes = document.querySelectorAll('input[name="inlineDays"]');
    inlineCheckboxes.forEach(cb => {
        cb.checked = user.availableDays && user.availableDays.includes(cb.value);
    });
}

async function fetchPlan() {
    const planList = document.getElementById('planList');
    const planDesc = document.getElementById('planDescription');
    const deleteBtn = document.getElementById('deletePlanBtn');

    try {
        const res = await fetch(`${API_BASE_URL}/users/${userId}/training-plan`);

        if (res.ok) {
            currentPlan = await res.json();
            deleteBtn.style.display = 'block';
            planDesc.textContent = `${currentPlan.goal.description || 'Plan de Entrenamiento'} - Meta: ${currentPlan.goal.distance}km`;
            renderPlan(currentPlan);
            populateSessionOptions(currentPlan);
        } else {
            currentPlan = null;
            deleteBtn.style.display = 'none';
            planDesc.textContent = "Aún no tienes un plan activo. ¡Crea uno nuevo!";
            planList.innerHTML = `<div style="text-align: center; padding: 3rem;">
                <p>No hay plan de entrenamiento activo.</p>
                <button onclick="document.querySelector('[data-target=new-plan]').click()" class="btn btn-primary" style="margin-top: 1rem;">Crear mi primer Plan</button>
            </div>`;
        }
    } catch (e) {
        console.error('Error fetching plan:', e);
    }
}

function renderPlan(plan) {
    const planList = document.getElementById('planList');
    planList.innerHTML = '';

    if (plan.isGeneric || plan.isLoopable) {
        const levelNames = { beginner: '🐣 Principiante', intermediate: '🏃 Intermedio', advanced: '⚡ Avanzado' };
        const levelLabel = levelNames[plan.level] || plan.level || '🐣 Principiante';

        const loopBanner = document.createElement('div');
        loopBanner.style = "background: linear-gradient(135deg, #eff6ff, #dbeafe); border: 1px solid #93c5fd; border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;";
        loopBanner.innerHTML = `
            <div>
                <h4 style="margin: 0; color: #1e40af; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                    <span>🔁 Rutina Recurrente en Bucle</span>
                    <span style="background: #2563eb; color: white; padding: 0.15rem 0.6rem; border-radius: 999px; font-size: 0.75rem;">Ciclo ${plan.cycleNumber || 1}</span>
                    <span style="background: #e0e7ff; color: #3730a3; padding: 0.15rem 0.6rem; border-radius: 999px; font-size: 0.75rem;">${levelLabel}</span>
                </h4>
                <p style="margin: 0.35rem 0 0; font-size: 0.875rem; color: #1e3a8a;">
                    Rutina de ${plan.goal.distance}km (${plan.cycleWeeks || 6} semanas). Puedes reiniciarla al terminar para iniciar el siguiente ciclo con sobrecarga progresiva (+5% de carga).
                </p>
            </div>
            <button id="nextCycleBtn" class="btn" style="background: #2563eb; color: white; border: none; padding: 0.65rem 1.25rem; border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                🔁 Reiniciar / Siguiente Ciclo (+5% Sobrecarga)
            </button>
        `;
        planList.appendChild(loopBanner);

        setTimeout(() => {
            const btn = document.getElementById('nextCycleBtn');
            if (btn) {
                btn.onclick = () => {
                    showConfirm(
                        'Avanzar al Siguiente Ciclo',
                        `¿Deseas reiniciar la rutina de ${plan.goal.distance}km para comenzar el Ciclo ${(plan.cycleNumber || 1) + 1} con sobrecarga progresiva (+5% de carga)?`,
                        async () => {
                            try {
                                const res = await fetch(`${API_BASE_URL}/training/${plan.id}/next-cycle`, { method: 'POST' });
                                if (res.ok) {
                                    showToast(`¡Ciclo ${(plan.cycleNumber || 1) + 1} iniciado con éxito!`, 'success');
                                    await fetchPlan();
                                } else {
                                    showToast('No se pudo avanzar al siguiente ciclo. Inténtalo de nuevo más tarde.', 'error');
                                }
                            } catch (e) {
                                showToast('Error de conexión', 'error');
                            }
                        },
                        'Aceptar'
                    );
                };
            }
        }, 50);
    }

    plan.mesociclos.forEach((meso, mIdx) => {
        const mesoEl = document.createElement('div');
        mesoEl.innerHTML = `<h3 style="margin: 2rem 0 1rem; color: var(--color-text-light);">Bloque ${mIdx + 1}: ${meso.type}</h3>`;

        meso.microciclos.forEach(micro => {
            const weekEl = document.createElement('div');
            weekEl.className = 'week-card';
            weekEl.innerHTML = `<h4>Semana ${micro.weekNumber} <small style="color: grey; font-weight: normal;">(Desde ${micro.startDate})</small></h4>`;

            const sessionsEl = document.createElement('div');
            micro.sessions.forEach(s => {
                const sessionEl = document.createElement('div');
                sessionEl.className = 'session-item';
                sessionEl.innerHTML = `
                    <div>
                        <span class="session-type">[${s.day}] ${s.type}</span><br>
                        <small>${s.description}</small>
                    </div>
                    <div style="text-align: right;">
                        <strong>${s.targetDistance}km @ ${s.targetPace}</strong><br>
                        ${s.status === 'Completed' ? '<span class="completed-badge">Completado</span>' : ''}
                    </div>
                `;
                sessionsEl.appendChild(sessionEl);
            });
            weekEl.appendChild(sessionsEl);
            mesoEl.appendChild(weekEl);
        });
        planList.appendChild(mesoEl);
    });
}

function populateSessionOptions(plan) {
    const select = document.getElementById('linkSession');
    select.innerHTML = '<option value="">Ninguna / Carrera libre</option>';

    plan.mesociclos.forEach(meso => {
        meso.microciclos.forEach(micro => {
            micro.sessions.forEach(s => {
                if (s.status !== 'Completed') {
                    const opt = document.createElement('option');
                    opt.value = `${plan.id}|${s.id}`;
                    opt.textContent = `S${micro.weekNumber} ${s.day} - ${s.type} (${s.targetDistance}k)`;
                    select.appendChild(opt);
                }
            });
        });
    });
}

function setupNavigation() {
    const buttons = document.querySelectorAll('.sidebar-btn');
    const panels = document.querySelectorAll('.section-panel');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.target;

            buttons.forEach(b => b.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(target).classList.add('active');
        });
    });

    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('stride_user_id');
        window.location.href = './index.html';
    });

    document.getElementById('deletePlanBtn').addEventListener('click', () => {
        showConfirm(
            'Eliminar Plan de Entrenamiento',
            '¿Estás seguro de que quieres eliminar tu plan actual? Se borrarán todas las sesiones planificadas.',
            async () => {
                try {
                    const res = await fetch(`${API_BASE_URL}/training/${currentPlan.id}`, {
                        method: 'DELETE'
                    });

                    if (res.ok) {
                        showToast('Plan eliminado correctamente', 'success');
                        await fetchPlan();
                    } else {
                        throw new Error('Error en el servidor al eliminar');
                    }
                } catch (e) {
                    console.error('Error deleting plan:', e);
                    showToast('No se pudo eliminar el plan. Inténtalo de nuevo.', 'error');
                }
            },
            'Eliminar'
        );
    });
}

function showConfirm(title, message, onConfirm, confirmText = 'Eliminar') {
    const modal = document.getElementById('confirmModal');
    const titleEl = document.getElementById('modalTitle');
    const msgEl = document.getElementById('modalMessage');
    const confirmBtn = document.getElementById('modalConfirmBtn');
    const cancelBtn = document.getElementById('modalCancelBtn');

    titleEl.textContent = title;
    msgEl.textContent = message;
    confirmBtn.textContent = confirmText;
    modal.style.display = 'flex';

    const close = () => { modal.style.display = 'none'; };

    confirmBtn.onclick = () => { onConfirm(); close(); };
    cancelBtn.onclick = close;
}

function timeToSeconds(timeStr) {
    if (!timeStr) return 0;
    const parts = timeStr.split(':').map(Number);
    if (parts.length === 2) {
        return (parts[0] * 60) + parts[1];
    }
    return parts[0] * 60;
}

function secondsToTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

const goalTypeSelect = document.getElementById('goalType');
if (goalTypeSelect) {
    goalTypeSelect.addEventListener('change', (e) => {
        const label = document.getElementById('targetTimeLabel');
        const input = document.getElementById('targetTime');
        if (e.target.value === 'time') {
            label.textContent = 'Tiempo Objetivo (MM:SS)';
            input.placeholder = 'Ej: 45:00';
            input.title = 'Formato MM:SS (Ej: 45:00)';
        } else {
            label.textContent = 'Ritmo Objetivo por Kilómetro (M:SS)';
            input.placeholder = 'Ej: 5:00';
            input.title = 'Formato M:SS (Ej: 5:00)';
        }
    });
}

const planTypeSelect = document.getElementById('planType');
if (planTypeSelect) {
    planTypeSelect.addEventListener('change', (e) => {
        const container = document.getElementById('goalFieldsContainer');
        const cycleWeeksGroup = document.getElementById('cycleWeeksGroup');
        const dateInput = document.getElementById('targetDate');
        const timeInput = document.getElementById('targetTime');
        
        if (e.target.value === 'generic') {
            container.style.display = 'none';
            if (cycleWeeksGroup) cycleWeeksGroup.style.display = 'block';
            if (dateInput) dateInput.removeAttribute('required');
            if (timeInput) timeInput.removeAttribute('required');
        } else {
            container.style.display = 'block';
            if (cycleWeeksGroup) cycleWeeksGroup.style.display = 'none';
            if (dateInput) dateInput.setAttribute('required', '');
            if (timeInput) timeInput.setAttribute('required', '');
        }
    });
}

const toggleInlineBtn = document.getElementById('toggleInlineStatsBtn');
if (toggleInlineBtn) {
    toggleInlineBtn.addEventListener('click', () => {
        const container = document.getElementById('inlineStatsContainer');
        if (container.style.display === 'none') {
            container.style.display = 'block';
            toggleInlineBtn.textContent = '⚙️ Ocultar Estadísticas de Atleta';
        } else {
            container.style.display = 'none';
            toggleInlineBtn.textContent = '⚙️ Modificar mis Estadísticas de Atleta';
        }
    });
}

const myStatsForm = document.getElementById('myStatsForm');
if (myStatsForm) {
    myStatsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        const statsDays = [];
        document.querySelectorAll('input[name="statsDays"]:checked').forEach(cb => {
            statsDays.push(cb.value);
        });

        const updateData = {
            name: formData.get('name'),
            lastName: formData.get('lastName'),
            gender: formData.get('gender'),
            age: parseInt(formData.get('age')),
            pb: {
                '5k': formData.get('pb5k') || null,
                '10k': formData.get('pb10k') || null
            },
            rhr: formData.get('rhr') ? parseInt(formData.get('rhr')) : null,
            availableDays: statsDays
        };

        try {
            const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });

            if (res.ok) {
                showToast('¡Estadísticas actualizadas con éxito!', 'success');
                await fetchUser();
            } else {
                const errData = await res.json().catch(() => ({}));
                showToast(`Error al guardar estadísticas: ${errData.error || 'Inténtalo de nuevo'}`, 'error');
            }
        } catch (e) {
            showToast('Error de conexión al guardar estadísticas', 'error');
        }
    });
}

document.getElementById('newPlanForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const planType = formData.get('planType');
    const trainingMode = formData.get('trainingMode') || 'advanced';

    const inlineContainer = document.getElementById('inlineStatsContainer');
    if (inlineContainer && inlineContainer.style.display !== 'none') {
        const inlineDays = [];
        document.querySelectorAll('input[name="inlineDays"]:checked').forEach(cb => {
            inlineDays.push(cb.value);
        });

        const updateData = {
            gender: document.getElementById('inlineGender').value,
            age: parseInt(document.getElementById('inlineAge').value),
            level: document.getElementById('inlineLevel') ? document.getElementById('inlineLevel').value : 'beginner',
            weeklyVolume: (document.getElementById('inlineWeeklyVolume') && document.getElementById('inlineWeeklyVolume').value) ? parseFloat(document.getElementById('inlineWeeklyVolume').value) : null,
            pb: {
                '5k': document.getElementById('inlinePb5k').value || null,
                '10k': document.getElementById('inlinePb10k').value || null
            },
            rhr: document.getElementById('inlineRhr').value ? parseInt(document.getElementById('inlineRhr').value) : null,
            availableDays: inlineDays
        };

        try {
            const resUpdate = await fetch(`${API_BASE_URL}/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });

            if (!resUpdate.ok) {
                const errData = await resUpdate.json().catch(() => ({}));
                showToast(`Error al actualizar estadísticas de atleta: ${errData.error || 'Inténtalo de nuevo'}`, 'error');
                return;
            }
            
            await fetchUser();
        } catch (e) {
            showToast('Error al actualizar estadísticas de atleta', 'error');
            return;
        }
    }

    let planData;

    if (planType === 'generic') {
        planData = {
            userId: userId,
            isGeneric: true,
            goalDistance: parseFloat(formData.get('goalDistance')),
            level: formData.get('planLevel') || 'beginner',
            cycleWeeks: parseInt(formData.get('cycleWeeks')) || 6,
            description: formData.get('description') || null,
            trainingMode: trainingMode
        };
    } else {
        const goalType = formData.get('goalType');
        const rawTargetTime = formData.get('targetTime');
        const goalDistance = parseFloat(formData.get('goalDistance'));
        let targetTime = rawTargetTime;

        if (goalType === 'time' && rawTargetTime) {
            const totalSeconds = timeToSeconds(rawTargetTime);
            const secondPerKm = totalSeconds / goalDistance;
            targetTime = secondsToTime(secondPerKm);
        }

        planData = {
            userId: userId,
            goalDistance: goalDistance,
            targetDate: formData.get('targetDate'),
            targetTime: targetTime,
            level: formData.get('planLevel') || 'beginner',
            description: formData.get('description') || null,
            trainingMode: trainingMode
        };
    }

    try {
        const res = await fetch(`${API_BASE_URL}/training/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(planData)
        });

        if (res.ok) {
            showToast('¡Plan generado con éxito!', 'success');
            await fetchPlan();
            document.querySelector('[data-target=view-plan]').click();
        } else {
            const errData = await res.json().catch(() => ({}));
            showToast(`Error al generar el plan: ${errData.error || 'Inténtalo de nuevo'}`, 'error');
        }
    } catch (e) {
        showToast('Error de conexión al generar el plan', 'error');
    }
});

document.getElementById('logRunForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const linkVal = formData.get('linkSession');

    const rawDuration = formData.get('runDuration');
    const durationSeconds = timeToSeconds(rawDuration);

    const runData = {
        userId: userId,
        distance: parseFloat(formData.get('runDistance')),
        duration: durationSeconds,
        date: formData.get('runDate')
    };

    try {
        const resRun = await fetch(`${API_BASE_URL}/runs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(runData)
        });

        if (!resRun.ok) {
            const errData = await resRun.json().catch(() => ({}));
            throw new Error(errData.error || 'Error al guardar la carrera');
        }
        const savedRun = await resRun.json();

        if (linkVal) {
            const [planId, sessionId] = linkVal.split('|');
            const completeRes = await fetch(`${API_BASE_URL}/training/${planId}/sessions/${sessionId}/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ runId: savedRun.id })
            });
            const completeData = await completeRes.json();
            
            if (completeData.adapted) {
                showToast(`¡Plan adaptado! ${completeData.message}`, 'info');
            } else if (completeData.message) {
                showToast(completeData.message, 'success');
            }
        }

        showToast('Entrenamiento registrado correctamente', 'success');
        e.target.reset();
        await fetchPlan();
        document.querySelector('[data-target=view-plan]').click();
    } catch (e) {
        showToast(`Error al registrar el entrenamiento: ${e.message}`, 'error');
    }
});

function attachHelpIconListeners() {
    document.addEventListener('click', function(e) {
        if (e.target.matches('.help-icon')) {
            e.preventDefault();
            const msg = e.target.title;
            showToast(msg, 'info');
        }
    });
}

init();
