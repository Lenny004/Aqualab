const PARAMETERS = [
  ['EC', 'Concentración aproximada de sales.', 'La salinidad puede dificultar la absorción de agua y reducir el rendimiento.', 'Evaluar fuente, cultivo y manejo de lavado o drenaje.'],
  ['TDS', 'Sólidos disueltos totales.', 'Ayuda a caracterizar la carga salina.', 'Interpretar junto con EC.'],
  ['pH', 'Acidez o alcalinidad.', 'Afecta la disponibilidad de nutrientes y la compatibilidad del agua con el suelo.', 'Ajustar el manejo según cultivo y suelo.'],
  ['Sodio/SAR', 'Riesgo de sodicidad e infiltración.', 'El exceso de sodio puede deteriorar la estructura del suelo.', 'Evaluar EC junto con SAR y drenaje.'],
  ['Cloruros', 'Ion potencialmente tóxico.', 'Algunos cultivos son sensibles.', 'Comparar con la tolerancia del cultivo.'],
  ['Boro', 'Micronutriente que puede ser tóxico en exceso.', 'Puede afectar cultivos sensibles.', 'Analizar cuando exista riesgo.'],
  ['Nitratos', 'Carga de nitrógeno.', 'Puede aportar nutrientes o indicar contaminación.', 'Considerar el balance de fertilización y el riesgo sanitario.'],
];

export function renderAgronomy(container) {
  queueMicrotask(() => container.querySelectorAll('.agronomy-row:not(.agronomy-row--head)').forEach((row) => ['Par\u00e1metro', 'Qu\u00e9 indica', 'Acci\u00f3n'].forEach((label, index) => { row.children[index].dataset.label = label; row.children[index].classList.add('agronomy-row__cell'); })));
  container.innerHTML = `<p class="tool-note">La interpretación depende de la fuente, el cultivo, el suelo y el manejo. Definir con laboratorio y FAO según cultivo; no se muestran valores límite.</p><div class="agronomy-table"><div class="agronomy-row agronomy-row--head"><span>Parámetro</span><span>Qué indica</span><span>Acción</span></div>${PARAMETERS.map(([name, indicates, why, action]) => `<div class="agronomy-row"><strong>${name}</strong><div><span>${indicates}</span><small>${why}</small></div><span>${action}</span></div>`).join('')}</div><div class="drip-guide"><h3>Riego por goteo</h3><p>El goteo lleva el agua directamente a la zona radicular, reduce el contacto con hojas y frutos y ayuda a proteger el cultivo comestible.</p><ul><li>Instala un filtro de protección para evitar obstrucciones en los emisores.</li><li>Mantén tanques, mangueras y filtros limpios para controlar biofilm y contaminación.</li><li>Aplica más precaución en cultivos que se comen crudos: evita mojar directamente hojas y frutos destinados al consumo.</li><li>En cultivos que se cocinan, la precaución sigue dependiendo de la fuente y del contacto del agua con la parte comestible.</li></ul></div>`;
}
