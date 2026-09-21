/**
 * Configura un contador interactivo en un elemento del DOM.
 * Incrementa el valor cada vez que se hace clic en el elemento.
 * 
 * @param {HTMLElement} element - El elemento del DOM donde se renderizará el contador y se escuchará el clic.
 */
export function setupCounter(element) {
  let counter = 0 // Inicializa el estado del contador interno
  
  /**
   * Actualiza el valor del contador en la interfaz de usuario.
   * @param {number} count - El nuevo valor a mostrar.
   */
  const setCounter = (count) => {
    counter = count
    element.innerHTML = `El valor es ${counter}`
  }
  
  // Registra el evento de clic para incrementar el contador en 1
  element.addEventListener('click', () => setCounter(counter + 1))
  
  // Inicializa el contador a 0 al cargar
  setCounter(0)
}

