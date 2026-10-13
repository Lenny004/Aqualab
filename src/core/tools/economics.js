import { calculate } from './calculator.js';
import { getBudgetTotal } from './budget.js';

const DASH = '\u2014';

export function renderEconomics(container, { calculatorState, budgetState }) {
  container.innerHTML = `<p class="tool-note">Indicadores ilustrativos. Edita solo los supuestos que quieras explorar; no hay valores predeterminados para mantenimiento, vida útil o eventos.</p><div class="tool-form"><label class="tool-field"><span class="tool-field__label">Mantenimiento anual (USD/año)</span><input class="tool-field__control" data-economics="annualCost" type="number" /></label><label class="tool-field"><span class="tool-field__label">Vida útil (años)</span><input class="tool-field__control" data-economics="lifeYears" type="number" /></label><label class="tool-field"><span class="tool-field__label">Eventos/año</span><input class="tool-field__control" data-economics="eventsYear" type="number" /></label><label class="tool-field"><span class="tool-field__label">Demanda (L/día)</span><input class="tool-field__control" data-economics="demand" type="number" /></label><label class="tool-field"><span class="tool-field__label">Días de uso/año</span><input class="tool-field__control" data-economics="useDays" type="number" /></label></div><div class="tool-results economics-results"><div><span>Costo inicial</span><strong data-economics-result="initialCost"></strong></div><div><span>Costo anual</span><strong data-economics-result="annualCost"></strong></div><div><span>Volumen anual</span><strong data-economics-result="annualVolume"></strong></div><div><span>Costo por litro</span><strong data-economics-result="costPerLiter"></strong></div><div><span>% aprovechamiento</span><strong data-economics-result="useRate"></strong></div></div><p class="tool-note economics-formula" data-economics-result="formula"></p>`;
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
    results.initialCost.textContent = format(initialCost, ' USD');
    results.annualCost.textContent = format(annualCost, ' USD/año');
    results.annualVolume.textContent = format(annualVolume, ' L/año');
    results.costPerLiter.textContent = format(costPerLiter, ' USD/L', 4);
    results.useRate.textContent = format(useRate, ' %');
    results.formula.textContent = `Costo por litro = (costo inicial / años de vida útil + costo anual) / volumen anual. Volumen anual = volumen por evento × eventos/año. % aprovechamiento = volumen usado / volumen captado.`;
  };
  Object.values(fields).forEach((field) => field.addEventListener('input', update));
  update();
  return update;
}
