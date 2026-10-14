# Mapa actual del refactor BEM

## Estructura

El proyecto es STATIC/SIMPLE: Vite + JavaScript vanilla, HTML estático y una sola hoja global,
src/style.css. La hoja usa @layer reset, tokens, base, layout, components, utilities y está
organizada por secciones funcionales dentro del mismo archivo. No se dividió en varios CSS para
conservar el orden de cascada que da paridad visual al simulador.

## Tokens y variables locales

Los tokens globales viven en :root: colores primitivos y semánticos (--color-*), tipografía,
pesos, alturas de línea, radios, bordes, sombras, focus, transiciones, z-index y layout. El
espaciado nuevo incluye --space-xs, --space-sm, --space-md, --space-lg, --space-xl, --space-2xl,
--space-4, --space-8, --space-12, --space-16 y --section-gap.

Los bloques declaran variables locales para sus variantes: .layers-card (--card-heading-size,
--card-description-margin-block), .journey__step (--journey-index-*), el interruptor de capas
(--track-*), controles (--quality-control-*) y navegación de etapas (--stage-navigation-*).
Las variables permiten que los breakpoints y modificadores cambien valores sin duplicar estilos.

## Mapa de clases antiguas -> clases actuales

Las clases no listadas se conservaron porque ya son nombres BEM válidos o son bloques públicos
usados por HTML/JS. En esos casos se indica explícitamente que no hubo renombrado.

### Brand

| Antes | Actual | Uso |
| --- | --- | --- |
| .brand > span:last-child | .brand__name | Nombre de marca |
| .brand > span:last-child span | .brand__name-accent | Acento Lab |
| .brand__mark span | .brand__mark-bar | Barra del isotipo |
| .brand__mark-bar.short/mid/tall | .brand__mark-bar--short/mid/tall | Variantes de altura |

### Intro y journey

| Antes | Actual |
| --- | --- |
| .intro h1 | .intro__title |
| .intro h1 em | .intro__title-em |
| .intro-tags / .intro-tags span | .intro__tags / .intro__tag |
| .intro-note | .intro__note |
| .intro-note-line | .intro__note-line |
| .intro-note strong | .intro__note-title |
| .intro-note p | .intro__note-text |
| .journey-list | .journey__list |
| .journey-step | .journey__step |
| .journey-step span | .journey__index |
| .journey-step b | .journey__label |
| .journey-step.current | .journey__step.is-current |

### Scene

| Antes | Actual |
| --- | --- |
| #sceneCanvas como selector visual | .scene-canvas (el id queda como hook JS) |
| .scene-label.inlet/output | .scene-label--inlet/output |
| .scene-label span | .scene-label__dot |
| .scene-legend div | .scene-legend__item |
| .legend-swatch.dirty/clean | .scene-legend__swatch--dirty/clean |
| .scene-footer b/small | .scene-footer__value / .scene-footer__hint |
| .tool-button.active | .tool-button.is-active |

Los bloques públicos .scene-card, .scene-viewport, .scene-footer y .scene-footer-item se
mantienen por compatibilidad. .scene-card también es el dueño de variables de timeline y control
row en los breakpoints compactos.

### Inspector, quality y metrics

| Antes | Actual |
| --- | --- |
| .quality-badge.medium/good/low | .quality-badge--medium/good/low |
| .inspector h2 | .inspector__title |
| .quality-ring > div | .quality-ring__body |
| .quality-ring strong/span | .quality-ring__score / .quality-ring__label |
| .quality-copy > span/b/small | .quality-copy__eyebrow / __title / __hint |
| .metric y descendientes | .metric, .metric__label, .metric__value, .metric__unit, .metric__bar, .metric__fill |
| .comparison.after | .comparison--after |
| .comparison strong/small | .comparison__value / .comparison__hint |
| .selection-tip span | .selection-tip__icon |

Se mantienen como bloques públicos .inspector, .quality-overview, .quality-ring, .quality-copy,
.metrics-grid, .metric, .before-after y .comparison.

### Layers

| Antes | Actual |
| --- | --- |
| .layers-card | .layers-card (sin renombrado; bloque público) |
| .floating-layers-panel | .layers-card.floating-layers-panel (mix de layout) |
| .layer-row.selected/disabled | .layer-row.is-selected/is-disabled |
| .layer-row span.swatch | .layer-row__swatch--gravel/sand/carbon/membrane |
| .layer-main b/small | .layer-row__title / .layer-row__meta |
| .layer-toggle y input | .layer-row__toggle, .layer-row__input, .layer-row__track |
| .educational-note span/p/b | .educational-note__icon / __text / __title |

### Timeline y stage navigation

| Antes | Actual |
| --- | --- |
| .timeline-title h2 | .timeline-title__heading |
| .timeline-times span | .timeline-times__current / .timeline-times__total |
| .timeline-marker.active | .timeline-marker.is-active |
| .speed-options button.active | .speed-options__button.is-active |
| .stage-navigation .secondary-button | .stage-navigation__button |
| .stage-summary strong/span | .stage-summary__title / .stage-summary__text |
| .stage-navigation | .stage-navigation (bloque público conservado) |

### Evolution, advanced y presets

| Antes | Actual |
| --- | --- |
| .chart-column.current | .chart-column--current |
| .chart-bar.before/after | .chart-bar--before/after |
| .chart-legend span | .chart-legend__item |
| .chart-unit | .chart-legend__unit |
| .advanced-panel summary | .advanced-panel__summary |
| .advanced-panel summary small | .advanced-panel__summary-note |
| .advanced-panel .content | .advanced-panel__content |
| .preset-heading small | .preset-heading__hint |
| .preset-card .top/details/title/button | .preset-card__top/__details/__title/__button |

.evolution-card, .evolution-chart, .advanced-panel, .preset-list y .preset-card se mantienen
como bloques públicos actuales.

### Scenario, tools y tablas-tarjeta

| Antes | Actual |
| --- | --- |
| .scenario-picker select | .scenario-picker__select |
| .scenario-controls label/input/select | .scenario-controls__field, __input, __select |
| .scenario-controls .warning | .scenario-controls__warning |
| .tool-panel / .tools-section-panel | mismos bloques públicos, con elementos __* |
| .risk-table tr, .schedule-table tr | .risk-row, .schedule-row |
| .budget-table tr, .agronomy-table tr | .budget-row, .agronomy-row |
| celdas de tabla por etiqueta | *-row__cell con data-label |
| .agronomy-row p/small | .agronomy-row__text / .agronomy-row__meta |

El bloque responsive final convierte las tablas en tarjetas para max-width: 60.99rem; conserva los
nombres *-row y sus elementos para no romper datos ni hooks existentes.

### Tour, help y footer

| Antes | Actual |
| --- | --- |
| .tour-card h2/p | .tour-card__title / .tour-card__text |
| .tour-backdrop | .tour-backdrop (bloque público) |
| .help-modal h2/p/b | .help-modal__title / .help-modal__text / .help-modal__strong |
| .footer span | .footer__meta |
| .modal-close | .modal-close (bloque público compartido) |

### Mobile sheet

| Antes | Actual |
| --- | --- |
| .mobile-sheet | .mobile-sheet |
| handle interno | .mobile-sheet__handle, .mobile-sheet__grab |
| resumen interno | .mobile-sheet__summary, __summary-title, __summary-text, __summary-value |
| tabs y tab activo | .mobile-sheet__tabs, .mobile-sheet__tab.is-active |
| body | .mobile-sheet__body |
| panel oculto/visible | .is-sheet-hidden / .is-sheet-visible |

El sheet se activa desde JS en max-width: 600px (37.5rem) y conserva sus estados
.is-sheet-hidden/.is-sheet-visible. No se modificó ese comportamiento.

## Grid responsive actual

- Base y ≤600px: el flujo original y el mobile sheet permanecen sin cambios.
- 601–1023px (37.5625rem–63.99rem): .simulation-layout es de una columna; .scene-card fila 1,
  .inspector fila 2 y .layers-card.floating-layers-panel fila 3.
- ≥1024px (64rem): se conserva el layout desktop: escena e inspector en fila 1 y layers a ancho
  completo en fila 2. 75rem solo ajusta proporciones y densidad.
- El límite compartido de reglas estrechas es max-width: 60.99rem, frente a las reglas de
  compactación de min-width: 61rem; así no queda un hueco práctico entre 961 y 975 px.
- Breakpoints usados: 600px para el sheet JS/CSS, 40rem, 60.99rem, 61rem, 64rem y 75rem. Las
  reglas de colocación tablet se declaran también con el rango exacto de 601–1023 px.
- .evolution-card no usa colocación explícita en .simulation-layout: vive en .lower-grid, que
  sigue siendo un flujo independiente de una columna.

## Helpers JS y decisiones de cascada

Los helpers compartidos están en src/core/ui-helpers.js: estados is-*, cambio de clases,
atributos y utilidades de interacción se centralizan allí. Los hooks JS usan id/js-* cuando
corresponde y no son dueños visuales del CSS.

Los bloques de ajustes UX, navegación, sheet y tablas se movieron al final de src/style.css para
ganar a los estilos base y a las reglas históricas por breakpoint. Los duplicados que quedan son
intencionales overrides de cascada; no se reordenan sin verificar el renderizado.

## Auditoría

La auditoría actual queda en 0 errores. En la ejecución sobre src/style.css con el auditor incluido
por la skill se reportan 35 avisos, todos duplicate-selector, producidos por los overrides
responsive intencionales. El conteo aproximado de la auditoría histórica completa es de ~350 avisos,
principalmente tipos duplicate-selector, tag-selector, deep-selector, attribute-substitute,
outline-none y hooks JS estilizados; no hay errores bloqueantes.

Este cambio no hace commit.
