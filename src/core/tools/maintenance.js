const TASKS = {
  'Después de cada lluvia': ['Mallas', 'Desviador', 'Rebose'],
  Semanal: ['Tapa', 'Grifo', 'Insectos'],
  Mensual: ['Tuberías', 'Base', 'Caudal', 'Turbidez', 'Purga del sedimentador'],
  'Según desempeño': ['Medios filtrantes', 'Cambio de carbón'],
  Anual: ['Limpieza del tanque por biofilm'],
};

export function createMaintenanceState() { return Object.fromEntries(Object.values(TASKS).flat().map((task) => [task, false])); }

export function renderMaintenance(container, state, onChange) {
  const tasks = Object.entries(TASKS).flatMap(([frequency, items]) => items.map((task) => ({ frequency, task })));
  const completed = tasks.filter(({ task }) => state[task]).length;
  container.innerHTML = `${Object.entries(TASKS).map(([frequency, items]) => `<section class="maintenance-group"><h3>${frequency}</h3>${items.map((task) => `<label class="maintenance-task"><input type="checkbox" data-maintenance="${task}" ${state[task] ? 'checked' : ''} /><span>${task}</span></label>`).join('')}</section>`).join('')}<div class="maintenance-progress"><span>Completado</span><strong>${Math.round(completed / tasks.length * 100)}%</strong></div>`;
  container.querySelectorAll('[data-maintenance]').forEach((input) => input.addEventListener('change', (event) => onChange(event.target.dataset.maintenance, event.target.checked)));
}
