# Mapa del refactor BEM

## Estructura

Se conserva la estructura STATIC/SIMPLE existente: Vite + vanilla JS y una única hoja global en
`src/style.css`. No se dividió el CSS en archivos porque la prioridad de esta iteración es paridad
visual y el usuario pidió mantener el archivo único.

## Cambios aplicados

| Antes | Después | Uso |
| --- | --- | --- |
| `.brand > span:last-child span` | `.brand__name-accent` | Acento `Lab` del logotipo |
| `.brand__mark span` | `.brand__mark-bar` | Barras del isotipo |
| `.intro__tags span` | `.intro__tag` | Etiquetas del encabezado |
| `#sceneCanvas` fuera de media | `.scene-canvas` | Canvas de la escena; el `id` queda solo como hook JS y en media preservadas |
| `.quality-badge.medium` | `.quality-badge.quality-badge--medium` | Estado medio |
| `.quality-badge.good` | `.quality-badge.quality-badge--good` | Estado bueno |
| `.quality-badge.low` | `.quality-badge.quality-badge--low` | Estado bajo |
| `.chart-column.current` | `.chart-column.chart-column--current` | Columna actual |
| `.chart-bar.before` | `.chart-bar.chart-bar--before` | Serie anterior |
| `.chart-bar.after` | `.chart-bar.chart-bar--after` | Serie posterior |

## Tokens

Se amplió `:root` con aliases semánticos para tipografía, pesos, alturas de línea, espaciado,
bordes, focus, sombras, transiciones, z-index, layout, estados y colores repetidos. Los valores
visuales existentes se conservaron; los componentes usan los aliases semánticos donde se tocaron.

## Avisos residuales

- Se conservaron literalmente todas las reglas `@media`, incluyendo las de `(max-width: 40rem)`,
  `(max-width: 24rem)` y el bloque completo `.mobile-sheet*`; por ello permanecen algunos
  selectores descendientes, `#sceneCanvas` y colores directos dentro de esos bloques.
- La auditoría todavía reporta especificidad histórica en selectores de componentes antiguos
  como `.intro h1`, `.card-heading h2`, `.scene-card .controls-section` y tablas responsivas.
  Renombrarlos en masa exigiría tocar muchos templates dinámicos y no es seguro para esta iteración.
- No se renombraron bloques públicos ampliamente usados: `.scene-card`, `.inspector`,
  `.layers-card`, `.mobile-sheet*`, `.journey*`, `.quality-badge`, `.tools-panel` y bloques de
  herramientas.
- No se hizo commit.
