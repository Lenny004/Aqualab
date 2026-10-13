export const USAGES = {
  tomar: {
    label: 'Tomar',
    indicators: ['Microbiológicos: E. coli y coliformes', 'Físicos: turbidez, color y olor'],
    note: 'Exige una etapa de desinfección validada y análisis de laboratorio.',
  },
  cultivar: {
    label: 'Cultivar',
    indicators: ['pH', 'Conductividad (EC)', 'Turbidez'],
    note: 'Considerar EC/TDS/SAR/cloruros/boro/nitratos. Sin valores límite en esta propuesta. Usar riego por goteo.',
  },
  'no-potable': {
    label: 'Usos no potables',
    indicators: ['Turbidez', 'Color', 'Olor'],
    note: 'Para riego ornamental, limpieza exterior o descarga sanitaria, según el diseño del sistema.',
  },
};

export function renderUsage(container, { value, onChange }) {
  const usage = USAGES[value] || USAGES.tomar;
  container.innerHTML = `<div class="tool-field"><label class="tool-field__label" for="usageSelect">Uso final</label><select class="tool-field__control" id="usageSelect"><option value="tomar" ${value === 'tomar' ? 'selected' : ''}>Tomar</option><option value="cultivar" ${value === 'cultivar' ? 'selected' : ''}>Cultivar</option><option value="no-potable" ${value === 'no-potable' ? 'selected' : ''}>Usos no potables</option></select></div><div class="usage-summary"><strong>Indicadores mostrados</strong><ul>${usage.indicators.map((item) => `<li>${item}</li>`).join('')}</ul><p>${usage.note}</p></div>`;
  container.querySelector('#usageSelect').addEventListener('change', (event) => onChange(event.target.value));
}
