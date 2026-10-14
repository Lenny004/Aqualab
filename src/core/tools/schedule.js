const PHASES = [
  ['1', 'Inspección del sitio y definición de uso', `1\u20132 días`, 'Ficha de sitio y riesgos'],
  ['2', 'Medición de techo, demanda y cálculo de captación', `1\u20132 días`, 'Memoria de cálculo'],
  ['3', 'Diseño final y cotizaciones', `2\u20134 días`, 'Plano, lista de materiales y presupuesto'],
  ['4', 'Compra y preparación de componentes', `2\u20135 días`, 'Inventario recibido'],
  ['5', 'Montaje hidráulico y mecánico', `1\u20133 días`, 'Prototipo instalado'],
  ['6', 'Pruebas de fugas, caudal y operación', `1\u20132 días`, 'Acta de prueba'],
  ['7', 'Análisis de calidad y correcciones', 'Según laboratorio', 'Informe de resultados'],
  ['8', 'Capacitación y entrega', '1 día', 'Manual y registros'],
];
const STATUSES = ['Pendiente', 'En curso', 'Hecho'];

export function renderSchedule(container) {
  const statuses = PHASES.map(() => 'Pendiente');
  queueMicrotask(() => container.querySelectorAll('.schedule-row:not(.schedule-row--head)').forEach((row) => {
    const labels = ['Fase', 'Actividad', 'Duraci\u00f3n estimada', 'Entregable', 'Estado'];
    [...row.children].forEach((cell, index) => {
      if (cell.matches('select')) {
        const wrapper = document.createElement('span');
        wrapper.className = 'schedule-row__cell';
        wrapper.dataset.label = labels[index];
        cell.replaceWith(wrapper);
        wrapper.append(cell);
      } else {
        cell.dataset.label = labels[index];
        cell.classList.add('schedule-row__cell');
      }
    });
  }));
  container.innerHTML = `<p class="tool-note">Cronograma referencial. No incluye esperas de laboratorio ni permisos.</p><div class="schedule-table" role="table"><div class="schedule-row schedule-row--head" role="row"><span class="schedule-row__cell">Fase</span><span class="schedule-row__cell">Actividad</span><span class="schedule-row__cell">Duración estimada</span><span class="schedule-row__cell">Entregable</span><span class="schedule-row__cell">Estado</span></div><div data-schedule-rows></div></div>`;
  const rows = container.querySelector('[data-schedule-rows]');
  rows.innerHTML = PHASES.map(([phase, activity, duration, deliverable], index) => `<div class="schedule-row" role="row"><strong class="schedule-row__number">${phase}</strong><span class="schedule-row__cell">${activity}</span><span class="schedule-row__cell">${duration}</span><span class="schedule-row__cell">${deliverable}</span><select class="tool-field__control schedule-row__status" data-schedule-status="${index}" aria-label="Estado de fase ${phase}">${STATUSES.map((status) => `<option>${status}</option>`).join('')}</select></div>`).join('');
  rows.querySelectorAll('[data-schedule-status]').forEach((select) => select.addEventListener('change', (event) => { statuses[Number(event.target.dataset.scheduleStatus)] = event.target.value; }));
}
