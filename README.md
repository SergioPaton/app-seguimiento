# Running Tracker: Sistema de Gestión de Entrenamiento Personalizado

Este proyecto es una aplicación web integral diseñada para corredores que busca optimizar su rendimiento físico mediante la gestión de datos deportivos y la automatización de la planificación del entrenamiento. El desarrollo ha sido guiado por las competencias del ciclo formativo de **Desarrollo de Aplicaciones Web (DAW)**, utilizando una arquitectura modular limpia y un motor algorítmico de periodización deportiva.

---

## 🚀 Características Principales

- **Gestión de Usuarios e Individualización:** Registro de atletas contemplando datos técnicos clave como el Ritmo Umbral de Lactato (PBC - Pace Threshold), Frecuencia Cardíaca en Reposo (RHR) y disponibilidad semanal de días de entrenamiento.
- **Motor de Periodización Deportiva Automático:** Generación automática de planes de entrenamiento estructurados de 4 a 24 semanas según la fecha de la carrera objetivo, basándose en la teoría de mesociclos y microciclos deportivos.
- **Cálculo Automático de Zonas y Ritmos:** Cálculo automático de zonas de ritmo e intensidades de entrenamiento (Z1 a Z5) adaptadas al nivel de cada atleta, además del cálculo automático de ritmos promedio por kilómetro al registrar cada sesión.
- **Gestión Completa de Actividades (CRUD):** Registro, actualización, eliminación y consulta de sesiones de carrera realizadas, incluyendo la posibilidad de buscar y filtrar actividades con parámetros avanzados.
- **Dashboard Técnico Interactivo:** Panel de control de cliente para la visualización clara del plan de entrenamiento, diferenciando las sesiones planificadas de las ya completadas.

---

## 🏗️ Arquitectura del Proyecto

El backend del proyecto está estructurado bajo los principios de **Clean Architecture** (Arquitectura Hexagonal) y **CQRS Lite** para asegurar la separación de responsabilidades y permitir una alta mantenibilidad y portabilidad:

1. **Capa de Dominio (`dominio/`):** Contiene las entidades esenciales del negocio (`Run`, `User`, `TrainingPlan`, `PlannedSession`, `Mesociclo`, `Microciclo`), reglas de validación y el motor de periodización. Está libre de dependencias externas.
2. **Capa de Aplicación (`aplication/`):** Implementa los casos de uso específicos del sistema (servicios para gestionar carreras, usuarios y planes de entrenamiento) inyectando dependencias para interactuar con la infraestructura.
3. **Capa de Infraestructura (`infrastructure/`):** Implementa los adaptadores y la persistencia de datos. Actualmente utiliza un sistema ligero y portable basado en archivos `.json` mediante el módulo `FileSystem` de Node.js, listo para ser migrado a bases de datos distribuidas (ej. MongoDB) sin alterar las capas superiores.
4. **Cliente Frontend (`app-seguimiento-cliente/client/`):** Interfaz construida con tecnologías web nativas (HTML5 semántico, Vanilla CSS3 y Vanilla JavaScript ES6+) orientada a proporcionar una experiencia fluida, interactiva y rápida.

---

## 🛠️ Stack Tecnológico

### Backend
- **Entorno de Ejecución:** [Node.js](https://nodejs.org/) (v18+)
- **Framework Web:** [Express.js](https://expressjs.com/)
- **Manejo de Peticiones y CORS:** `body-parser`, `cors`
- **Persistencia:** FileSystem de Node.js (Base de datos JSON)
- **Framework de Pruebas:** Jest

### Frontend
- **Estructura y Semántica:** HTML5
- **Estilos:** CSS3 nativo (usando variables CSS, flexbox, grid y transiciones)
- **Lógica e Interactividad:** Vanilla JavaScript (ES6) y empaquetador Vite para desarrollo rápido.

---

## 📂 Estructura de Directorios

```text
app-proyectofinal/
├── app-seguimiento/                     # Directorio del Backend (Servidor)
│   └── server/
│       ├── aplication/                  # Capa de Aplicación (Casos de Uso)
│       │   ├── runs/                    # Casos de uso de carreras
│       │   ├── training/                # Casos de uso de entrenamiento
│       │   └── users/                   # Casos de uso de usuarios
│       ├── dominio/                     # Capa de Dominio (Entidades y Lógica Central)
│       │   ├── runs/
│       │   ├── shared/
│       │   ├── training/
│       │   │   └── engine/              # Motor algorítmico de periodización
│       │   └── users/
│       ├── infrastructure/              # Capa de Infraestructura (Persistencia en JSON)
│       ├── scripts/                     # Scripts de automatización y demos
│       ├── tests/                       # Pruebas unitarias e integración (Jest)
│       ├── data/                        # Base de datos local (Archivos JSON)
│       ├── server.js                    # Punto de entrada de la API Express
│       └── package.json                 # Configuración y dependencias de Node.js
│
├── app-seguimiento-cliente/             # Directorio del Frontend (Cliente)
│   └── client/
│       ├── src/                         # Estilos y JS base
│       ├── about.html                   # Sección de información
│       ├── create-user.html             # Registro de nuevo usuario
│       ├── dashboard.html               # Panel principal del corredor
│       ├── index.html                   # Página de bienvenida / Landing
│       ├── login.html                   # Inicio de sesión
│       ├── style.css                    # Hoja de estilos global
│       └── package.json                 # Configuración del servidor de desarrollo Vite
│
├── memoria_proyecto.md                  # Memoria técnica del proyecto intermodular
├── requisitos_entregable.txt            # Requisitos del centro educativo
└── README.md                            # Guía general de uso y despliegue (este archivo)
```

---

## ⚡ Instalación y Configuración

Sigue estos pasos para levantar el entorno de desarrollo localmente:

### 1. Requisitos Previos
Asegúrate de tener instalado [Node.js](https://nodejs.org/) y npm en tu máquina.

### 2. Levantar el Servidor (Backend)
1. Navega a la carpeta del servidor:
   ```bash
   cd app-seguimiento/server
   ```
2. Instala las dependencias necesarias:
   ```bash
   npm install
   ```
3. Inicia el servidor:
   ```bash
   npm start
   ```
   *El servidor de desarrollo correrá por defecto en `http://localhost:3000`.*

### 3. Levantar el Cliente (Frontend)
1. Abre una nueva terminal y navega a la carpeta del cliente:
   ```bash
   cd app-seguimiento-cliente/client
   ```
2. Instala las dependencias para el servidor de desarrollo Vite:
   ```bash
   npm install
   ```
3. Inicia el servidor del frontend:
   ```bash
   npm run dev
   ```
   *El cliente se abrirá en la dirección provista por Vite, normalmente `http://localhost:5173` o similar.*

---

## 🧪 Pruebas y Control de Calidad

El backend cuenta con una suite de pruebas unitarias y de integración que validan el comportamiento del motor de periodización, los repositorios y la API de Express.

Para ejecutar los tests:
1. Asegúrate de estar en el directorio `app-seguimiento/server`.
2. Ejecuta el comando:
   ```bash
   npm test
   ```

---

## 🧑‍💻 Autor

- **Alumno:** Sergio Patón García (DAW - Ucademy)
- **Tutor:** Rodrigo Castellano
- **Curso:** 2025-2026
