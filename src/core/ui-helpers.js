export function toolNote(text, attributes = '') {
  return `<p class="tool-note"${attributes}>${text}</p>`;
}

export function toolField({ label, control, inline = false, hint = '', className = '', tagName = 'label', labelTag = 'span', labelAttributes = '', bare = false }) {
  if (bare) return control;
  const classes = ['tool-field', inline ? 'tool-field--inline' : '', className].filter(Boolean).join(' ');
  return `<${tagName} class="${classes}"><${labelTag} class="tool-field__label"${labelAttributes}>${label}</${labelTag}>${control}${hint}</${tagName}>`;
}

export function toolResults(rows, modifier = '') {
  return `<div class="tool-results${modifier ? ` ${modifier}` : ''}">${rows.map(({ label, value, valueAttributes = '' }) => `<div class="tool-results__row"><span class="tool-results__label">${label}</span><strong class="tool-results__value"${valueAttributes}>${value}</strong></div>`).join('')}</div>`;
}

export function responsiveTable({ block, headers, rows }) {
  return `<div class="${block}-table" role="table"><div class="${block}-row ${block}-row--head" role="row">${headers.map((header) => `<span class="${block}-row__cell">${header}</span>`).join('')}</div>${rows.join('')}</div>`;
}

export function toolHeading(title, note = '', content = '') {
  return `<div class="tool-heading"><div><h3 class="tool-heading__title">${title}</h3>${note ? `<p class="tool-note tool-heading__note">${note}</p>` : ''}</div>${content}</div>`;
}
