const POINTS = ['Agua captada', 'Después del filtro', 'Después de la desinfección'];

const DASH = '\u2014';

export function renderSampling(container, { metrics = [], stages = [], initial, samplingStages = {}, usage = {} }) {
  const rows = [];
  const note = document.createElement('p');
  note.className = 'tool-note';
  note.textContent = 'Criterio RTS 13.02.01:14: pendiente de laboratorio. Todos los valores son ilustrativos.';
  const grid = document.createElement('div');
  grid.className = 'sampling-grid';
  POINTS.forEach((point, pointIndex) => {
    const card = document.createElement('section');
    card.className = 'sampling-card';
    const heading = document.createElement('h3');
    heading.className = 'sampling-card__title';
    heading.textContent = point;
    card.append(heading);
    metrics.forEach((metric) => {
      const row = document.createElement('div');
      row.className = 'sampling-row';
      const label = document.createElement('span');
      label.textContent = metric.label;
      const value = document.createElement('span');
      const detail = document.createElement('small');
      detail.className = 'sampling-row__hint';
      row.append(label, value, detail);
      rows.push({ pointIndex, metric, row, value, detail });
      card.append(row);
    });
    grid.append(card);
  });
  container.replaceChildren(note, grid);
  const update = ({ stages: nextStages = stages, usage: nextUsage = usage } = {}) => {
    rows.forEach((row) => {
      const value = row.pointIndex === 0 ? initial : (() => {
        let id = row.pointIndex === 1 ? samplingStages.filter : samplingStages.disinfection;
        if (row.pointIndex === 1 && !nextStages.some((stage) => stage.filter?.id === id)) id = [...nextStages].reverse().find((stage) => ['carbon', 'sand', 'gravel'].includes(stage.filter?.id))?.filter?.id;
        return id ? nextStages.find((stage) => stage.filter?.id === id)?.quality || null : null;
      })()?.[row.metric.key];
      const unavailable = value === undefined || value === null;
      row.value.textContent = unavailable && row.pointIndex === 2 ? `${DASH} (sin etapa de desinfección)` : unavailable ? DASH : `${format(value)} ${row.metric.unit || ''}`;
      row.detail.textContent = unavailable && row.pointIndex === 2 ? 'Sin etapa de desinfección' : 'ilustrativo · pendiente de laboratorio';
      const relevant = nextUsage.metricKeys?.includes(row.metric.key);
      row.row.classList.toggle('is-relevant', relevant);
      row.row.classList.toggle('is-muted', !relevant);
      row.row.classList.toggle('is-highlighted', nextUsage.highlighted?.includes(row.metric.key));
    });
  };
  update();
  return update;
}

function format(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? (Number.isInteger(numericValue) ? numericValue : numericValue.toFixed(1)) : DASH;
}
