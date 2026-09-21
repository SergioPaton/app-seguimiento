// URL base del backend de la aplicación para interactuar con la API
const API_BASE_URL = 'http://localhost:3000/api';

// Obtención del ID del usuario autenticado almacenado localmente
const userId = localStorage.getItem('stride_user_id');

// Redirección al login en caso de no existir una sesión activa
if (!userId) {
    window.location.href = './login.html';
}

// Variables de estado local de la aplicación
let currentPlan = null;  // Almacena el plan de entrenamiento cargado
let currentUser = null;   // Almacena la información del usuario actual

/**
 * Función de inicialización principal. Ejecutada al cargar la página.
 */
async function init() {
    await fetchUser();       // Obtiene datos del atleta
    await fetchPlan();       // Obtiene el plan de entrenamiento activo
    setupNavigation();       // Inicializa listeners de UI y navegación
}

/**
 * Recupera los datos del usuario/atleta desde el servidor backend.
 */
async function fetchUser() {
    try {
        const res = await fetch(`${API_BASE_URL}/users/${userId}`);
        if (res.ok) {
            currentUser = await res.json();
            // Actualiza la UI con el nombre del usuario
            document.getElementById('userNameDisplay').textContent = `Hola, ${currentUser.name}!`;
            populateUserStats(currentUser); // Rellena los formularios con sus datos
        }
    } catch (e) {
        console.error('Error fetching user:', e);
    }
}

/**
 * Rellena los diferentes campos de los formularios de configuración del atleta con sus datos actuales.
 * @param {Object} user - Objeto con los datos del usuario.
 */
function populateUserStats(user) {
    if (!user) return;
    
    // Rellena los campos de la sección de estadísticas principales
    document.getElementById('statsName').value = user.name || '';
    document.getElementById('statsLastName').value = user.lastName || '';
    document.getElementById('statsGender').value = user.gender || 'M';
    document.getElementById('statsAge').value = user.age || '';
    document.getElementById('statsPb5k').value = (user.pb && user.pb['5k']) || '';
    document.getElementById('statsPb10k').value = (user.pb && user.pb['10k']) || '';
    document.getElementById('statsRhr').value = user.rhr || '';
    
    // Marca los checkboxes de días de entrenamiento disponibles en la sección principal
    const statsCheckboxes = document.querySelectorAll('input[name="statsDays"]');
    statsCheckboxes.forEach(cb => {
        cb.checked = user.availableDays && user.availableDays.includes(cb.value);
    });

    // Rellena la sección de edición rápida (inline) dentro de la pestaña de Nuevo Objetivo
    document.getElementById('inlineGender').value = user.gender || 'M';
    document.getElementById('inlineAge').value = user.age || '';
    if (document.getElementById('inlineLevel')) document.getElementById('inlineLevel').value = user.level || 'beginner';
    if (document.getElementById('inlineWeeklyVolume')) document.getElementById('inlineWeeklyVolume').value = user.weeklyVolume || '';
    document.getElementById('inlinePb5k').value = (user.pb && user.pb['5k']) || '';
    document.getElementById('inlinePb10k').value = (user.pb && user.pb['10k']) || '';
    document.getElementById('inlineRhr').value = user.rhr || '';
    
    // Marca los checkboxes de la sección rápida (inline)
    const inlineCheckboxes = document.querySelectorAll('input[name="inlineDays"]');
    inlineCheckboxes.forEach(cb => {
        cb.checked = user.availableDays && user.availableDays.includes(cb.value);
    });
}

/**
 * Recupera el plan de entrenamiento activo del usuario desde el servidor.
 */
async function fetchPlan() {
    const planList = document.getElementById('planList');
    const planDesc = document.getElementById('planDescription');
    const deleteBtn = document.getElementById('deletePlanBtn');

    try {
        const res = await fetch(`${API_BASE_URL}/users/${userId}/training-plan`);

        if (res.ok) {
            currentPlan = await res.json();
            deleteBtn.style.display = 'block'; // Muestra el botón para eliminar el plan actual
            planDesc.textContent = `${currentPlan.goal.description || 'Plan de Entrenamiento'} - Meta: ${currentPlan.goal.distance}km`;
            renderPlan(currentPlan); // Dibuja el plan en pantalla
            populateSessionOptions(currentPlan); // Rellena el selector para vincular entrenamientos
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

/**
 * Renderiza el plan de entrenamiento en la interfaz de usuario en forma de bloques y semanas.
 * @param {Object} plan - Objeto del plan de entrenamiento que contiene mesociclos y sesiones.
 */
function renderPlan(plan) {
    const planList = document.getElementById('planList');
    planList.innerHTML = '';

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

/**
 * Rellena el selector desplegable en el formulario de registrar entrenamiento con las sesiones planificadas no completadas.
 * @param {Object} plan - El plan de entrenamiento del usuario.
 */
function populateSessionOptions(plan) {
    const select = document.getElementById('linkSession');
    // Mantenemos la opción por defecto
    select.innerHTML = '<option value="">Ninguna / Carrera libre</option>';

    plan.mesociclos.forEach(meso => {
        meso.microciclos.forEach(micro => {
            micro.sessions.forEach(s => {
                // Solo muestra sesiones que no hayan sido completadas aún
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

/**
 * Configura la navegación de pestañas en el panel lateral y eventos clave.
 */
function setupNavigation() {
    const buttons = document.querySelectorAll('.sidebar-btn');
    const panels = document.querySelectorAll('.section-panel');

    // Cambios visuales al hacer clic en botones laterales
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.target;

            buttons.forEach(b => b.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(target).classList.add('active');
        });
    });

    // Cerrar sesión
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('stride_user_id');
        window.location.href = './index.html';
    });

    // Eliminar plan actual mediante confirmación modal
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
            }
        );
    });
}

/**
 * Muestra un modal de confirmación personalizado.
 * @param {string} title - Título del modal.
 * @param {string} message - Mensaje descriptivo.
 * @param {Function} onConfirm - Callback que se ejecuta tras aceptar la acción.
 */
function showConfirm(title, message, onConfirm) {
    const modal = document.getElementById('confirmModal');
    const titleEl = document.getElementById('modalTitle');
    const msgEl = document.getElementById('modalMessage');
    const confirmBtn = document.getElementById('modalConfirmBtn');
    const cancelBtn = document.getElementById('modalCancelBtn');

    titleEl.textContent = title;
    msgEl.textContent = message;
    modal.style.display = 'flex';

    const close = () => { modal.style.display = 'none'; };

    confirmBtn.onclick = () => { onConfirm(); close(); };
    cancelBtn.onclick = close;
}

/**
 * Muestra alertas visuales temporales.
 * @param {string} message - Mensaje a mostrar.
 * @param {'success'|'error'} type - Tipo de notificación.
 */
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

/**
 * Convierte un formato de tiempo string MM:SS o M:SS en segundos enteros.
 * @param {string} timeStr - Tiempo en formato MM:SS.
 * @returns {number} Segundos equivalentes.
 */
function timeToSeconds(timeStr) {
    if (!timeStr) return 0;
    const parts = timeStr.split(':').map(Number);
    if (parts.length === 2) {
        return (parts[0] * 60) + parts[1];
    }
    return parts[0] * 60;
}

/**
 * Convierte segundos enteros en un string con formato MM:SS.
 * @param {number} seconds - Segundos totales.
 * @returns {string} Tiempo formateado.
 */
function secondsToTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

// Escucha cambios en la selección de tipo de meta para ajustar la etiqueta e inputs del formulario
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

// Escucha cambios en el selector de tipo de plan (carrera vs genérico) para alternar visibilidad de campos de meta
const planTypeSelect = document.getElementById('planType');
if (planTypeSelect) {
    planTypeSelect.addEventListener('change', (e) => {
        const container = document.getElementById('goalFieldsContainer');
        const distanceInput = document.getElementById('goalDistance');
        const dateInput = document.getElementById('targetDate');
        const timeInput = document.getElementById('targetTime');
        
        if (e.target.value === 'generic') {
            container.style.display = 'none';
            distanceInput.removeAttribute('required');
            dateInput.removeAttribute('required');
            timeInput.removeAttribute('required');
        } else {
            container.style.display = 'block';
            distanceInput.setAttribute('required', '');
            dateInput.setAttribute('required', '');
            timeInput.setAttribute('required', '');
        }
    });
}

// Alterna la visibilidad de la sección inline de estadísticas del atleta en la generación del nuevo objetivo
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

// Envío del formulario de la pestaña de estadísticas
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
                await fetchUser(); // Sincroniza datos en UI
            } else {
                const errData = await res.json().catch(() => ({}));
                showToast(`Error al guardar estadísticas: ${errData.error || 'Inténtalo de nuevo'}`, 'error');
            }
        } catch (e) {
            showToast('Error de conexión al guardar estadísticas', 'error');
        }
    });
}

// Envío del formulario para generar un nuevo plan inteligente
document.getElementById('newPlanForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const planType = formData.get('planType');

    // 1. Si las estadísticas inline del atleta están editándose, se guardan primero.
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
                return; // Frena si falla el guardado del perfil
            }
            
            await fetchUser(); // Sincroniza localmente
        } catch (e) {
            showToast('Error al actualizar estadísticas de atleta', 'error');
            return;
        }
    }

    let planData;

    // Estructuración de datos para el endpoint /training/generate
    if (planType === 'generic') {
        planData = {
            userId: userId,
            isGeneric: true,
            description: formData.get('description')
        };
    } else {
        const goalType = formData.get('goalType');
        const rawTargetTime = formData.get('targetTime');
        const goalDistance = parseFloat(formData.get('goalDistance'));
        let targetTime = rawTargetTime;

        // Si se define tiempo total objetivo, se realiza una conversión matemática en el cliente a ritmo (pace)
        if (goalType === 'time') {
            const totalSeconds = timeToSeconds(rawTargetTime);
            const secondPerKm = totalSeconds / goalDistance;
            targetTime = secondsToTime(secondPerKm);
        }

        planData = {
            userId: userId,
            goalDistance: goalDistance,
            targetDate: formData.get('targetDate'),
            targetTime: targetTime, // Envío del ritmo calculado
            description: formData.get('description')
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

// Envío del formulario para registrar una sesión realizada físicamente
document.getElementById('logRunForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const linkVal = formData.get('linkSession'); // Formato de valor: planId|sessionId

    // Formatear duración de MM:SS a segundos
    const rawDuration = formData.get('runDuration');
    const durationSeconds = timeToSeconds(rawDuration);

    const runData = {
        userId: userId,
        distance: parseFloat(formData.get('runDistance')),
        duration: durationSeconds,
        date: formData.get('runDate')
    };

    try {
        // 1. Registra la sesión completada en el historial general de carreras
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

        // 2. Si se vinculó a una sesión planificada, la marca como completada y vincula el ID del log real
        if (linkVal) {
            const [planId, sessionId] = linkVal.split('|');
            await fetch(`${API_BASE_URL}/training/${planId}/sessions/${sessionId}/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ runId: savedRun.id })
            });
        }

        showToast('Entrenamiento registrado correctamente', 'success');
        e.target.reset();
        await fetchPlan();
        document.querySelector('[data-target=view-plan]').click();
    } catch (e) {
        showToast(`Error al registrar el entrenamiento: ${e.message}`, 'error');
    }
});

// Ejecución de la inicialización de la página
init();
