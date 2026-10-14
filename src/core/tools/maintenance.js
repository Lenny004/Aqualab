const TASKS = { 'Despu\u00e9s de cada lluvia': ['Mallas', 'Desviador', 'Rebose'], Semanal: ['Tapa', 'Grifo', 'Insectos'], Mensual: ['Tuber\u00edas', 'Base', 'Caudal', 'Turbidez', 'Purga del sedimentador'], 'Seg\u00fan desempe\u00f1o': ['Medios filtrantes', 'Cambio de carb\u00f3n'], Anual: ['Limpieza del tanque por biofilm'] };
export function createMaintenanceState() { return Object.fromEntries(Object.values(TASKS).flat().map((task) => [task, false])); }
export function renderMaintenance(container, state, onChange) {
  const tasks = Object.values(TASKS).flat();
  container.innerHTML = `${Object.entries(TASKS).map(([frequency, items]) => `<section class="maintenance-group"><h3 class="maintenance-group__title">${frequency}</h3>${items.map((task) => `<label class="maintenance-task"><input class="maintenance-task__input" type="checkbox" data-maintenance="${task}" ${state[task] ? 'checked' : ''} /><span>${task}</span></label>`).join('')}</section>`).join('')}<div class="maintenance-progress"><span>Completado</span><strong class="maintenance-progress__value" data-maintenance-progress></strong></div>`;
  const update = () => { container.querySelector('[data-maintenance-progress]').textContent = `${Math.round(tasks.filter((task) => state[task]).length / tasks.length * 100)}%`; };
  container.querySelectorAll('[data-maintenance]').forEach((input) => input.addEventListener('change', (event) => { state[event.target.dataset.maintenance] = event.target.checked; update(); onChange?.(state); })); update();
}
