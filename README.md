# App Seguimiento de Carreras (Running Tracker)

Una aplicación personal minimalista para el seguimiento y la creacion de entrenamientos de carrera.

## 🚀 Características
- **Gestión de Carreras**: CRUD completo (Crear, Listar, Buscar, Actualizar, Borrar).
- **Cálculo Automático**: Generación automática de ritmo (pace) basado en distancia y duración.
- **Validación Avanzada**:
  - Prevención de duplicados.
  - Bloqueo de fechas futuras y límites históricos (min. año 2000).
  - Validación de coherencia matemática entre distancia, tiempo y ritmo.
  - Sanitización de notas (limpieza de HTML).
- **Persistencia Local**: Almacenamiento simple y ligero en archivos `.json`.
- **Arquitectura Modular**: Lógica de negocio separada en servicios de aplicación.

## 🛠️ Tecnologías
- **Backend**: Node.js, Express, Cors, Body-parser.
- **Persistencia**: Sistema de archivos (fs) con JSON.
- **Frontend**: (En desarrollo) Vanilla JS con diseño premium.

## 📁 Estructura del Proyecto
```text
app-seguimiento/
├── server/
│   ├── aplication/
│   │   └── runs/          # Lógica de negocio (Crear, Validar, etc.)
│   ├── infrastructure/    # Persistencia (Repositorios)
│   ├── data/              # Archivos JSON de datos
│   └── server.js          # Punto de entrada de la API
└── client/                # Archivos del frontend (HTML/CSS/JS)
```

## 🔌 API Endpoints
- `GET /api/runs`: Lista todas las carreras.
- `GET /api/runs/:id`: Obtiene una carrera específica.
- `GET /api/runs/search`: Busca carreras por fecha o contenido en notas.
- `POST /api/runs`: Registra una nueva carrera.
- `PUT /api/runs/:id`: Actualiza una carrera existente.
- `DELETE /api/runs/:id`: Elimina un registro.

## 🏃 Cómo empezar
1. Navega a `server/`.
2. Instala dependencias: `npm install`.
3. Inicia el servidor: `node server.js`.
4. El servidor estará disponible en `http://localhost:3000`.
