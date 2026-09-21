// Intersection Observer para manejar las animaciones de aparición gradual (fade-in)
const observerOptions = {
    threshold: 0.1 // Porcentaje de visibilidad del elemento requerido para activar el callback (10%)
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        // Cuando el elemento entra en el viewport, se le añade la clase 'visible'
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// Registra todos los elementos con la clase '.fade-in' en el observador
document.querySelectorAll('.fade-in').forEach(el => {
    observer.observe(el);
});

// Desplazamiento suave (smooth scroll) para enlaces internos que apuntan a un ancla (#)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault(); // Cancela el comportamiento de navegación por defecto
        const targetId = this.getAttribute('href');
        if (targetId === '#') return; // Omite anclas vacías o de reset

        // Desplaza la vista suavemente hacia el elemento objetivo
        document.querySelector(targetId).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

console.log('Stride landing page loaded successfully! ⚡');

