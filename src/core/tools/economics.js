import { calculate } from './calculator.js';
import { getBudgetTotal } from './budget.js';
import { toolField, toolNote, toolResults } from '../ui-helpers.js';

const DASH = '\u2014';

export function renderEconomics(container, { calculatorState, budgetState }) {
  const field = (label, key) => toolField({ label, control: `<input class="tool-field__control" data-economics="${key}" type="number" />` });
  container.innerHTML = `${toolNote('Indicadores ilustrativos; edita los supuestos.')}<div class="tool-form">${field('Mantenimiento anual (USD/año)', 'annualCost')}${field('Vida útil (años)', 'lifeYears')}${field('Eventos/año', 'eventsYear')}${field('Demanda (L/día)', 'demand')}${field('Días de uso/año', 'useDays')}</div>${toolResults([{ label: 'Costo inicial', value: '', valueAttributes: ' data-economics-result="initialCost"' }, { label: 'Costo anual', value: '', valueAttributes: ' data-economics-result="annualCost"' }, { label: 'Volumen anual', value: '', valueAttributes: ' data-economics-result="annualVolume"' }, { label: 'Costo por litro', value: '', valueAttributes: ' data-economics-result="costPerLiter"' }, { label: '% aprovechamiento', value: '', valueAttributes: ' data-economics-result="useRate"' }], 'economics-results')}<p class="tool-note economics-formula" data-economics-result="formula"></p>`;
  const hint = document.createElement('p');
  hint.className = 'tool-note economics-hint';
  hint.dataset.economicsResult = 'hint';
  hint.hidden = true;
  container.append(hint);
  const fields = Object.fromEntries([...container.querySelectorAll('[data-economics]')].map((field) => [field.dataset.economics, field]));
  const results = Object.fromEntries([...container.querySelectorAll('[data-economics-result]')].map((node) => [node.dataset.economicsResult, node]));
  const number = (field) => field.value.trim() === '' ? null : Number(field.value);
  const format = (value, suffix = '', decimals = 2) => Number.isFinite(value) ? `${value.toFixed(decimals)}${suffix}` : DASH;
  const update = () => {
    const annualCost = number(fields.annualCost);
    const lifeYears = number(fields.lifeYears);
    const eventsYear = number(fields.eventsYear);
    const demand = number(fields.demand);
    const useDays = number(fields.useDays);
    const eventVolume = calculate(calculatorState).volumeValue;
    const initialCost = getBudgetTotal(budgetState);
    const annualVolume = Number.isFinite(eventVolume) && Number.isFinite(eventsYear) ? eventVolume * eventsYear : null;
    const costPerLiter = Number.isFinite(initialCost) && Number.isFinite(lifeYears) && lifeYears > 0 && Number.isFinite(annualCost) && Number.isFinite(annualVolume) && annualVolume > 0 ? (initialCost / lifeYears + annualCost) / annualVolume : null;
    const usedVolume = Number.isFinite(demand) && Number.isFinite(useDays) ? demand * useDays : null;
    const capturedVolume = Number.isFinite(eventVolume) && Number.isFinite(eventsYear) ? eventVolume * eventsYear : null;
    const useRate = Number.isFinite(usedVolume) && Number.isFinite(capturedVolume) && capturedVolume > 0 ? usedVolume / capturedVolume * 100 : null;
    const missing = [];
    const addMissing = (condition, label) => { if (condition && !missing.includes(label)) missing.push(label); };
    addMissing(!Number.isFinite(annualCost), 'mantenimiento anual');
    addMissing(!Number.isFinite(lifeYears) || lifeYears <= 0, 'vida \u00fatil');
    addMissing(!Number.isFinite(eventsYear), 'eventos/a\u00f1o');
    addMissing(!Number.isFinite(Number(calculatorState.p)) || Number(calculatorState.p) <= 0, 'precipitaci\u00f3n');
    addMissing(!Number.isFinite(Number(calculatorState.area)) || Number(calculatorState.area) <= 0, '\u00e1rea');
    addMissing(!Number.isFinite(Number(calculatorState.coefficient)) || Number(calculatorState.coefficient) <= 0, 'coeficiente');
    results.initialCost.textContent = format(initialCost, ' USD');
    results.annualCost.textContent = format(annualCost, ' USD/año');
    results.annualVolume.textContent = format(annualVolume, ' L/año');
    results.costPerLiter.textContent = format(costPerLiter, ' USD/L', 4);
    results.useRate.textContent = format(useRate, ' %');
    hint.hidden = missing.length === 0;
    hint.textContent = missing.length ? `Completa ${missing.join(', ')} para ver el costo por litro y el volumen anual.` : '';
    results.formula.textContent = `Costo por litro = (costo inicial / años de vida útil + costo anual) / volumen anual. Volumen anual = volumen por evento × eventos/año. % aprovechamiento = volumen usado / volumen captado.`;
  };
  Object.values(fields).forEach((field) => field.addEventListener('input', update));
  update();
  return update;
}
