import { getEnabledLayers } from './layers.js';

export const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
export const lerp = (a, b, t) => a + (b - a) * t;

export function qualityAfter(quality, layer, initial) {
  const saturationFactor = layer.saturation === undefined
    ? 1
    : 1 - layer.saturation * 0.7;

  return Object.fromEntries(
    Object.keys(initial).map((key) => {
      const reduction = (layer.reductions[key] || 0) * saturationFactor;
      const value = key === 'ph'
        ? quality[key] + (7 - quality[key]) * reduction
        : quality[key] * (1 - reduction);

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
  const { initial, layers } = config;
  const filters = getEnabledLayers(layers);
  const stages = [{ filter: null, quality: { ...initial }, label: 'Entrada' }];

  filters.forEach((filter) => {
    stages.push({
      filter,
      quality: qualityAfter(stages.at(-1).quality, filter, initial),
      label: filter.name,
    });
  });

  const totalDuration = filters.reduce((sum, filter) => sum + filter.duration, 0);

  if (!filters.length || !totalDuration) {
    return {
      filters,
      stages,
      current: { ...initial },
      currentIndex: 0,
      local: 0,
      totalDuration,
    };
  }

  const elapsed = clamp(progress) * totalDuration;
  let accumulated = 0;
  let index = filters.length - 1;
  let local = 1;

  if (progress < 1) {
    for (let candidate = 0; candidate < filters.length; candidate += 1) {
      if (elapsed < accumulated + filters[candidate].duration) {
        index = candidate;
        break;
      }

      accumulated += filters[candidate].duration;
    }

    local = (elapsed - accumulated) / filters[index].duration;
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
  };
}

export const formatNumber = (value) => new Intl.NumberFormat('es-SV', {
  maximumFractionDigits: 1,
}).format(value);
