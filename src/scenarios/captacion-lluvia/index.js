import { INITIAL, LAYERS, METRICS } from './layers.js';
import { createCaptacionLluviaObjects } from './scene.js';
import { PurificationScene } from '../../core/scene.js';

export default {
  id: 'captacion-lluvia',
  name: 'Sistema de captación de lluvia (8 pasos)',
  initial: INITIAL,
  layers: LAYERS,
  metrics: METRICS,
  camera: {
    position: [12, 8, 18],
    target: [1.5, 3.1, 0],
    minDistance: 10,
    maxDistance: 48,
  },
  samplingStages: { filter: 'filtro-granular', disinfection: 'disinfection' },
  controls: [
    {
      key: 'roofType',
      type: 'select',
      label: 'Tipo de techo',
      value: 'compatible',
      options: [
        { value: 'compatible', label: 'Compatible (limpio, material apto)' },
        { value: 'coated', label: 'Con pinturas/recubrimientos' },
        { value: 'metals', label: 'Con plomo/metales' },
        { value: 'asbestos', label: 'Con asbesto/amianto' },
      ],
      help: 'Si no es compatible, queda excluido para agua de beber.',
    },
    {
      key: 'firstFlushVolume',
      type: 'number',
      label: 'Desviador de primeras aguas (L)',
      value: 25,
      min: 1,
      max: 200,
      step: 1,
      help: 'Volumen ilustrativo y editable; incluye drenaje.',
    },
    {
      key: 'disinfection',
      type: 'select',
      label: 'Desinfección validada',
      value: 'chlorination',
      options: [
        { value: 'chlorination', label: 'Cloración controlada' },
        { value: 'thermal', label: 'Tratamiento térmico' },
      ],
      help: 'Validar el proceso antes de liberar el agua.',
    },
  ],
  text: {
    description: 'Del techo al muestreo (ilustrativo, no es plano constructivo).',
    inputDescription: 'Lluvia desde el techo; requiere superficie compatible.',
    disabledDescription: 'Etapa desactivada.',
    help: 'Reproduce el recorrido, salta entre etapas y usa Radiografía.',
  },
  deteriorationMap: {
    carbon: ['filtro-granular'],
    clogging: ['filtro-granular', 'sedimentacion'],
    biofilm: ['deposito-crudo', 'deposito-limpio'],
    mosquitoes: ['primeras-aguas', 'deposito-crudo'],
  },
  onControlChange: (key, value, { layers, scene }) => {
    if (key === 'roofType') scene.setControl?.(key, value);
    if (key !== 'disinfection') return;
    const disinfection = layers.find((layer) => layer.id === 'disinfection');
    if (!disinfection) return;
    disinfection.short = value === 'thermal' ? 'Tratamiento térmico validado' : 'Cloración controlada validada';
    disinfection.description = value === 'thermal'
      ? 'Tratamiento térmico validado. La ebullición se muestra solo como emergencia y no elimina químicos.'
      : 'Cloración controlada validada. Mostrar tiempo de contacto y medir cloro residual libre.';
  },
  onUsageChange: (usage, { scene }) => scene.setUsage?.(usage),
  applyPreset: (presetId, { layers, setFinalUse }) => {
    const layerIds = {
      'method-a': ['captacion', 'malla', 'primeras-aguas', 'deposito-crudo', 'sedimentacion', 'filtro-granular', 'disinfection', 'deposito-limpio', 'control'],
      'method-b': ['captacion', 'malla', 'primeras-aguas', 'sedimentacion', 'filtro-granular', 'deposito-limpio', 'control'],
      'method-c': ['captacion', 'malla', 'primeras-aguas', 'deposito-crudo', 'sedimentacion', 'filtro-granular', 'disinfection', 'deposito-limpio', 'control'],
    }[presetId] || [];
    layers.forEach((layer) => { layer.enabled = layerIds.includes(layer.id); });
    setFinalUse(presetId === 'method-b' ? 'cultivar' : 'tomar');
    return { message: presetId === 'method-c' ? 'Diseño 3 aplicado: sistema comunitario con vigilancia y responsable operativo.' : 'Preset aplicado: revisa la secuencia y valida el diseño para el uso elegido.' };
  },
  buildScene: (context) => new PurificationScene({ ...context, createObjects: createCaptacionLluviaObjects }),
};
