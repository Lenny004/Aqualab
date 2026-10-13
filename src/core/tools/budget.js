const DEFAULT_ITEMS = [
  ['Barril', 45], ['Malla', 8], ['Canaleta y bajante', 45], ['Desviador de primeras aguas', 25], ['Recipiente de prefiltro', 15], ['Grava', 10], ['Arena', 12], ['Carbón activado', 22], ['Tuberías', 30], ['Válvulas y grifos', 18], ['Depósito final', 45], ['Tapa, malla de rebose y sellos', 10], ['Herramientas', 15], ['Pruebas de calidad iniciales', 55], ['Desinfección y equipo de control', 30], ['Señalización', 5],
];

export function createBudgetState() { return { items: DEFAULT_ITEMS.map(([name, price]) => ({ name, quantity: 1, price })), contingency: 10 }; }

export function renderBudget(container, state, onChange) {
  const subtotal = state.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const contingency = subtotal * state.contingency / 100;
  container.innerHTML = `<p class="tool-note">Precios ilustrativos, no son cotizaciones.</p><div class="budget-table" role="table"><div class="budget-row budget-row--head"><span>Material</span><span>Cantidad</span><span>USD/u</span><span>Total</span></div>${state.items.map((item, index) => `<div class="budget-row"><span>MAT-${String(index + 1).padStart(2, '0')} · ${item.name}</span><input data-budget="quantity" data-index="${index}" type="number" min="0" step="1" value="${item.quantity}" aria-label="Cantidad de ${item.name}" /><input data-budget="price" data-index="${index}" type="number" min="0" step="0.01" value="${item.price}" aria-label="Precio de ${item.name}" /><strong>$${money(item.quantity * item.price)}</strong></div>`).join('')}</div><label class="tool-field tool-field--inline"><span class="tool-field__label">Contingencia (%)</span><input class="tool-field__control" data-budget="contingency" type="number" min="0" max="100" step="1" value="${state.contingency}" /></label><div class="tool-results tool-results--budget"><div><span>Subtotal</span><strong>$${money(subtotal)}</strong></div><div><span>Contingencia</span><strong>$${money(contingency)}</strong></div><div><span>Total</span><strong>$${money(subtotal + contingency)}</strong></div></div>`;
  container.querySelectorAll('[data-budget]').forEach((input) => input.addEventListener('input', (event) => {
    const key = event.target.dataset.budget;
    if (key === 'contingency') onChange({ contingency: Number(event.target.value) });
    else onChange({ index: Number(event.target.dataset.index), key, value: Number(event.target.value) });
  }));
}

function money(value) { return value.toFixed(2); }
