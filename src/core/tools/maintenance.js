const TASKS = { 'Después de cada lluvia': ['Mallas', 'Desviador', 'Rebose'], Semanal: ['Tapa', 'Grifo', 'Insectos'], Mensual: ['Tuberías', 'Base', 'Caudal', 'Turbidez', 'Purga del sedimentador'], 'Según desempeño': ['Medios filtrantes', 'Cambio de carbón'], Anual: ['Limpieza del tanque por biofilm'] };

export function createMaintenanceState() { return Object.fromEntries(Object.values(TASKS).flat().map((task) => [task, false])); }

export function renderMaintenance(container, state, onChange) {
  const tasks = Object.values(TASKS).flat();
  container.innerHTML = `${Object.entries(TASKS).map(([frequency, items]) => `<section class="maintenance-group"><h3>${frequency}</h3>${items.map((task) => `<label class="maintenance-task"><input type="checkbox" data-maintenance="${task}" ${state[task] ? 'checked' : ''} /><span>${task}</span></label>`).join('')}</section>`).join('')}<div class="maintenance-progress"><span>Completado</span><strong data-maintenance-progress></strong></div>`;
  const update = () => { container.querySelector('[data-maintenance-progress]').textContent = `${Math.round(tasks.filter((task) => state[task]).length / tasks.length * 100)}%`; };
  container.querySelectorAll('[data-maintenance]').forEach((input) => input.addEventListener('change', (event) => { state[event.target.dataset.maintenance] = event.target.checked; update(); onChange?.(state); }));
  update();
}
