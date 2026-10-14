import { toolNote } from '../ui-helpers.js';

const PARAMETERS = [
  ['EC', 'Concentraci\u00f3n aproximada de sales.', 'La salinidad puede dificultar la absorci\u00f3n de agua y reducir el rendimiento.', 'Evaluar fuente, cultivo y manejo de lavado o drenaje.'],
  ['TDS', 'S\u00f3lidos disueltos totales.', 'Ayuda a caracterizar la carga salina.', 'Interpretar junto con EC.'],
  ['pH', 'Acidez o alcalinidad.', 'Afecta la disponibilidad de nutrientes y la compatibilidad del agua con el suelo.', 'Ajustar el manejo seg\u00fan cultivo y suelo.'],
  ['Sodio/SAR', 'Riesgo de sodicidad e infiltraci\u00f3n.', 'El exceso de sodio puede deteriorar la estructura del suelo.', 'Evaluar EC junto con SAR y drenaje.'],
  ['Cloruros', 'Ion potencialmente t\u00f3xico.', 'Algunos cultivos son sensibles.', 'Comparar con la tolerancia del cultivo.'],
  ['Boro', 'Micronutriente que puede ser t\u00f3xico en exceso.', 'Puede afectar cultivos sensibles.', 'Analizar cuando exista riesgo.'],
  ['Nitratos', 'Carga de nitr\u00f3geno.', 'Puede aportar nutrientes o indicar contaminaci\u00f3n.', 'Considerar el balance de fertilizaci\u00f3n y el riesgo sanitario.'],
];
export function renderAgronomy(container) {
  container.innerHTML = `${toolNote('La interpretaci\u00f3n depende de la fuente, el cultivo, el suelo y el manejo. Definir con laboratorio y FAO seg\u00fan cultivo; no se muestran valores l\u00edmite.')}<div class="agronomy-table"><div class="agronomy-row agronomy-row--head"><span>Par\u00e1metro</span><span>Qu\u00e9 indica</span><span>Acci\u00f3n</span></div>${PARAMETERS.map(([name, indicates, why, action]) => `<div class="agronomy-row"><strong class="agronomy-row__cell agronomy-row__title" data-label="Par\u00e1metro">${name}</strong><div class="agronomy-row__cell agronomy-row__body" data-label="Qu\u00e9 indica"><span class="agronomy-row__text">${indicates}</span><small class="agronomy-row__meta">${why}</small></div><span class="agronomy-row__cell agronomy-row__action" data-label="Acci\u00f3n">${action}</span></div>`).join('')}</div><div class="drip-guide"><h3 class="drip-guide__title">Riego por goteo</h3><p class="drip-guide__text">El goteo lleva el agua directamente a la zona radicular, reduce el contacto con hojas y frutos y ayuda a proteger el cultivo comestible.</p><ul class="drip-guide__list"><li>Instala un filtro de protecci\u00f3n para evitar obstrucciones en los emisores.</li><li>Mant\u00e9n tanques, mangueras y filtros limpios para controlar biofilm y contaminaci\u00f3n.</li><li>Aplica m\u00e1s precauci\u00f3n en cultivos que se comen crudos: evita mojar directamente hojas y frutos destinados al consumo.</li><li>En cultivos que se cocinan, la precauci\u00f3n sigue dependiendo de la fuente y del contacto del agua con la parte comestible.</li></ul></div>`;
}
