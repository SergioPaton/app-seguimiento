// Importación de los estilos globales de la aplicación
import './style.css'

// Importación de los logosSVG para utilizarlos dinámicamente
import javascriptLogo from './javascript.svg'
import viteLogo from '/vite.svg'

// Importación del módulo que configura la funcionalidad interactiva del contador
import { setupCounter } from './counter.js'

// Inyección de la plantilla HTML básica en el contenedor del punto de entrada (#app)
document.querySelector('#app').innerHTML = `
  <div>
    <!-- Enlace y logotipo de Vite -->
    <a href="https://vite.dev" target="_blank">
      <img src="${viteLogo}" class="logo" alt="Vite logo" />
    </a>
    
    <!-- Enlace y logotipo de JavaScript vanilla -->
    <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript" target="_blank">
      <img src="${javascriptLogo}" class="logo vanilla" alt="JavaScript logo" />
    </a>
    
    <h1>Hello Vite!</h1>
    
    <!-- Contenedor del botón del contador interactivo -->
    <div class="card">
      <button id="counter" type="button"></button>
    </div>
    
    <p class="read-the-docs">
      Click on the Vite logo to learn more
    </p>
  </div>
`

// Inicialización de la lógica del contador en el botón recién inyectado en el DOM
setupCounter(document.querySelector('#counter'))

