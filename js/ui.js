/** Renders a shared empty state into an element or selector. */
function renderEmptyState(container, { badge = 'No Results', title = 'No results found', message = 'Try changing or clearing your filters.' } = {}) {
  const element = typeof container === 'string' ? document.querySelector(container) : container;
  if (!element) return;
  element.replaceChildren();

  const card = document.createElement('div');
  card.className = 'card';
  card.style.cssText = 'text-align:center;padding:3rem 1.5rem;grid-column:1 / -1;';
  const badgeElement = document.createElement('span');
  badgeElement.className = 'badge badge-open';
  badgeElement.textContent = badge;
  const badgeWrap = document.createElement('div');
  badgeWrap.style.marginBottom = '1rem';
  badgeWrap.appendChild(badgeElement);

  const heading = document.createElement('h3');
  heading.style.cssText = 'font-size:1.25rem;font-weight:700;margin-bottom:.5rem;color:var(--color-text);';
  heading.textContent = title;
  const description = document.createElement('p');
  description.style.cssText = 'color:var(--color-text-muted);max-width:480px;margin:0 auto;font-size:.9375rem;';
  description.textContent = message;
  card.append(badgeWrap, heading, description);
  element.appendChild(card);
}

if (typeof window !== 'undefined') window.renderEmptyState = renderEmptyState;
