const DETERIORATION_DEFINITIONS = [
  { id: 'carbon', label: 'Carb\u00f3n agotado o saturado', effect: 'Reduce la adsorci\u00f3n de color y olor; puede favorecer crecimiento microbiano.', action: 'Cambiar el carb\u00f3n seg\u00fan la ficha t\u00e9cnica y volver a validar.', repairTasks: ['Cambio de carb\u00f3n'] },
  { id: 'clogging', label: 'Lecho colmatado', effect: 'El caudal baja y la duraci\u00f3n simulada del filtro aumenta.', action: 'Revisar medios filtrantes, caudal y purga cuando corresponda.', repairTasks: ['Medios filtrantes', 'Caudal', 'Purga del sedimentador'] },
  { id: 'biofilm', label: 'Biofilm en tanque o tuber\u00edas', effect: 'Aumentan cualitativamente E. coli y coliformes en el dep\u00f3sito o la salida.', action: 'Limpiar y desinfectar el tanque y las tuber\u00edas.', repairTasks: ['Limpieza del tanque por biofilm', 'Tuber\u00edas'] },
  { id: 'mosquitoes', label: 'Mosquitos o agua estancada', effect: 'El desviador o el rebose pueden convertirse en un foco vectorial.', action: 'Vaciar, limpiar y reparar las mallas; asegurar drenaje completo.', repairTasks: ['Desviador', 'Rebose', 'Mallas', 'Insectos'] },
];

const clamp = (value) => Math.min(1, Math.max(0, value));

export function createDeteriorationState() {
  return { weeks: 0, items: [] };
}

function stateForProgress(progress) {
  if (progress <= 0) return { status: 'Bien', level: 0, factor: 0 };
  if (progress < 0.5) return { status: 'Atenci\u00f3n', level: 1, factor: 0.5 };
  return { status: 'Cr\u00edtico', level: 2, factor: 1 };
}

export function calculateDeterioration(weeks, scenario, maintenanceState = {}) {
  const normalized = clamp(Number(weeks) / 8);
  const base = stateForProgress(normalized);
  const map = scenario.deteriorationMap || {};
  return DETERIORATION_DEFINITIONS.filter((definition) => (map[definition.id] || []).length).map((definition) => {
    const repaired = definition.repairTasks.some((task) => maintenanceState[task]);
    return { ...definition, stageIds: map[definition.id], ...(repaired ? { status: 'Bien', level: 0, factor: 0 } : base), repaired };
  });
}

export function updateDeterioration(state, weeks, scenario, maintenanceState) {
  state.weeks = Math.max(0, Number(weeks) || 0);
  state.items = calculateDeterioration(state.weeks, scenario, maintenanceState);
  return state;
}

export function getDeteriorationEffects(state) {
  return Object.fromEntries((state?.items || []).map((item) => [item.id, item.factor]));
}

export function renderDeterioration(container, state, onChange) {
  const items = state.items || [];
  container.innerHTML = `<div class="tool-heading"><div><h3 class="tool-heading__title">Deterioro simulado</h3><p class="tool-note tool-heading__note">Estados cualitativos para explorar mantenimiento. No son l\u00edmites sanitarios.</p></div></div><label class="tool-field"><span class="tool-field__label">Tiempo de uso simulado (semanas)</span><input class="tool-field__control" data-deterioration-weeks type="number" min="0" step="1" value="${state.weeks}" /></label><div class="deterioration-list">${items.map((item) => `<article class="deterioration-card deterioration-card--${item.level === 2 ? 'critical' : item.level === 1 ? 'attention' : 'good'}"><div><strong>${item.label}</strong><span>${item.status}</span></div><p><b>Efecto:</b> ${item.effect}</p><p><b>Acci\u00f3n:</b> ${item.action}</p></article>`).join('')}</div>`;
  container.querySelector('[data-deterioration-weeks]').addEventListener('input', (event) => onChange(Number(event.target.value) || 0));
}
