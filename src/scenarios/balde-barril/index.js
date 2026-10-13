import { INITIAL, LAYERS, METRICS } from './layers.js';
import { createBaldeBarrilObjects } from './scene.js';
import { PurificationScene } from '../../core/scene.js';

export default {
  id: 'balde-barril',
  name: 'Balde y barril de capas',
  initial: INITIAL,
  layers: LAYERS,
  metrics: METRICS,
  camera: {
    position: [7, 6, 11],
    target: [0.8, 3.4, 0],
    minDistance: 6,
    maxDistance: 24,
  },
  samplingStages: { filter: 'carbon', disinfection: null },
  text: {
    description: 'Ilustración conceptual: orden, espesor y granulometría provienen de un diseño hidráulico.',
    inputDescription: 'El agua contiene partículas, color, olor y microorganismos antes de atravesar el sistema.',
    disabledDescription: 'Esta capa está desactivada. Actívala para incluirla en el recorrido.',
    help: 'Usa Reproducir para seguir el agua por la grava, la arena, el carbón activado y la etapa avanzada opcional. Puedes seleccionar una capa o el balde y activar Radiografía para inspeccionar su interior.',
  },
  onUsageChange: (usage, { scene }) => scene.setUsage?.(usage),
  buildScene: (context) => new PurificationScene({ ...context, createObjects: createBaldeBarrilObjects }),
};
