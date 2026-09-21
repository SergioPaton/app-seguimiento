// URL base del backend de la aplicación para realizar peticiones HTTP
const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Muestra una notificación temporal en pantalla (Toast) al usuario.
 * @param {string} message - El mensaje de texto que se va a mostrar.
 * @param {'success' | 'error' | 'info'} type - El tipo de notificación que define su aspecto visual.
 */
function showToast(message, type = 'success') {
    // Busca o crea un contenedor para los toasts en el DOM
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    // Crea la estructura del toast individual
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    // Configura la animación de salida y eliminación automática de la alerta tras unos segundos
    setTimeout(() => {
        toast.classList.add('toast-fade-out');
        setTimeout(() => {
            toast.remove();
            // Si no quedan más toasts visibles, elimina el contenedor general
            if (container.children.length === 0) {
                container.remove();
            }
        }, 300); // Duración de la animación de fade-out
    }, 4000); // Tiempo en pantalla
}

// Escucha el evento de envío (submit) del formulario de inicio de sesión
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault(); // Previene el refresco por defecto de la página

    // Obtención de los valores ingresados por el usuario
    const name = document.getElementById('name').value.trim();
    const password = document.getElementById('password').value;

    try {
        // Petición POST al endpoint de login con las credenciales
        const response = await fetch(`${API_BASE_URL}/users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, password })
        });

        // Manejo de errores devueltos por el backend
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || 'Credenciales incorrectas');
        }

        // Obtención de la información del usuario en la respuesta exitosa
        const user = await response.json();

        console.log('Login exitoso:', user);
        
        // Guarda el ID del usuario en localStorage para persistir la sesión
        localStorage.setItem('stride_user_id', user.id);
        
        // Muestra notificación de bienvenida
        showToast(`¡Hola de nuevo, ${user.name}!`, 'success');
        
        // Redirige al dashboard después de un breve delay para permitir ver el mensaje de éxito
        setTimeout(() => {
            window.location.href = './dashboard.html';
        }, 1200);
    } catch (error) {
        console.error('Error:', error);
        // Muestra mensaje de error en pantalla
        showToast(error.message || 'Hubo un problema al conectar con el servidor.', 'error');
    }
});

