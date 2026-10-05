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

- **Escena 3D exploratoria**: rota, acerca, aleja, centra y fija la vista del sistema de filtración.
- **Recorrido temporal**: reproduce, pausa y explora el proceso con una línea de tiempo ponderada por la duración de cada etapa.
- **Capas configurables**: activa o desactiva grava, arena, carbón activado y membrana fina desde el panel flotante.
- **Lectura por etapa**: compara el índice de calidad antes y después de cada capa.
- **Visualización educativa**: consulta métricas, radiografía del filtro y gráfica de evolución.

<!-- section:overview -->
## ℹ️ Descripción

AquaLab ayuda a explicar cómo distintas capas pueden reducir turbidez, cloro, minerales y microorganismos en un recorrido visual. Está pensado para demostraciones y aprendizaje, no para certificar la potabilidad del agua.

El modelo recalcula el estado desde la entrada en cada posición del timeline. Las métricas y el índice de calidad son valores ilustrativos parametrizados en `src/main.js`.

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

Abre la dirección indicada por Vite, normalmente `http://localhost:5173`. La aplicación mostrará el filtro 3D, el panel de capas y los controles del recorrido.

<!-- section:structure -->
## 🗂️ Estructura del proyecto

```text
.
├── index.html                 # Estructura principal de la aplicación
├── src/
│   ├── main.js                 # Estado, cálculo de calidad y escena 3D
│   └── style.css               # Estilos, paneles y diseño responsive
├── docs/
│   └── estandares-aplicados.md # Documentación de estándares aplicados
├── dist/                       # Salida generada por Vite
├── package.json                # Scripts y dependencias
└── README.md                   # Documentación inicial del proyecto
```

<!-- section:data -->
## 🧾 Datos

Los datos de entrada y las reducciones por etapa están declarados en `src/main.js`:

- Turbidez, cloro y microorganismos: índices porcentuales ilustrativos.
- Minerales: concentración ilustrativa en `mg/L`.
- Índice de calidad: escala didáctica de 0 a 100; un valor mayor representa una mejor calidad estimada.
- Duración de cada etapa: segundos simulados usados para distribuir correctamente el timeline.

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
