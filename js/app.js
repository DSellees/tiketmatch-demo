/* ============================================================================
   app.js — estado, render de la pantalla Home e interacciones.
   Debe cargarse el último (depende de data.js, icons.js y components.js).
   ========================================================================== */

// ── Estado de la app ─────────────────────────────────────────────────────────
const state = {
  tab: 'home',
  fav: new Set(),
  query: '',
  appliedFilters: defaultFilters(),
  draftFilters: defaultFilters(),
  filtersOpen: false,
  searchFocused: false,
};

// ── Lógica de filtrado ───────────────────────────────────────────────────────
function hasActiveFilters(f) {
  return f.cat.size > 0 || f.status.size > 0 || f.date !== 'any' || f.price !== 'any';
}

function isSearchMode() {
  return state.query.trim().length > 0
    || hasActiveFilters(state.appliedFilters)
    || state.appliedFilters.sort !== 'relevance';
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function matchesDateFilter(eventDate, filter) {
  if (filter === 'any') return true;
  const d = new Date(eventDate + 'T12:00:00');
  if (filter === 'today') return sameDay(d, TODAY);
  if (filter === 'weekend') {
    const day = d.getDay();
    const diff = (d - TODAY) / 86400000;
    return (day === 0 || day === 6) && diff >= 0 && diff <= 7;
  }
  if (filter === 'week') {
    const start = new Date(TODAY);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + (7 - end.getDay()));
    end.setHours(23, 59, 59, 999);
    return d >= start && d <= end;
  }
  if (filter === 'month') {
    return d.getMonth() === TODAY.getMonth() && d.getFullYear() === TODAY.getFullYear();
  }
  return true;
}

function matchesPriceFilter(priceNum, filter) {
  if (filter === 'any') return true;
  if (filter === 'lt25') return priceNum < 25;
  if (filter === '25-50') return priceNum >= 25 && priceNum <= 50;
  if (filter === '50-100') return priceNum > 50 && priceNum <= 100;
  if (filter === 'gt100') return priceNum > 100;
  return true;
}

function matchesQuery(e, q) {
  if (!q) return true;
  const haystack = [e.title, e.venue, e.area, CATNAME[e.cat]].join(' ').toLowerCase();
  return haystack.includes(q.toLowerCase());
}

function filterEvents(filters, query) {
  let list = EVENTS.filter(e => {
    if (filters.cat.size && !filters.cat.has(e.cat)) return false;
    if (filters.status.size && !filters.status.has(e.status)) return false;
    if (!matchesDateFilter(e.date, filters.date)) return false;
    if (!matchesPriceFilter(e.priceNum, filters.price)) return false;
    if (!matchesQuery(e, query.trim())) return false;
    return true;
  });

  if (filters.sort === 'price') list.sort((a, b) => a.priceNum - b.priceNum);
  else if (filters.sort === 'date') list.sort((a, b) => a.date.localeCompare(b.date));
  else if (filters.sort === 'near') {
    const order = new Map(NEARBY.map((id, i) => [id, i]));
    list.sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99));
  }

  return list.map(e => e.id);
}

function activeFilterCount() {
  const f = state.appliedFilters;
  return f.cat.size + f.status.size
    + (f.date !== 'any' ? 1 : 0)
    + (f.price !== 'any' ? 1 : 0);
}

// ── Render de la pantalla ────────────────────────────────────────────────────
function renderSearchBar() {
  const active = activeFilterCount();
  return `<div style="padding:14px 20px 0;">
    <div style="display:flex;align-items:center;gap:10px;height:50px;background:#fff;border:1px solid #EFEFF1;border-radius:16px;padding:0 6px 0 14px;box-shadow:0 2px 10px rgba(17,24,39,.04);">
      ${SVG.search('#9CA3AF')}
      <input data-search type="search" enterkeyhint="search" placeholder="Busca conciertos, deporte, planes…" value="${state.query.replace(/"/g, '&quot;')}" style="flex:1;border:none;outline:none;background:transparent;color:#111827;font-size:14.5px;font-weight:500;font-family:inherit;">
      <button type="button" data-filter-open style="position:relative;display:flex;align-items:center;justify-content:center;width:38px;height:38px;border:none;border-radius:11px;background:${AC};">
        ${SVG.sliders('#fff')}
        ${active ? `<span style="position:absolute;top:-4px;right:-4px;width:18px;height:18px;border-radius:50%;background:#111827;color:#fff;font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center;line-height:1;box-sizing:border-box;border:2px solid #fff;padding:0;">${active}</span>` : ''}
      </button>
    </div>
  </div>`;
}

function renderHomeSections() {
  const stdRow  = ids => ids.map(id => `<div style="flex:0 0 auto;width:278px;">${cardStd(EV[id])}</div>`).join('');
  const editRow = ids => ids.map(id => `<div style="flex:0 0 auto;width:240px;">${cardEdit(EV[id])}</div>`).join('');

  return `
      <!-- Eventos cerca de ti -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:0 20px;margin:22px 0 12px;">
        <div style="font-family:'Sora';font-weight:700;font-size:19px;color:#111827;letter-spacing:-.02em;">Eventos cerca de ti</div>
        <button style="border:none;background:none;color:${AC};font-size:13px;font-weight:700;">Ver todo</button>
      </div>
      <div data-scroll style="display:flex;gap:14px;overflow-x:auto;padding:0 20px 4px;">${stdRow(NEARBY)}</div>

      <!-- Populares ahora -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:0 20px;margin:24px 0 12px;">
        <div style="font-family:'Sora';font-weight:700;font-size:19px;color:#111827;letter-spacing:-.02em;">Populares ahora</div>
        <button style="border:none;background:none;color:${AC};font-size:13px;font-weight:700;">Ver todo</button>
      </div>
      <div data-scroll style="display:flex;gap:14px;overflow-x:auto;padding:0 20px 4px;">${stdRow(POPULAR)}</div>

      <!-- Banda destacada (deporte) -->
      <div style="margin:26px 0 6px;background:#111827;padding:22px 0 24px;">
        <div style="padding:0 20px;">
          <div style="display:inline-flex;align-items:center;gap:6px;background:${AS};color:${AC};font-size:10.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;padding:5px 11px;border-radius:999px;">Destacado · Deporte</div>
          <div style="font-family:'Sora';font-weight:800;font-size:24px;color:#fff;margin-top:12px;letter-spacing:-.02em;line-height:1.12;">Noches grandes de fútbol</div>
          <div style="color:rgba(255,255,255,.6);font-size:13.5px;margin-top:6px;line-height:1.45;max-width:300px;">Los partidos más esperados de la ciudad, con venta oficial dentro de Catchtime.</div>
        </div>
        <div data-scroll style="display:flex;gap:14px;overflow-x:auto;padding:16px 20px 2px;">${editRow(PREMIUM)}</div>
      </div>

      <!-- Trending en Barcelona -->
      <div style="padding:0 20px;margin:24px 0 2px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
          <div style="font-family:'Sora';font-weight:700;font-size:19px;color:#111827;letter-spacing:-.02em;">Trending en Barcelona</div>
          <span style="display:inline-flex;align-items:center;gap:5px;color:${AC};font-size:10.5px;font-weight:800;background:${AS};padding:4px 9px;border-radius:999px;">TOP 5</span>
        </div>
        ${TREND.map(t => trendRow(t)).join('')}
      </div>

      <!-- Recomendado para ti -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:0 20px;margin:24px 0 12px;">
        <div style="font-family:'Sora';font-weight:700;font-size:19px;color:#111827;letter-spacing:-.02em;">Recomendado para ti</div>
        <button style="border:none;background:none;color:${AC};font-size:13px;font-weight:700;">Ver todo</button>
      </div>
      <div data-scroll style="display:flex;gap:14px;overflow-x:auto;padding:0 20px 4px;">${stdRow(RECOMMENDED)}</div>`;
}

function render() {
  const results = isSearchMode() ? filterEvents(state.appliedFilters, state.query) : [];
  const body = isSearchMode()
    ? `<div style="margin-top:18px;">${searchResults(results, state.query)}</div>`
    : renderHomeSections();

  document.getElementById('app').innerHTML = `
    <div id="content">
      <!-- cabecera: ciudad + notificaciones -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 20px 0;">
        <div>
          <div style="display:flex;align-items:center;gap:5px;color:#9CA3AF;font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;">${SVG.pin(AC)}&nbsp;Tu ciudad</div>
          <div style="display:flex;align-items:center;gap:6px;margin-top:3px;"><span style="font-family:'Sora';font-weight:800;font-size:21px;color:#111827;letter-spacing:-.02em;">Barcelona</span>${SVG.chevDown('#111827')}</div>
        </div>
        <button style="position:relative;width:44px;height:44px;border-radius:14px;border:1px solid #EFEFF1;background:#fff;display:flex;align-items:center;justify-content:center;">${SVG.bell('#111827')}<span style="position:absolute;top:9px;right:10px;width:8px;height:8px;border-radius:50%;background:${AC};border:2px solid #fff;"></span></button>
      </div>

      ${renderSearchBar()}
      ${body}
    </div>
    ${bottomNav()}
    ${state.filtersOpen ? filterPanel(state.draftFilters) : ''}`;

  if (state.searchFocused) {
    const inp = document.querySelector('[data-search]');
    if (inp) {
      inp.focus();
      const len = inp.value.length;
      inp.setSelectionRange(len, len);
    }
  }
}

function openFilters() {
  state.draftFilters = cloneFilters(state.appliedFilters);
  state.filtersOpen = true;
  render();
}

function closeFilters() {
  state.filtersOpen = false;
  render();
}

function toggleDraftFilter(group, value) {
  const f = state.draftFilters;
  if (group === 'cat' || group === 'status') {
    f[group].has(value) ? f[group].delete(value) : f[group].add(value);
  } else {
    f[group] = value;
  }
  render();
}

// ── Interacciones (delegación de eventos a nivel documento) ──────────────────
document.addEventListener('click', e => {
  const favBtn = e.target.closest('[data-fav]');
  if (favBtn) {
    const id = favBtn.dataset.fav;
    state.fav.has(id) ? state.fav.delete(id) : state.fav.add(id);
    const faved = state.fav.has(id);
    document.querySelectorAll(`.hsvg[data-eid="${id}"]`).forEach(svg => {
      svg.setAttribute('fill',   faved ? AC : 'rgba(0,0,0,0)');
      svg.setAttribute('stroke', faved ? AC : '#ffffff');
    });
    const cnt = state.fav.size;
    const badge = document.querySelector('[data-badge]');
    if (badge) { badge.textContent = cnt; badge.style.display = cnt > 0 ? 'flex' : 'none'; }
    return;
  }

  const tabBtn = e.target.closest('[data-tab]');
  if (tabBtn) {
    state.tab = tabBtn.dataset.tab;
    document.querySelectorAll('[data-tab]').forEach(b => {
      b.classList.toggle('is-active', b.dataset.tab === state.tab);
    });
    return;
  }

  if (e.target.closest('[data-filter-open]')) {
    openFilters();
    return;
  }

  if (e.target.closest('[data-filter-close]')) {
    closeFilters();
    return;
  }

  if (e.target.closest('[data-filter-clear]')) {
    state.draftFilters = defaultFilters();
    render();
    return;
  }

  if (e.target.closest('[data-filter-apply]')) {
    state.appliedFilters = cloneFilters(state.draftFilters);
    state.filtersOpen = false;
    render();
    return;
  }

  const chip = e.target.closest('[data-filter-group]');
  if (chip) {
    toggleDraftFilter(chip.dataset.filterGroup, chip.dataset.filterValue);
  }
});

document.addEventListener('input', e => {
  if (!e.target.matches('[data-search]')) return;
  state.query = e.target.value;
  state.searchFocused = true;
  render();
});

document.addEventListener('focusin', e => {
  if (e.target.matches('[data-search]')) state.searchFocused = true;
});

document.addEventListener('focusout', e => {
  if (e.target.matches('[data-search]')) state.searchFocused = false;
});

// ── Arranque ─────────────────────────────────────────────────────────────────
render();
