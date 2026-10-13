import { INITIAL, LAYERS, METRICS } from './layers.js';
import { createBaldeBarrilObjects } from './scene.js';
import { PurificationScene } from '../../core/scene.js';

export default {
  id: 'balde-barril',
  name: 'Balde y barril de capas',
  initial: INITIAL,
  layers: LAYERS,
  metrics: METRICS,
  text: {
    description: 'Ilustración conceptual: orden, espesor y granulometría provienen de un diseño hidráulico.',
    inputDescription: 'El agua contiene partículas, color, olor y microorganismos antes de atravesar el sistema.',
    disabledDescription: 'Esta capa está desactivada. Actívala para incluirla en el recorrido.',
  },
  onUsageChange: (usage, { scene }) => scene.setUsage?.(usage),
  buildScene: (context) => new PurificationScene({ ...context, createObjects: createBaldeBarrilObjects }),
};
