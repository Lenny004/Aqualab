import { toolField, toolHeading } from '../ui-helpers.js';

const RISK_ROWS = [
  { danger: 'Excrementos de aves o roedores', consequence: 'Contaminación fecal y enfermedad', prevention: 'Limpiar techo, instalar malla, desviar primeras aguas y mantener el depósito cerrado', action: 'Suspender el consumo, limpiar, desinfectar y analizar', uses: ['tomar', 'cultivar'] },
  { danger: 'Turbidez elevada', consequence: 'Desinfección menos eficaz', prevention: 'Controlar sedimentos y usar filtración apropiada', action: 'Detener el tratamiento para beber, revisar el filtro y repetir pruebas', uses: ['tomar'] },
  { danger: 'Techo con metales o recubrimientos incompatibles', consequence: 'Contaminación química', prevention: 'Inspeccionar el material, evaluar el laboratorio y excluir techos de riesgo', action: 'No usar para beber; cambiar la fuente o aplicar un tratamiento diseñado', uses: ['tomar', 'cultivar'] },
  { danger: 'Carbón agotado o lecho canalizado', consequence: 'Reducción del rendimiento', prevention: 'Registrar la vida útil, el caudal y sus cambios', action: 'Cambiar el medio según su ficha técnica y volver a validar', uses: ['tomar', 'cultivar'] },
  { danger: 'Dosis incorrecta de desinfectante', consequence: 'Tratamiento insuficiente o exposición química', prevention: 'Usar un procedimiento validado, medir y capacitar', action: 'Suspender el uso, ajustar bajo guía sanitaria y analizar', uses: ['tomar'] },
  { danger: 'Depósito abierto o con luz', consequence: 'Algas, insectos y recontaminación', prevention: 'Usar tapa opaca y malla en las aberturas', action: 'Limpiar, desinfectar y reparar la cubierta', uses: ['tomar', 'cultivar'] },
  { danger: 'Conexión cruzada con agua no potable', consequence: 'Consumo accidental', prevention: 'Separar tuberías, identificar líneas y diferenciar grifos', action: 'Aislar las líneas y corregir la instalación', uses: ['tomar'] },
  { danger: 'Base inestable o barril lleno', consequence: 'Caída, lesión o derrame', prevention: 'Usar una base nivelada y resistente al peso del agua y del equipo', action: 'Vaciar de forma segura y reparar el soporte', uses: ['tomar', 'cultivar'] },
  { danger: 'Mosquitos en rebose o desviador', consequence: 'Riesgo vectorial', prevention: 'Instalar mallas y asegurar un drenaje completo sin agua estancada', action: 'Vaciar, limpiar y reparar las mallas', uses: ['tomar', 'cultivar'] },
  { danger: 'Falta de análisis', consequence: 'Falsa seguridad sanitaria', prevention: 'Reservar presupuesto para laboratorio y definir criterios de liberación', action: 'Mantener el agua como no potable', uses: ['tomar'] },
  { danger: 'Contaminación de la captación', consequence: 'Ingreso de polvo, residuos o microorganismos', prevention: 'Limpiar y proteger la captación', action: 'Detener el uso, limpiar y revisar la protección', uses: ['tomar', 'cultivar'] },
  { danger: 'Primera escorrentía contaminada', consequence: 'Arrastre de contaminantes al sistema', prevention: 'Usar un desviador de primeras aguas', action: 'Vaciar el desviador, limpiarlo y comprobar el drenaje', uses: ['tomar', 'cultivar'] },
  { danger: 'Material filtrante contaminado', consequence: 'Transferencia de contaminantes al agua', prevention: 'Utilizar materiales adecuados', action: 'Retirar el material, limpiar y reemplazarlo', uses: ['tomar', 'cultivar'] },
  { danger: 'Crecimiento microbiano', consequence: 'Deterioro microbiológico', prevention: 'Aplicar desinfección validada', action: 'Suspender el uso, limpiar, desinfectar y analizar', uses: ['tomar'] },
  { danger: 'Biofilm', consequence: 'Recontaminación', prevention: 'Programar limpieza y desinfección', action: 'Limpiar y desinfectar tanque y tuberías', uses: ['tomar', 'cultivar'] },
  { danger: 'Sales en el agua de riego', consequence: 'Salinidad del suelo', prevention: 'Medir EC y TDS y gestionar el drenaje', action: 'Evaluar la fuente, el cultivo y el manejo de drenaje', uses: ['cultivar'] },
  { danger: 'Sodio en el agua de riego', consequence: 'Sodicidad y pérdida de infiltración', prevention: 'Evaluar SAR junto con EC', action: 'Revisar fuente, cultivo y drenaje', uses: ['cultivar'] },
];

export function renderRisks(container, initialUse = 'tomar') {
  container.innerHTML = `<div class="tool-heading"><div><h3 class="tool-heading__title">Matriz de riesgos</h3><p class="tool-note tool-heading__note">Controles orientativos para el uso final seleccionado. No sustituye el análisis de calidad.</p></div><label class="tool-field tool-field--inline"><span class="tool-field__label">Uso final</span><select class="tool-field__control" data-risk-use><option value="tomar">Tomar</option><option value="cultivar">Cultivar</option></select></label></div><div class="risk-table" role="table"><div class="risk-row risk-row--head" role="row"><span class="risk-row__cell">Peligro</span><span class="risk-row__cell">Consecuencia</span><span class="risk-row__cell">Prevención</span><span class="risk-row__cell">Acción correctiva</span></div><div data-risk-rows></div></div>`;
  const useField = toolField({ label: 'Uso final', inline: true, control: '<select class="tool-field__control" data-risk-use><option value="tomar">Tomar</option><option value="cultivar">Cultivar</option></select>' });
  const heading = toolHeading('Matriz de riesgos', 'Orientativo según el uso final.', useField);
  container.innerHTML = container.innerHTML.replace(/<div class="tool-heading">[\s\S]*?<\/div><\/div><div class="risk-table">/, `${heading}<div class="risk-table">`);
  const select = container.querySelector('[data-risk-use]');
  select.value = initialUse === 'cultivar' ? 'cultivar' : 'tomar';
  const update = () => {
    const use = select.value;
    container.querySelector('[data-risk-rows]').innerHTML = RISK_ROWS.filter((row) => row.uses.includes(use)).map((row) => `<div class="risk-row" role="row"><span class="risk-row__cell" data-label="Peligro">${row.danger}</span><span class="risk-row__cell" data-label="Consecuencia">${row.consequence}</span><span class="risk-row__cell" data-label="Prevenci\u00f3n">${row.prevention}</span><span class="risk-row__cell" data-label="Acci\u00f3n correctiva">${row.action}</span></div>`).join('');
  };
  select.addEventListener('change', update);
  update();
  return (use) => {
    select.value = use === 'cultivar' ? 'cultivar' : 'tomar';
    update();
  };
}
