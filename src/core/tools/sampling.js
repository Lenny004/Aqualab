const POINTS = ['Agua captada', 'Después del filtro', 'Después de la desinfección'];

export function renderSampling(container, { metrics = [], stages = [], initial, samplingStages = {}, usage = {} }) {
  const qualityAt = (pointIndex) => {
    if (pointIndex === 0) return initial;
    let id = pointIndex === 1 ? samplingStages.filter : samplingStages.disinfection;
    if (pointIndex === 1 && !stages.some((stage) => stage.filter?.id === id)) id = [...stages].reverse().find((stage) => ['carbon', 'sand', 'gravel'].includes(stage.filter?.id))?.filter?.id;
    return id ? stages.find((stage) => stage.filter?.id === id)?.quality || null : null;
  };
  container.innerHTML = `<p class="tool-note">Criterio RTS 13.02.01:14: pendiente de laboratorio. Todos los valores son ilustrativos.</p><div class="sampling-grid">${POINTS.map((point, pointIndex) => `<section class="sampling-card"><h3>${point}</h3>${metrics.map((metric) => { const value = qualityAt(pointIndex)?.[metric.key]; const unavailable = value === undefined || value === null; const display = unavailable && pointIndex === 2 ? '? (sin etapa de desinfección)' : unavailable ? '?' : `${format(value)} ${metric.unit || ''}`; const relevant = usage.metricKeys?.includes(metric.key); const highlighted = usage.highlighted?.includes(metric.key); return `<div class="sampling-row ${relevant ? 'is-relevant' : 'is-muted'} ${highlighted ? 'is-highlighted' : ''}"><span>${metric.label}</span><span>${display}</span><small>${unavailable && pointIndex === 2 ? 'Sin etapa de desinfección' : 'ilustrativo · pendiente de laboratorio'}</small></div>`; }).join('')}</section>`).join('')}</div>`;
}

function format(value) { return Number.isInteger(value) ? value : value.toFixed(1); }
