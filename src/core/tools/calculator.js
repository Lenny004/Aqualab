const DEFAULTS = { p: 20, area: 40, coefficient: 0.8, capacity: 200, demand: 40 };

export function renderCalculator(container, state, onChange) {
  const values = { ...DEFAULTS, ...state };
  container.innerHTML = `<p class="tool-note">Valores ilustrativos. Edita los valores para explorar el cálculo.</p><div class="tool-form tool-form--compact">${input('P (mm)', 'p', values.p, 0, 1000, 1)}${input('A (m²)', 'area', values.area, 0, 100000, 1)}${input('C', 'coefficient', values.coefficient, 0, 1, 0.01)}${input('Capacidad (L)', 'capacity', values.capacity, 0, 10000, 1)}${input('Demanda (L/d)', 'demand', values.demand, 0, 100000, 1)}</div><div class="tool-results"><div><span>V = P × A × C</span><strong data-calculator-result="volume"></strong></div><div><span>Barriles = ROUNDUP(V / capacidad)</span><strong data-calculator-result="barrels"></strong></div><div><span>Días de cobertura</span><strong data-calculator-result="days"></strong></div></div><p class="tool-note" data-calculator-warning hidden></p>`;
  const update = () => {
    const values = Object.fromEntries([...container.querySelectorAll('[data-tool-input]')].map((field) => [field.dataset.toolInput, field.value]));
    const result = calculate(values);
    container.querySelector('[data-calculator-result="volume"]').textContent = result.volume;
    container.querySelector('[data-calculator-result="barrels"]').textContent = result.barrels;
    container.querySelector('[data-calculator-result="days"]').textContent = result.days;
    const warning = container.querySelector('[data-calculator-warning]');
    warning.hidden = !result.invalid;
    warning.textContent = result.invalid ? 'Ingresa un valor mayor que 0.' : '';
    Object.assign(state, values);
    onChange?.(values);
  };
  container.querySelectorAll('[data-tool-input]').forEach((field) => field.addEventListener('input', update));
  update();
}

function input(label, key, value, min, max, step) {
  return `<label class="tool-field"><span class="tool-field__label">${label}</span><input class="tool-field__control" data-tool-input="${key}" type="number" value="${value}" min="${min}" max="${max}" step="${step}" /></label>`;
}

function calculate(values) {
  const parsed = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, Number(value)]));
  const invalid = Object.values(parsed).some((value) => !Number.isFinite(value) || value <= 0);
  if (invalid) return { volume: '—', barrels: '—', days: '—', invalid: true };
  const coefficient = Math.min(1, parsed.coefficient);
  const volume = parsed.p * parsed.area * coefficient;
  const barrels = Math.ceil(volume / parsed.capacity);
  return { volume: format(volume), barrels: format(barrels), days: format(barrels * parsed.capacity / parsed.demand), invalid: false };
}

function format(value) { return Number.isInteger(value) ? value : value.toFixed(2); }
