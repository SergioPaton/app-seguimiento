// URL base de la API del servidor local
const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Muestra notificaciones temporales en pantalla.
 * @param {string} message - El mensaje que se presentará.
 * @param {'success'|'error'} type - El tipo de alerta (éxito o error).
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
    
    // Desvanecer y remover el toast automáticamente
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

// Evento que se dispara al enviar el formulario para crear un nuevo atleta
document.getElementById('createUserForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Obtención y procesamiento de los datos del formulario mediante la API FormData
    const formData = new FormData(e.target);
    const days = [];
    formData.getAll('days').forEach(day => days.push(day));

    // Validación mínima: Debe seleccionar al menos un día de la semana para entrenar
    if (days.length === 0) {
        showToast('Por favor, selecciona al menos un día para entrenar.', 'error');
        return;
    }

    // Estructuración del objeto JSON con los datos del usuario requerido por el backend
    const userData = {
        name: formData.get('name'),
        lastName: formData.get('lastName'),
        password: formData.get('password'),
        gender: formData.get('gender'),
        age: parseInt(formData.get('age')),
        level: formData.get('level') || 'beginner',
        weeklyVolume: formData.get('weeklyVolume') ? parseFloat(formData.get('weeklyVolume')) : null,
        pb: {}, // Personal Bests (Mejores Marcas)
        availableDays: days
    };

    // Añade de forma condicional las marcas de 5k y 10k si fueron ingresadas
    if (formData.get('pb5k')) userData.pb['5k'] = formData.get('pb5k');
    if (formData.get('pb10k')) userData.pb['10k'] = formData.get('pb10k');

    try {
        // Petición POST para guardar el nuevo usuario en el servidor
        const response = await fetch(`${API_BASE_URL}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        // Verificación de respuesta exitosa
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || 'Error al crear el usuario');
        }

        const newUser = await response.json();
        console.log('Usuario creado:', newUser);

        // Guardamos el ID en localStorage para autenticar de forma automática
        localStorage.setItem('stride_user_id', newUser.id);

        showToast('¡Perfil creado con éxito! Ahora vamos a generar tu plan.', 'success');
        
        // Redirigimos al dashboard tras un leve retardo
        setTimeout(() => {
            window.location.href = './dashboard.html';
        }, 1200);
    } catch (error) {
        console.error('Error:', error);
        showToast(`Hubo un problema: ${error.message}. Asegúrate de que el backend esté corriendo.`, 'error');
    }
});

