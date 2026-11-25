const ingredientPaths: Record<string, string> = {
  bun: '<path fill="#e8a44b" d="M2 11a8 7 0 0 1 16 0v4H2z"/><path fill="#fff0bf" d="M6 7h2v1H6zm5-2h2v1h-2z"/>',
  patty: '<rect x="2" y="6" width="16" height="9" rx="4" fill="#814635"/><path stroke="#ed9c73" d="m7 8 3 4m1-4 3 4"/>',
  tomato: '<circle cx="10" cy="10" r="7" fill="#ed5744"/><path stroke="#ffb17a" fill="none" d="M5 10h10m-5-5v10"/>',
  cheese: '<path fill="#ffcb51" d="m2 12 8-8 8 9v3H2z"/><path fill="#e39332" d="M5 12h2v2H5zm6-1h2v2h-2z"/>',
  lettuce: '<path fill="#74af53" d="M10 18C5 16 1 12 3 8l3-1 1-4 5 2 4-2 2 5c1 5-3 8-8 10z"/><path stroke="#d5e58c" d="m6 8 4 7 3-8"/>',
};

export function ingredientIcon(id: string) {
  return ingredientPaths[id] ? `<svg class="ingredient-icon" viewBox="0 0 20 20" aria-hidden="true">${ingredientPaths[id]}</svg>` : '';
}

export function orderIcon(recipe: string) {
  const toppings = recipe === 'garden' ? '<path fill="#74af53" d="m3 16 4-2 5 2 6-2 5 2-2 3H4z"/><path fill="#ec5942" d="M4 13h18v3H4z"/>' :
    recipe === 'cheese' ? '<path fill="#ffc550" d="M3 13h20l-5 5-5-3H3z"/>' : '';
  return `<svg class="order-icon" viewBox="0 0 26 26" aria-hidden="true"><path fill="#cf7c36" d="M3 18h20v2q0 3-5 3H8q-5 0-5-3z"/><rect fill="#713d2d" x="2" y="15" width="22" height="5" rx="2"/>${toppings}<path fill="#eaae55" d="M2 13C3 1 23 1 24 13z"/><path stroke="#fff1c8" d="m8 8 2-1m4-1 2 1m2 2 2-1"/></svg>`;
}
