# Estándares aplicados a AquaLab

## Fuentes

Este documento adapta al proyecto las reglas de:

- `C:\Users\Adria\Documents\Prompts\PRINCIPIOS.md`.
- `C:\Users\Adria\Documents\Prompts\prompt-documentacion-codigo_tsx-js-php.md`.

El segundo documento describe un sistema hidropónico con TypeScript, React,
Fastify, Prisma y PostgreSQL. AquaLab es una aplicación frontend en JavaScript
con Three.js y no contiene esos módulos. Por eso solo se aplican sus reglas de
documentación, separación de responsabilidades y trazabilidad que son válidas
para la implementación actual.

## Aplicación en el proyecto

### Arquitectura y responsabilidades

- `index.html` contiene la estructura semántica y los puntos de montaje de la UI.
- `src/style.css` contiene la presentación visual y los estados responsive.
- `src/main.js` contiene el estado de interacción, el cálculo educativo y el
  adaptador de escena 3D.
- `qualityAfter`, `qualityScore` y `computeSimulation` forman el núcleo de
  cálculo determinista. No dependen de Three.js ni del DOM.
- `PurificationScene` encapsula la construcción y actualización de la escena;
  recibe una instantánea calculada y no decide reglas de calidad.

Esta separación aplica responsabilidad única, separación de responsabilidades,
bajo acoplamiento y una arquitectura por capas adaptada a una aplicación sin
backend.

### Modelo de datos y unidades

- `turbidity`, `chlorine` y `microorganisms` son índices porcentuales educativos.
- `minerals` se expresa en `mg/L`.
- `duration` se expresa en segundos simulados.
- Cada etapa aplica reducciones sobre el resultado de la etapa anterior; las
  concentraciones no se suman directamente.
- El índice de calidad de 0 a 100 sirve para comparar visualmente los estados y
  no representa una certificación sanitaria.

### Entrada y validación

- El timeline usa un control nativo con rango `0..1000` y el cálculo vuelve a
  limitar el progreso a `0..1` antes de procesarlo.
- Las velocidades disponibles provienen de una lista cerrada en la interfaz.
- Las capas se identifican por IDs declarados en `FILTERS`; no se incorporan
  nombres arbitrarios a la simulación.
- La última capa no puede desactivarse si eso dejaría el sistema sin etapas.
- El HTML dinámico se construye con constantes internas del proyecto. Los textos
  derivados del estado se escriben con `textContent`.

### Estado, reversibilidad y determinismo

El estado visible se recalcula desde `progress` y la configuración de capas.
Esto permite avanzar y retroceder sin acumular mutaciones en las métricas. El
reloj real solo mide reproducción; el tiempo simulado se deriva de la duración
de las capas activas.

Las partículas son un efecto visual independiente del resultado educativo. La
aleatoriedad visual no participa en la calidad, las métricas ni el timeline.

### Seguridad y alcance

La aplicación no recibe credenciales, tokens, cookies, datos personales ni
solicitudes a una API. Por tanto, autenticación, autorización, CSRF, SQL
Injection, Prisma, PostgreSQL, rate limiting y gestión de secretos no son
componentes aplicables en esta versión.

No se deben agregar secretos al código ni convertir los textos de la interfaz
en contenido HTML proporcionado por usuarios si el proyecto incorpora entradas
externas en el futuro.

### Verificación y evidencia

La validación mínima de esta versión es:

```bash
npm install
npm run build
npm run dev
```

El build confirma que Vite puede transformar y empaquetar la aplicación. La
verificación funcional debe cubrir Play/Pausa, reinicio, timeline reversible,
selección de capas, radiografía, activación de filtros y adaptación responsive.

### Observabilidad

La aplicación muestra estado de proceso, etapa activa, tiempo simulado, tiempo
real y métricas de calidad en la interfaz. No existe telemetría remota ni
registro de usuarios en el alcance actual; no se presenta esa capacidad como si
estuviera implementada.

## Convención de documentación

Los comentarios del código se escriben en español y explican reglas de dominio,
unidades o decisiones no evidentes. Se evita comentar asignaciones y condiciones
obvias. Las funciones que producen estados importantes incluyen JSDoc con su
propósito, parámetros y resultado semántico.
