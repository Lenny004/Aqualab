import { getEnabledLayers } from './layers.js';

export const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
export const lerp = (a, b, t) => a + (b - a) * t;

export function qualityAfter(quality, layer, initial, effects = {}) {
  const saturationFactor = layer.saturation === undefined
    ? (layer.id === 'filtro-granular' ? 1 - (effects.carbon || 0) * 0.7 : 1)
    : 1 - layer.saturation * 0.7;

  return Object.fromEntries(
    Object.keys(initial).map((key) => {
      const reduction = (layer.reductions[key] || 0) * saturationFactor;
      let value = key === 'ph'
        ? quality[key] + (7 - quality[key]) * reduction
        : quality[key] * (1 - reduction);

      if (effects.biofilm && ['deposito-crudo', 'deposito-limpio', 'carbon'].includes(layer.id) && ['ecoli', 'coliforms'].includes(key)) {
        value += initial[key] * 0.2 * effects.biofilm;
      }

      return [key, value];
    }),
  );
}

export function qualityScore(quality, initial) {
  const normalized = (1 - quality.turbidity / initial.turbidity) * 0.22
    + (1 - quality.color / initial.color) * 0.15
    + (1 - quality.odor / initial.odor) * 0.12
    + (1 - Math.abs(quality.ph - 7) / 7) * 0.1
    + (1 - quality.conductivity / initial.conductivity) * 0.12
    + (1 - quality.ecoli / 100) * 0.15
    + (1 - quality.coliforms / 100) * 0.14;

  return Math.round(clamp(normalized) * 100);
}

const slowFilterIds = new Set(['filtro-granular', 'gravel', 'sand', 'carbon']);

export function createSimulationModel(config) {
  const { initial, layers, deterioration = {} } = config;
  const effects = deterioration.effects || {};
  const filters = getEnabledLayers(layers);
  const clogging = effects.clogging || 0;
  const durations = filters.map((filter) => filter.duration * (slowFilterIds.has(filter.id) ? 1 + 0.25 * clogging : 1));
  const stages = [{ filter: null, quality: { ...initial }, label: 'Entrada' }];

  filters.forEach((filter) => {
    stages.push({
      filter,
      quality: qualityAfter(stages.at(-1).quality, filter, initial, effects),
      label: filter.name,
    });
  });

  const totalDuration = durations.reduce((sum, duration) => sum + duration, 0);
  const stageStarts = [0];
  let elapsed = 0;

  durations.forEach((duration) => {
    elapsed += duration;
    stageStarts.push(totalDuration ? elapsed / totalDuration : 0);
  });

  return {
    initial,
    filters,
    stages,
    durations,
    stageStarts,
    totalDuration,
    metricKeys: Object.keys(initial),
    current: {},
    view: {},
  };
}

export function sampleSimulation(model, progress) {
  const { initial, filters, stages, durations, stageStarts, totalDuration, metricKeys, current, view } = model;

  if (!filters.length || !totalDuration) {
    Object.assign(view, {
      filters,
      stages,
      current: initial,
      currentIndex: 0,
      local: 0,
      totalDuration,
      stageStarts,
    });
    return view;
  }

  const clamped = clamp(progress);
  const elapsed = clamped * totalDuration;
  let accumulated = 0;
  let index = filters.length - 1;
  let local = 1;

  if (clamped < 1) {
    for (let candidate = 0; candidate < filters.length; candidate += 1) {
      const duration = durations[candidate];
      if (elapsed < accumulated + duration) {
        index = candidate;
        break;
      }
      accumulated += duration;
    }
    local = (elapsed - accumulated) / durations[index];
  }

  const from = stages[index].quality;
  const to = stages[index + 1].quality;
  for (let keyIndex = 0; keyIndex < metricKeys.length; keyIndex += 1) {
    const key = metricKeys[keyIndex];
    current[key] = lerp(from[key], to[key], local);
  }

  Object.assign(view, {
    filters,
    stages,
    current,
    currentIndex: index + 1,
    local,
    totalDuration,
    stageStarts,
  });
  return view;
}

export function computeSimulation(progress = 0, config) {
  return sampleSimulation(createSimulationModel(config), progress);
}

export const formatNumber = (value) => new Intl.NumberFormat('es-SV', {
  maximumFractionDigits: 1,
}).format(value);
