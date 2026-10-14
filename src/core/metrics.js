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

export function computeSimulation(progress = 0, config) {
  const { initial, layers, deterioration = {} } = config;
  const effects = deterioration.effects || {};
  const filters = getEnabledLayers(layers);
  const durationFor = (filter) => filter.duration * (filter.id === 'filtro-granular' || ['gravel', 'sand', 'carbon'].includes(filter.id) ? 1 + 0.25 * (effects.clogging || 0) : 1);
  const stages = [{ filter: null, quality: { ...initial }, label: 'Entrada' }];

  filters.forEach((filter) => {
    stages.push({
      filter,
      quality: qualityAfter(stages.at(-1).quality, filter, initial, effects),
      label: filter.name,
    });
  });

  const totalDuration = filters.reduce((sum, filter) => sum + durationFor(filter), 0);
  const stageStarts = [0];
  filters.forEach((filter, index) => {
    const elapsedBefore = filters.slice(0, index + 1).reduce((sum, item) => sum + durationFor(item), 0);
    stageStarts.push(totalDuration ? elapsedBefore / totalDuration : 0);
  });

  if (!filters.length || !totalDuration) {
    return {
      filters,
      stages,
      current: { ...initial },
      currentIndex: 0,
      local: 0,
      totalDuration,
      stageStarts,
    };
  }

  const elapsed = clamp(progress) * totalDuration;
  let accumulated = 0;
  let index = filters.length - 1;
  let local = 1;

  if (progress < 1) {
    for (let candidate = 0; candidate < filters.length; candidate += 1) {
      if (elapsed < accumulated + durationFor(filters[candidate])) {
        index = candidate;
        break;
      }

      accumulated += durationFor(filters[candidate]);
    }

    local = (elapsed - accumulated) / durationFor(filters[index]);
  }

  const current = Object.fromEntries(
    Object.keys(initial).map((key) => [
      key,
      lerp(stages[index].quality[key], stages[index + 1].quality[key], local),
    ]),
  );

  return {
    filters,
    stages,
    current,
    currentIndex: index + 1,
    local,
    totalDuration,
    stageStarts,
  };
}

export const formatNumber = (value) => new Intl.NumberFormat('es-SV', {
  maximumFractionDigits: 1,
}).format(value);
