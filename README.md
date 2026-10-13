<!-- readme-standard:v1 -->
<!-- Esta línea permite que los agentes de IA reconozcan y actualicen este README. No la borres. -->

<!-- section:header -->
# AquaLab · Simulador 3D de purificación de agua

> Simulador educativo interactivo para explorar la purificación del agua por etapas mediante una escena 3D.

<!-- section:toc -->
## 📑 Contenido

- [Aspectos destacados](#-aspectos-destacados)
- [Descripción](#-descripción)
- [Requisitos](#-requisitos)
- [Instalación](#-instalación)
- [Uso](#-uso)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Datos](#-datos)
- [Desarrollo](#-desarrollo)
- [Soporte y contribuciones](#-soporte-y-contribuciones)
- [Licencia](#-licencia)

<!-- section:highlights -->
## 🌟 Aspectos destacados

- **Dos escenarios 3D**: compara el balde-barril por capas con la captación de lluvia de ocho pasos.
- **Recorrido temporal**: reproduce, pausa y explora el proceso con una línea de tiempo ponderada por la duración de cada etapa.
- **Etapas configurables**: activa o desactiva capas del balde-barril y etapas de captación desde el panel flotante.
- **Lectura por etapa**: compara el índice de calidad antes y después de cada capa.
- **Herramientas educativas**: consulta uso final, calculadora, presupuesto, mantenimiento, muestreo y seguridad.

<!-- section:overview -->
## ℹ️ Descripción

AquaLab ayuda a explicar cómo dos escenarios de tratamiento pueden reducir turbidez, color y olor en un recorrido visual. Está pensado para demostraciones y aprendizaje, no para certificar la potabilidad del agua: los valores son ilustrativos y el agua es **NO POTABLE** sin análisis de laboratorio conforme al [RTS 13.02.01:14](docs/propuestas.md).

El modelo recalcula el estado desde la entrada en cada posición del timeline. Las métricas y el índice de calidad son valores ilustrativos definidos por cada escenario.

**Stack:** HTML, CSS, JavaScript moderno, [Vite](https://vite.dev/) y [Three.js](https://threejs.org/).

<!-- section:requirements -->
## 📋 Requisitos

- Node.js 18 o superior
- npm

<!-- section:installation -->
## ⬇️ Instalación

```bash
npm install
```

<!-- section:usage -->
## 🚀 Uso

Inicia el servidor local:

```bash
npm run dev
```

Abre la dirección indicada por Vite, normalmente `http://localhost:5173`. Cambia entre balde-barril y captación de lluvia, explora el recorrido y usa las herramientas de uso final, cálculo, presupuesto, mantenimiento, muestreo y seguridad.

<!-- section:structure -->
## 🗂️ Estructura del proyecto

```text
.
├── index.html                 # Estructura principal de la aplicación
├── src/
│   ├── main.js                 # Arranque y selección del escenario
│   ├── scenarios/
│   │   ├── <id>/                # id, name, buildScene, layers y metrics
│   │   └── registry.js          # Registro de escenarios disponibles
│   ├── core/                    # Escena, métricas, timeline, capas y UI compartidas
│   │   └── tools/               # Herramientas compartidas de uso, cálculo, presupuesto,
│   │                             # mantenimiento, muestreo y seguridad
│   └── style.css               # Estilos, paneles y diseño responsive
├── docs/
│   ├── estandares-aplicados.md # Documentación de estándares aplicados
│   └── propuestas.md           # Propuestas y contexto técnico
├── dist/                       # Salida generada por Vite
├── package.json                # Scripts y dependencias
└── README.md                   # Documentación inicial del proyecto
```

Cada escenario vive en `src/scenarios/<id>/` y expone `id`, `name`, `buildScene`, sus `layers` (etapas) y `metrics`. El registro central está en `src/scenarios/registry.js`. Actualmente están disponibles `balde-barril` (Balde y barril de capas) y `captacion-lluvia` (Sistema de captación de lluvia, con 8 pasos). La lógica reutilizable está en `src/core`; sus herramientas compartidas incluyen uso final, calculadora, presupuesto, mantenimiento, muestreo y seguridad.

Para agregar un escenario nuevo, crea `src/scenarios/<id>/` con su definición, `layers`, métricas y constructor de escena; después impórtalo y añádelo al arreglo de `src/scenarios/registry.js`.

<!-- section:data -->
## 🧾 Datos

Los datos de entrada y las reducciones por etapa están declarados en los módulos de cada escenario:

- Turbidez, color, olor, E. coli y coliformes: índices ilustrativos.
- pH y conductividad: valores ilustrativos con sus unidades correspondientes.
- Índice de calidad: escala didáctica de 0 a 100; un valor mayor representa una mejor calidad estimada.
- Duración de cada etapa: segundos simulados usados para distribuir correctamente el timeline.

Todos los valores son ilustrativos. La filtración no lleva E. coli ni coliformes a niveles seguros; el agua debe tratarse como **NO POTABLE** hasta contar con resultados de laboratorio que verifiquen el cumplimiento del RTS 13.02.01:14. Para el contexto, alcance y propuestas del simulador, consulta [docs/propuestas.md](docs/propuestas.md).

<!-- section:development -->
## 🛠️ Desarrollo

```bash
npm run build
```

Los archivos generados se guardan en `dist/`. Para probar esa compilación localmente:

```bash
npm run preview
```

<!-- section:contributing -->
## 💭 Soporte y contribuciones

Para reportar un problema o proponer una mejora, documenta el comportamiento observado, los pasos para reproducirlo y el tamaño de pantalla utilizado.

<!-- section:license -->
## 📄 Licencia

TODO(readme): definir y agregar el archivo de licencia del proyecto.
