const number = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;

export function renderCalculator(container, state, onChange) {
  const p = number(state.p, 20);
  const area = number(state.area, 40);
  const coefficient = number(state.coefficient, 0.8);
  const capacity = number(state.capacity, 200);
  const demand = number(state.demand, 40);
  const volume = p * area * coefficient;
  const barrels = Math.ceil(volume / capacity);
  const days = barrels * capacity / demand;
  container.innerHTML = `<p class="tool-note">Valores ilustrativos. Edita los valores para explorar el cálculo.</p><div class="tool-form tool-form--compact">${input('P (mm)', 'p', p, 0, 1000, 1)}${input('A (m²)', 'area', area, 0, 100000, 1)}${input('C', 'coefficient', coefficient, 0, 1, 0.01)}${input('Capacidad (L)', 'capacity', capacity, 1, 10000, 1)}${input('Demanda (L/d)', 'demand', demand, 1, 100000, 1)}</div><div class="tool-results"><div><span>V = P × A × C</span><strong>${format(volume)} L</strong></div><div><span>Barriles = ROUNDUP(V / capacidad)</span><strong>${format(barrels)}</strong></div><div><span>Días de cobertura</span><strong>${format(days)}</strong></div></div>`;
  container.querySelectorAll('[data-tool-input]').forEach((inputElement) => inputElement.addEventListener('input', (event) => onChange(event.target.dataset.toolInput, Number(event.target.value))));
}

function input(label, key, value, min, max, step) {
  return `<label class="tool-field"><span class="tool-field__label">${label}</span><input class="tool-field__control" data-tool-input="${key}" type="number" value="${value}" min="${min}" max="${max}" step="${step}" /></label>`;
}

function format(value) { return Number.isInteger(value) ? value : value.toFixed(2); }
