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
    fitMargin: 1.16,
  },
  samplingStages: { filter: 'carbon', disinfection: null },
  text: {
    description: 'Ilustración conceptual: orden, espesor y granulometría provienen de un diseño hidráulico.',
    inputDescription: 'El agua contiene partículas, color, olor y microorganismos antes de atravesar el sistema.',
    disabledDescription: 'Esta capa está desactivada. Actívala para incluirla en el recorrido.',
    help: 'Usa Reproducir para seguir el agua por la grava, la arena, el carbón activado y la etapa avanzada opcional. Puedes seleccionar una capa o el balde y activar Radiografía para inspeccionar su interior.',
  },
  onUsageChange: (usage, { scene }) => scene.setUsage?.(usage),
  applyPreset: (presetId, { layers, setFinalUse }) => {
    const layerIds = {
      'method-a': ['gravel', 'sand', 'carbon'],
      'method-b': ['gravel', 'sand'],
      'method-c': ['gravel', 'sand', 'carbon'],
    }[presetId] || [];
    layers.forEach((layer) => { layer.enabled = layerIds.includes(layer.id); });
    setFinalUse(presetId === 'method-b' ? 'cultivar' : 'tomar');
    return { message: 'En balde-barril se aplicaron las capas disponibles; el escenario 2 representa mejor los métodos de cultivo de la fuente.' };
  },
  buildScene: (context) => new PurificationScene({ ...context, createObjects: createBaldeBarrilObjects }),
};
