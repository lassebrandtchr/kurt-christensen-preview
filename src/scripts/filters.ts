// Filtrering/sortering af lagergrid. Tilstand spejles i URL'en (?univers=&maerke=&vis=&sort=).
type State = Record<string, string>;
const KEYS = ['univers', 'maerke', 'vis', 'aarti', 'pris'];

function init(root: HTMLElement) {
  const controls = root.querySelector<HTMLElement>('[data-stock-controls]');
  const grid = root.querySelector<HTMLElement>('[data-stock-grid]');
  const result = root.querySelector<HTMLElement>('[data-stock-result]');
  const empty = root.querySelector<HTMLElement>('[data-stock-empty]');
  const sortSel = root.querySelector<HTMLSelectElement>('[data-sort]');
  if (!controls || !grid || !sortSel) return;
  controls.hidden = false;
  const items = [...grid.querySelectorAll<HTMLElement>('[data-item]')];
  const chips = [...controls.querySelectorAll<HTMLButtonElement>('[data-filter]')];
  const available = new Set(chips.map((c) => c.dataset.filter!));

  const params = new URLSearchParams(location.search);
  const state: State = {};
  for (const k of KEYS) if (available.has(k)) state[k] = params.get(k) ?? '';
  let sort = params.get('sort') ?? '';
  if ([...sortSel.options].some((o) => o.value === sort)) sortSel.value = sort;
  else sort = '';

  const num = (el: HTMLElement, k: string) => {
    const v = el.dataset[k];
    return v === '' || v == null ? NaN : Number(v);
  };

  function matches(el: HTMLElement) {
    if (state.univers && el.dataset.u !== state.univers) return false;
    if (state.maerke && el.dataset.maerke !== state.maerke) return false;
    if (state.vis === 'til-salg' && el.dataset.status === 'solgt') return false;
    if (state.vis === 'solgt' && el.dataset.status !== 'solgt') return false;
    if (state.aarti) {
      const y = num(el, 'year');
      if (!(y >= +state.aarti && y < +state.aarti + 10)) return false;
    }
    if (state.pris) {
      const [lo, hi] = state.pris.split('-');
      const p = num(el, 'price');
      if (Number.isNaN(p)) return false;
      if (lo && p < +lo) return false;
      if (hi && p >= +hi) return false;
    }
    return true;
  }

  function compare(a: HTMLElement, b: HTMLElement) {
    const soldA = a.dataset.status === 'solgt' ? 1 : 0;
    const soldB = b.dataset.status === 'solgt' ? 1 : 0;
    if (soldA !== soldB) return soldA - soldB; // solgte altid sidst
    const by = (k: string, dir: 1 | -1) => {
      const x = num(a, k), y = num(b, k);
      if (Number.isNaN(x) && Number.isNaN(y)) return 0;
      if (Number.isNaN(x)) return 1; // ukendte sidst
      if (Number.isNaN(y)) return -1;
      return (x - y) * dir;
    };
    let r = 0;
    switch (sort) {
      case 'aargang-ny': r = by('year', -1); break;
      case 'aargang-gl': r = by('year', 1); break;
      case 'pris-op': r = by('price', 1); break;
      case 'pris-ned': r = by('price', -1); break;
      case 'km-op': r = by('km', 1); break;
      case 'km-ned': r = by('km', -1); break;
    }
    return r || num(a, 'order') - num(b, 'order');
  }

  function apply(push = true) {
    chips.forEach((c) => c.setAttribute('aria-pressed', String((state[c.dataset.filter!] ?? '') === (c.dataset.value ?? ''))));
    const sorted = [...items].sort(compare);
    let shown = 0;
    sorted.forEach((el) => {
      grid!.appendChild(el);
      const ok = matches(el);
      el.hidden = !ok;
      if (ok) {
        shown++;
        el.querySelector('.reveal')?.classList.add('is-in');
      }
    });
    if (result) result.textContent = `Viser ${shown} af ${items.length} ${items.length === 1 ? 'bil' : 'biler'}`;
    if (empty) empty.hidden = shown > 0;
    if (push) {
      const p = new URLSearchParams();
      for (const [k, v] of Object.entries(state)) if (v) p.set(k, v);
      if (sort) p.set('sort', sort);
      const qs = p.toString();
      history.replaceState(null, '', `${location.pathname}${qs ? `?${qs}` : ''}${location.hash}`);
    }
  }

  chips.forEach((c) =>
    c.addEventListener('click', () => {
      state[c.dataset.filter!] = c.dataset.value ?? '';
      apply();
    }),
  );
  sortSel.addEventListener('change', () => {
    sort = sortSel.value;
    apply();
  });
  root.querySelector('[data-reset]')?.addEventListener('click', () => {
    for (const k of Object.keys(state)) state[k] = '';
    sort = '';
    sortSel.value = '';
    apply();
  });
  apply(false);
}

document.querySelectorAll<HTMLElement>('[data-stock]').forEach(init);
