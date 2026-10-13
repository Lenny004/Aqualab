const DEFAULT_ITEMS = [['Barril', 45], ['Malla', 8], ['Canaleta y bajante', 45], ['Desviador de primeras aguas', 25], ['Recipiente de prefiltro', 15], ['Grava', 10], ['Arena', 12], ['Carbón activado', 22], ['Tuberías', 30], ['Válvulas y grifos', 18], ['Depósito final', 45], ['Tapa, malla de rebose y sellos', 10], ['Herramientas', 15], ['Pruebas de calidad iniciales', 55], ['Desinfección y equipo de control', 30], ['Señalización', 5]];

export function createBudgetState() { return { items: DEFAULT_ITEMS.map(([name, price]) => ({ name, quantity: 1, price })), contingency: 10 }; }

export function renderBudget(container, state, onChange) {
  container.innerHTML = `<p class="tool-note">Precios ilustrativos, no son cotizaciones.</p><div class="budget-table" role="table"><div class="budget-row budget-row--head"><span>Material</span><span>Cantidad</span><span>USD/u</span><span>Total</span></div>${state.items.map((item, index) => `<div class="budget-row"><span>MAT-${String(index + 1).padStart(2, '0')} · ${item.name}</span><input data-budget="quantity" data-index="${index}" type="number" min="0" step="1" value="${item.quantity}" aria-label="Cantidad de ${item.name}" /><input data-budget="price" data-index="${index}" type="number" min="0" step="0.01" value="${item.price}" aria-label="Precio de ${item.name}" /><strong data-budget-total="${index}"></strong></div>`).join('')}</div><label class="tool-field tool-field--inline"><span class="tool-field__label">Contingencia (%)</span><input class="tool-field__control" data-budget="contingency" type="number" min="0" max="100" step="1" value="${state.contingency}" /></label><div class="tool-results tool-results--budget"><div><span>Subtotal</span><strong data-budget-result="subtotal"></strong></div><div><span>Contingencia</span><strong data-budget-result="contingency"></strong></div><div><span>Total</span><strong data-budget-result="total"></strong></div></div><p class="tool-note" data-budget-warning hidden></p>`;
  const update = () => {
    container.querySelectorAll('[data-budget]').forEach((field) => { const key = field.dataset.budget; if (key === 'contingency') state.contingency = field.value; else state.items[Number(field.dataset.index)][key] = field.value; });
    const result = totals(state);
    state.items.forEach((item, index) => { container.querySelector(`[data-budget-total="${index}"]`).textContent = `$${money(result.rows[index])}`; });
    container.querySelector('[data-budget-result="subtotal"]').textContent = `$${money(result.subtotal)}`;
    container.querySelector('[data-budget-result="contingency"]').textContent = `$${money(result.contingency)}`;
    container.querySelector('[data-budget-result="total"]').textContent = `$${money(result.total)}`;
    const warning = container.querySelector('[data-budget-warning]'); warning.hidden = !result.invalid; warning.textContent = result.invalid ? 'Ingresa cantidades y precios no negativos.' : '';
    onChange?.(state);
  };
  container.querySelectorAll('[data-budget]').forEach((field) => field.addEventListener('input', update));
  update();
}

function totals(state) {
  const rows = state.items.map((item) => Number(item.quantity) * Number(item.price));
  const invalid = state.items.some((item) => !Number.isFinite(Number(item.quantity)) || !Number.isFinite(Number(item.price)) || Number(item.quantity) < 0 || Number(item.price) < 0) || !Number.isFinite(Number(state.contingency)) || Number(state.contingency) < 0 || Number(state.contingency) > 100;
  if (invalid) return { rows: rows.map((value) => Number.isFinite(value) && value >= 0 ? value : 0), subtotal: 0, contingency: 0, total: 0, invalid: true };
  const subtotal = rows.reduce((sum, value) => sum + value, 0); const contingency = subtotal * Number(state.contingency) / 100;
  return { rows, subtotal, contingency, total: subtotal + contingency, invalid: false };
}

function money(value) { return Number.isFinite(value) ? value.toFixed(2) : '?'; }
