export const PRESETS = [
  {
    id: 'method-a',
    method: 'Método A / Diseño 1',
    name: 'Agua segura para tomar',
    use: 'tomar',
    sequence: 'Captación \u2192 malla \u2192 primera escorrentía \u2192 sedimentación \u2192 grava \u2192 arena \u2192 carbón activado \u2192 desinfección \u2192 almacenamiento \u2192 análisis.',
    materials: 'Tanque apto, canaleta, malla, desviador, sedimentador, grava lavada, arena silícea lavada, carbón activado certificado, tubería compatible, equipo de desinfección y herramientas de análisis.',
    indicators: 'Turbidez, pH, microbiología, parámetros químicos de riesgo y desinfectante residual cuando aplique.',
  },
  {
    id: 'method-b',
    method: 'Método B / Diseño 2',
    name: 'Agua para cultivar alimentos',
    use: 'cultivar',
    sequence: 'Captación \u2192 malla \u2192 primera escorrentía \u2192 sedimentación \u2192 filtro de sólidos \u2192 tanque cerrado \u2192 filtro final para riego \u2192 distribución por goteo.',
    materials: 'Tanque, filtro de sólidos, tubería, filtro de protección de emisores y sistema de goteo.',
    indicators: 'Conductividad eléctrica, TDS, pH, sodio/SAR, cloruros, boro y otros parámetros definidos por fuente y cultivo.',
  },
  {
    id: 'method-c',
    method: 'Método C / Diseño 3',
    name: 'Sistema comunitario integrado',
    use: 'tomar',
    sequence: 'Fuente o captación \u2192 protección de fuente \u2192 pretratamiento \u2192 sedimentación \u2192 filtración \u2192 desinfección \u2192 almacenamiento \u2192 distribución separada \u2192 vigilancia.',
    materials: 'Captación, pozo o tanque, sedimentador, filtros, equipo de desinfección, tanque de almacenamiento, red, puntos de muestreo y registros.',
    indicators: 'Calidad fisicoquímica, microbiología, desinfectante residual, caudal y mantenimiento.',
    note: 'Está pensado para comunidad o escuela: requiere responsable operativo, registros, mantenimiento, control del desinfectante y análisis de laboratorio.',
  },
];

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

export function renderPresets(container, { scenario, onApply }) {
  container.innerHTML = `<div class="preset-heading"><h3 class="preset-heading__title">Elige un diseño</h3><span class="preset-heading__hint">Configura etapas y uso</span></div><div class="preset-list">${PRESETS.map((preset) => `<article class="preset-card"><div class="preset-card__top"><div><strong class="preset-card__name">${escapeHtml(preset.method)}</strong><h4 class="preset-card__title">${escapeHtml(preset.name)}</h4></div><button class="preset-card__button" type="button" data-preset="${preset.id}">Aplicar</button></div></article>`).join('')}</div><p class="preset-feedback" data-preset-feedback role="status">${escapeHtml(scenario.presetNote || '')}</p>`;
  container.querySelectorAll('[data-preset]').forEach((button) => button.addEventListener('click', () => {
    const preset = PRESETS.find((item) => item.id === button.dataset.preset);
    const feedback = container.querySelector('[data-preset-feedback]');
    const result = onApply(preset);
    feedback.textContent = result?.message || `${preset.method} aplicado.`;
  }));
}
