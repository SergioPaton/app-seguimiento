# Memoria del Proyecto Intermodular: Running Tracker - Sistema de Gestión de Entrenamiento Personalizado

**Alumno:** Sergio Patón García
**Ciclo Formativo:** Desarrollo de Aplicaciones Web (DAW)
**Curso:** 2025-2026
**Centro Educativo:** Ucademy
**Tutor/a:** Rodrigo Castellano
**Modalidad Seleccionada:** Modalidad 3: Desarrollo de procesos, productos o servicios
**Fecha de Entrega:** 14 de abril de 2026

---

## 2. Índice
1. Portada
2. Índice
3. Resumen 
4. Introducción
   - 4.1. Marco General y Contextualización
   - 4.2. Planteamiento del Problema
   - 4.3. Justificación de la Modalidad Elegida
   - 4.4. Objetivos del Proyecto
     - 4.4.1. Objetivo General
     - 4.4.2. Objetivos Específicos
   - 4.5. Alcance y Límites del Proyecto
5. Marco Teórico y Referencial
   - 5.1. Evolución del Running como Fenómeno Social y Tecnológico
   - 5.2. Fundamentos de la Periodización del Entrenamiento Deportivo
   - 5.3. Tecnologías de Desarrollo Web Empleadas (DAW Stack)
6. Desarrollo del Proyecto (Basado en la Modalidad de Procesos)
   - 6.1. Metodología de Trabajo (Agile & GitFlow)
   - 6.2. Análisis de Requisitos (Sapiens del Proyecto)
     - 6.2.1. Requisitos Funcionales
     - 6.2.2. Requisitos No Funcionales
   - 6.3. Diseño de la Arquitectura (Clean Architecture & CQRS Lite)
   - 6.4. Desarrollo de la Lógica de Negocio (Motor de Periodización)
   - 6.5. Implementación del Frontend y Experiencia de Usuario
7. Resultados y Evaluación
   - 7.1. Cumplimiento de Objetivos
   - 7.2. Pruebas de Calidad y Tests de Integración
   - 7.3. Valoración del Impacto en el Usuario Final
8. Conclusiones
   - 8.1. Reflexión Crítica sobre el Desarrollo
   - 8.2. Aprendizajes Técnicos y Transversales
   - 8.3. Líneas de Trabajo Futuras
9. Bibliografía y Recursos
10. Anexos

---

## 3. Resumen 
El presente proyecto, titulado "Running Tracker", describe el diseño e implementación de una aplicación web integral destinada a la optimización del rendimiento en corredores mediante la gestión de datos y la automatización de la planificación deportiva. El sistema propone un puente entre las aplicaciones de registro pasivo (diarios de entrenamiento) y el asesoramiento profesional, integrando algoritmos de periodización clásica para generar planes personalizados. El desarrollo se ha ejecutado bajo una arquitectura modular (Hexagonal) para garantizar la escalabilidad y mantenibilidad, permitiendo la evolución desde una persistencia local JSON hacia sistemas de datos distribuidos.


---

## 4. Introducción

### 4.1. Marco General y Contextualización
El deporte del running ha experimentado un crecimiento exponencial en España. Según datos del Consejo Superior de Deportes, la práctica del atletismo y el running se ha triplicado en la última década, convirtiéndose en el segundo deporte más practicado. Este fenómeno no es solo deportivo, sino social y tecnológico. Los corredores actuales demandan datos precisos y, sobre todo, una interpretación de los mismos que les ayude a mejorar sin riesgo de lesión.

"Running Tracker" se inserta en este contexto como una herramienta que democratiza el acceso al entrenamiento planificado, tradicionalmente reservado a atletas de élite o usuarios dispuestos a pagar cuotas mensuales elevadas.

### 4.2. Planteamiento del Problema
El corredor medio se enfrenta a retos que este proyecto aborda sistemáticamente:
1.  **Incapacidad de Estructuración:** Entrenar sin un plan lleva rápidamente al sobreentrenamiento o al desánimo por falta de resultados.
2.  **Complejidad del Cálculo:** Determinar los ritmos exactos para "series de mil" o "rodajes regenerativos" basándose en una marca personal es una tarea matemática tediosa.
3.  **Falta de Adaptabilidad:** Las aplicaciones comerciales suelen ofrecer planes rígidos. Este proyecto permite adaptar los días de entrenamiento a la vida laboral y personal del usuario.

### 4.3. Justificación de la Modalidad Elegida
La **Modalidad 3: Desarrollo de procesos, productos o servicios** es la elegida por su carácter eminentemente aplicado. 

Justificación técnica profunda:
- **Desarrollo Integral:** Abarca el ciclo de vida completo del desarrollo de software (Análisis, Diseño, Codificación, Testeo).
- **Proceso Técnico Crítico:** El "Motor de Entrenamiento" es un algoritmo que traduce la "Ciencia del Deporte" a "Lógica de Programación", lo que constituye un desarrollo de proceso técnico puro.
- **Intermodulariedad:** El proyecto permite demostrar competencias en *Despliegue de Aplicaciones* (Docker), *Diseño de Interfaces* (CSS avanzado), *Entorno Servidor* (NodeJS) y *Entorno Cliente* (JS moderno).

### 4.4. Objetivos del Proyecto

#### 4.4.1. Objetivo General
Desarrollar una aplicación web para atletas que automatice la periodización del entrenamiento, permitiendo una preparación científica, personalizada y accesible.

#### 4.4.2. Objetivos Específicos
- **Arquitectura Limpia:** Implementar un sistema desacoplado que permita cambiar el medio de persistencia (ej. de JSON a MongoDB) sin afectar a la lógica de negocio.
- **Algoritmia Deportiva:** Desarrollar un motor que distribuya cargas de entrenamiento según la teoría de los Mesociclos y Microciclos.
- **Validación Robusta:** Asegurar que los datos introducidos por el usuario son lógicos mediante un sistema de validación centralizado que prevenga duplicados y fechas inconsistentes.
- **Dashboard Técnico:** Crear una interfaz que visualice el plan de entrenamiento con claridad, separando las sesiones completadas de las planificadas.

### 4.5. Alcance y Límites del Proyecto
**Alcance:**
- Gestión de perfiles técnicos (PBC, RHR, disponibilidad).
- Generador de planes automáticos de 4 a 24 semanas según fecha de carrera.
- CRUD total de sesiones realizadas con cálculo de ritmos automático.
- Sistema de búsqueda y filtrado avanzado de sesiones.

**Límites:**
- No incluye integración automática con el API de Strava o Garmin en esta versión (v1.0.0).
- La lógica de autorregulación (basada en escalas RPE) está diseñada pero no implementada en su totalidad.

---

## 5. Marco Teórico y Referencial

### 5.1. Evolución de la Tecnología en el Running
Desde el cronómetro manual hasta los sistemas GPS con predictores de marca basados en IA, la tecnología ha sido el gran aliado del corredor. Este proyecto se fundamenta en la corriente de "Data-Driven Training".

### 5.2. Fundamentos de la Periodización Deportiva
Se han aplicado los principios de:
- **Principio de Individualización:** Ningún plan es igual a otro; se adaptan al nivel real del atleta.
- **Principio de Progresión:** Aumento gradual del volumen para evitar lesiones.
- **Zonas de Entrenamiento:** División en 5 zonas de intensidad basadas en el ritmo umbral del usuario (Z1 Recuperación -> Z5 Esprint).

### 5.3. Tecnologías de Desarrollo Web (Stack)
- **Node.js:** Por su velocidad de ejecución en operaciones I/O.
- **Express.js:** Como framework ligero para la gestión de rutas y middlewares.
- **Body-Parser & Cors:** Para la gestión de datos y seguridad en la comunicación.
- **FileSystem (fs):** Utilizado para una persistencia ligera y portable en formato .json.

---

## 6. Desarrollo del Proyecto

### 6.1. Metodología de Trabajo
Se ha implementado una metodología **Agile** simplificada.
- **Sprints semanales:** Para la entrega de funcionalidades incrementales.
- **GitFlow:** Ramas `main` para producción, `develop` para integración y ramas `feature/` para nuevas funcionalidades.

### 6.2. Análisis de Requisitos

#### 6.2.1. Requisitos Funcionales (RF)
- **RF1:** El sistema debe permitir la creación de planes para distancias de 5k, 10k, 21k y 42k.
- **RF2:** El sistema debe calcular el ritmo por kilómetro automáticamente al subir una carrera.
- **RF3:** El sistema debe impedir la creación de sesiones en fechas pasadas.

#### 6.2.2. Requisitos No Funcionales (RNF)
- **RNF1: Portabilidad:** El servidor puede ejecutarse en cualquier entorno con Node.js instalado.
- **RNF2: Mantenibilidad:** Código documentado y modularizado por capas.

---

## 7. Resultados y Evaluación

### 7.1. Cumplimiento de Objetivos
Se ha conseguido un prototipo funcional donde un usuario puede registrarse, definir su nivel y obtener un plan de entrenamiento completo en menos de 5 segundos.

### 7.2. Evaluación de Calidad
Se han realizado pruebas de estres y tests de integración que validan la respuesta de la API frente a datos erróneos, garantizando la estabilidad del servicio.

---

## 8. Conclusiones
El desarrollo del proyecto "Running Tracker" demuestra que es posible llevar un proceso técnico complejo de la ciencia del deporte al desarrollo de software web. La arquitectura implementada permite que el proyecto siga creciendo hacia una plataforma SaaS completa.

---

## 9. Bibliografía y Recursos
1.  Bompa, T. O., & Buzzichelli, C. (2018). *Periodization: Theory and Methodology of Training*. Human Kinetics.
2.  Martin, R. C. (2017). *Clean Architecture: A Craftsman's Guide to Software Structure and Design*. Prentice Hall.
3.  Node.js Foundation. (2025). *Official Documentation*.
4.  MDN Web Docs. *JavaScript and CSS Reference*.
