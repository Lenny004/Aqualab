const POINTS = ['Agua captada', 'Después del filtro', 'Después de la desinfección'];
const PARAMETERS = [
  ['Turbidez', 'UTN'], ['Color', 'índice'], ['Olor', 'índice'], ['pH', 'pH'], ['Conductividad', 'µS/cm'], ['E. coli', 'laboratorio'], ['Coliformes', 'laboratorio'],
];

export function renderSampling(container, { metrics = [], getValue }) {
  const metricMap = new Map(metrics.map((metric) => [metric.label, metric.key]));
  container.innerHTML = `<p class="tool-note">Criterio RTS 13.02.01:14: pendiente de laboratorio. No se inventan límites.</p><div class="sampling-grid">${POINTS.map((point, pointIndex) => `<section class="sampling-card"><h3>${point}</h3>${PARAMETERS.map(([label, unit]) => { const key = metricMap.get(label); const value = pointIndex === 0 && key ? getValue(key) : '—'; return `<div class="sampling-row"><span>${label}</span><span>${value}${value !== '—' ? ` ${unit}` : ''}</span><small>pendiente de laboratorio</small></div>`; }).join('')}</section>`).join('')}</div>`;
}
