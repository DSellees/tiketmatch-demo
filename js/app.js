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
  location: 'Barcelona',
  locationOpen: false,
  locationQuery: '',
  locationFocused: false,
  locationLoading: false,
  locationError: '',
};

const MAP_DEFAULT = { center: [2.1734, 41.3851], zoom: 12.2 };
const AREA_CENTER = {
  'Montjuïc': [2.1527, 41.3634],
  'Sant Martí': [2.2004, 41.4102],
  'Cornellà': [2.0706, 41.3556],
  'Poblenou': [2.2042, 41.4019],
  'Eixample': [2.1602, 41.3902],
  'El Clot': [2.1892, 41.4123],
  'Les Corts': [2.1316, 41.3871],
  'Ciutat Vella': [2.1762, 41.3827],
  'Poble-sec': [2.1618, 41.3723],
  'Pedralbes': [2.1116, 41.3906],
  'Gràcia': [2.1563, 41.4034],
};

const mapRuntime = {
  instance: null,
  eventMarkers: [],
  mainMarker: null,
  statusTimer: null,
  requestId: 0,
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

// ── Mapa (base MapLibre, misma tecnología usada por mapcn) ───────────────────
function mapStyle() {
  return {
    version: 8,
    sources: {
      osm: {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '&copy; OpenStreetMap contributors',
      },
    },
    layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
  };
}

function hideMapStatus() {
  const box = document.getElementById('map-status');
  if (!box) return;
  box.classList.remove('show');
  box.textContent = '';
}

function setMapStatus(message, timeout = 2200) {
  const box = document.getElementById('map-status');
  if (!box) return;

  if (!message) {
    hideMapStatus();
    return;
  }

  box.textContent = message;
  box.classList.add('show');

  if (mapRuntime.statusTimer) clearTimeout(mapRuntime.statusTimer);
  mapRuntime.statusTimer = null;
  if (timeout > 0) {
    mapRuntime.statusTimer = setTimeout(() => hideMapStatus(), timeout);
  }
}

function eventLngLat(event) {
  const base = AREA_CENTER[event.area] || MAP_DEFAULT.center;
  const n = Number(String(event.id).replace('e', '')) || 1;
  const lngOffset = ((n % 3) - 1) * 0.0058;
  const latOffset = (((n + 1) % 3) - 1) * 0.0046;
  return [base[0] + lngOffset, base[1] + latOffset];
}

function clearEventMarkers() {
  mapRuntime.eventMarkers.forEach(m => m.remove());
  mapRuntime.eventMarkers = [];
}

function buildEventMarkers() {
  if (!mapRuntime.instance || !window.maplibregl) return;
  clearEventMarkers();

  EVENTS.forEach(event => {
    const markerEl = document.createElement('button');
    markerEl.type = 'button';
    markerEl.style.cssText = [
      'width:18px',
      'height:18px',
      'border:none',
      'border-radius:50%',
      `background:${AC}`,
      'box-shadow:0 4px 10px rgba(17,24,39,.24)',
      'cursor:pointer',
    ].join(';');

    const popup = new maplibregl.Popup({ offset: 12 }).setHTML(
      `<div style="font-size:12px;line-height:1.35;"><strong style="font-family:'Sora',sans-serif;">${event.title}</strong><br>${event.venue} · ${event.price}</div>`
    );

    const marker = new maplibregl.Marker({ element: markerEl, anchor: 'bottom' })
      .setLngLat(eventLngLat(event))
      .setPopup(popup)
      .addTo(mapRuntime.instance);

    mapRuntime.eventMarkers.push(marker);
  });
}

function destroyMap() {
  if (mapRuntime.statusTimer) {
    clearTimeout(mapRuntime.statusTimer);
    mapRuntime.statusTimer = null;
  }
  clearEventMarkers();
  if (mapRuntime.mainMarker) {
    mapRuntime.mainMarker.remove();
    mapRuntime.mainMarker = null;
  }
  if (mapRuntime.instance) {
    mapRuntime.instance.remove();
    mapRuntime.instance = null;
  }
}

function ensureMapReady() {
  if (state.tab !== 'discover') return;
  const mount = document.getElementById('map-canvas');
  if (!mount) return;

  if (!window.maplibregl || typeof maplibregl.Map !== 'function') {
    setMapStatus('No pudimos cargar el motor del mapa.', 0);
    return;
  }

  if (mapRuntime.instance) {
    mapRuntime.instance.resize();
    return;
  }

  mapRuntime.instance = new maplibregl.Map({
    container: mount,
    style: mapStyle(),
    center: MAP_DEFAULT.center,
    zoom: MAP_DEFAULT.zoom,
    attributionControl: false,
  });

  mapRuntime.instance.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
  mapRuntime.instance.addControl(new maplibregl.AttributionControl({ compact: true }));

  mapRuntime.instance.on('load', () => {
    buildEventMarkers();
    setMapStatus(`Mostrando eventos en ${state.location}`);
  });

  mapRuntime.instance.on('error', () => {
    setMapStatus('Error al cargar el mapa. Reintenta en unos segundos.', 3200);
  });
}

async function searchPlaceOnMap(rawQuery) {
  const query = String(rawQuery || '').trim();
  if (!query) {
    setMapStatus('Escribe un lugar para buscar en el mapa.', 1800);
    return;
  }

  ensureMapReady();
  if (!mapRuntime.instance) return;

  const currentRequest = ++mapRuntime.requestId;
  setMapStatus('Buscando ubicación...', 0);

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=es&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error('geocode-failed');
    const places = await res.json();
    if (currentRequest !== mapRuntime.requestId) return;

    if (!Array.isArray(places) || !places.length) {
      setMapStatus('No encontramos ese lugar. Prueba otra búsqueda.', 2600);
      return;
    }

    const place = places[0];
    const lng = Number(place.lon);
    const lat = Number(place.lat);
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
      setMapStatus('No pudimos localizar ese punto en el mapa.', 2600);
      return;
    }

    if (!mapRuntime.mainMarker) {
      mapRuntime.mainMarker = new maplibregl.Marker({ color: AC });
    }
    mapRuntime.mainMarker.setLngLat([lng, lat]).addTo(mapRuntime.instance);
    mapRuntime.instance.flyTo({ center: [lng, lat], zoom: 14.2, speed: 0.8, essential: true });

    const label = String(place.display_name || query).split(',').slice(0, 2).join(', ');
    setMapStatus(`Resultado: ${label}`, 2400);
  } catch (_) {
    if (currentRequest !== mapRuntime.requestId) return;
    setMapStatus('No se pudo buscar ahora. Revisa la conexión e inténtalo de nuevo.', 3200);
  }
}

function useCurrentLocationOnMap() {
  if (!navigator.geolocation || !window.isSecureContext) {
    setMapStatus('La ubicación en mapa requiere https:// o localhost.', 3000);
    return;
  }

  ensureMapReady();
  if (!mapRuntime.instance) return;

  setMapStatus('Buscando tu ubicación...', 0);
  navigator.geolocation.getCurrentPosition(
    pos => {
      const lng = pos.coords.longitude;
      const lat = pos.coords.latitude;
      if (!mapRuntime.mainMarker) {
        mapRuntime.mainMarker = new maplibregl.Marker({ color: AC });
      }
      mapRuntime.mainMarker.setLngLat([lng, lat]).addTo(mapRuntime.instance);
      mapRuntime.instance.flyTo({ center: [lng, lat], zoom: 14.5, speed: 0.9, essential: true });
      setMapStatus('Ubicación actual encontrada.', 2200);
    },
    () => setMapStatus('No pudimos acceder a tu ubicación.', 2800),
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
  );
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
      <!-- Populares ahora -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:0 20px;margin:22px 0 12px;">
        <div style="font-family:'Sora';font-weight:700;font-size:19px;color:#111827;letter-spacing:-.02em;">Populares ahora</div>
        <button style="border:none;background:none;color:${AC};font-size:13px;font-weight:700;">Ver todo</button>
      </div>
      <div data-scroll style="display:flex;gap:14px;overflow-x:auto;padding:0 20px 4px;">${stdRow(POPULAR)}</div>

      <!-- Recomendado para ti -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:0 20px;margin:24px 0 12px;">
        <div style="font-family:'Sora';font-weight:700;font-size:19px;color:#111827;letter-spacing:-.02em;">Recomendado para ti</div>
        <button style="border:none;background:none;color:${AC};font-size:13px;font-weight:700;">Ver todo</button>
      </div>
      <div data-scroll style="display:flex;gap:14px;overflow-x:auto;padding:0 20px 4px;">${stdRow(RECOMMENDED)}</div>

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
          <div style="font-family:'Sora';font-weight:700;font-size:19px;color:#111827;letter-spacing:-.02em;">Trending en ${state.location}</div>
          <span style="display:inline-flex;align-items:center;gap:5px;color:${AC};font-size:10.5px;font-weight:800;background:${AS};padding:4px 9px;border-radius:999px;">TOP 5</span>
        </div>
        ${TREND.map(t => trendRow(t)).join('')}
      </div>

      <!-- Eventos cerca de ti -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:0 20px;margin:24px 0 12px;">
        <div style="font-family:'Sora';font-weight:700;font-size:19px;color:#111827;letter-spacing:-.02em;">Eventos cerca de ti</div>
        <button style="border:none;background:none;color:${AC};font-size:13px;font-weight:700;">Ver todo</button>
      </div>
      <div data-scroll style="display:flex;gap:14px;overflow-x:auto;padding:0 20px 4px;">${stdRow(NEARBY)}</div>`;
}

function render() {
  const results = isSearchMode() ? filterEvents(state.appliedFilters, state.query) : [];
  const body = isSearchMode()
    ? `<div style="margin-top:18px;">${searchResults(results, state.query)}</div>`
    : renderHomeSections();

  // pantallas modales a pantalla completa: ocultan la home y la nav por completo
  // para que nada se cuele por detrás ni quede scroll vacío en móvil.
  const modalOpen = state.filtersOpen || state.locationOpen;

  const home = `
    <div id="content">
      <!-- cabecera: ubicación pulsable + notificaciones -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 20px 0;">
        <button type="button" data-location-open aria-label="Cambiar ubicación" style="display:flex;align-items:center;gap:6px;height:44px;padding:0;border:none;background:none;">
          ${SVG.pin(AC, 18)}
          <span style="font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:16px;color:#1F2937;letter-spacing:-.01em;">${state.location}</span>
          ${SVG.chevDown('#6B7280', 17)}
        </button>
        <button style="position:relative;width:44px;height:44px;border-radius:14px;border:1px solid #EFEFF1;background:#fff;display:flex;align-items:center;justify-content:center;">${SVG.bell('#111827')}<span style="position:absolute;top:9px;right:10px;width:8px;height:8px;border-radius:50%;background:${AC};border:2px solid #fff;"></span></button>
      </div>

      ${renderSearchBar()}
      ${body}
    </div>
    ${bottomNav()}`;

  const map = `${mapTabView()}${bottomNav()}`;
  const overlays = `${state.filtersOpen ? filterPanel(state.draftFilters) : ''}${state.locationOpen ? locationPanel(state.locationQuery) : ''}`;
  const screen = modalOpen
    ? overlays
    : state.tab === 'discover'
      ? map
      : home;

  document.getElementById('app').innerHTML = screen;

  if (!modalOpen && state.tab === 'discover') {
    requestAnimationFrame(() => ensureMapReady());
  } else {
    destroyMap();
  }

  if (state.searchFocused) {
    const inp = document.querySelector('[data-search]');
    if (inp) {
      inp.focus();
      const len = inp.value.length;
      inp.setSelectionRange(len, len);
    }
  }

  if (state.locationOpen && state.locationFocused) {
    const inp = document.querySelector('[data-location-search]');
    if (inp) {
      inp.focus();
      const len = inp.value.length;
      inp.setSelectionRange(len, len);
    }
  }

  // bloquea el scroll del fondo mientras hay una pantalla modal abierta
  document.body.style.overflow = modalOpen ? 'hidden' : '';
}

function openLocation() {
  state.locationQuery = '';
  state.locationFocused = false;
  state.locationLoading = false;
  state.locationError = '';
  state.locationOpen = true;
  render();
}

function closeLocation() {
  state.locationOpen = false;
  state.locationFocused = false;
  render();
}

function pickLocation(value) {
  state.location = value;
  state.locationOpen = false;
  state.locationFocused = false;
  state.locationLoading = false;
  state.locationError = '';
  render();
}

// Geolocalización real: pide permiso y resuelve la ciudad por coordenadas
function useCurrentLocation() {
  if (!navigator.geolocation || !window.isSecureContext) {
    state.locationError = window.isSecureContext
      ? 'Tu navegador no permite geolocalización.'
      : 'La ubicación solo funciona en https:// o localhost.';
    render();
    return;
  }

  state.locationLoading = true;
  state.locationError = '';
  render();

  navigator.geolocation.getCurrentPosition(
    async pos => {
      const { latitude, longitude } = pos.coords;
      let city = '';
      try {
        const r = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=es`);
        const j = await r.json();
        city = j.city || j.locality || j.principalSubdivision || '';
      } catch (_) { /* sin red: continuamos con un nombre genérico */ }

      state.locationLoading = false;
      pickLocation(city || 'Mi ubicación');
    },
    err => {
      state.locationLoading = false;
      state.locationError = err.code === 1
        ? 'Permiso de ubicación denegado. Actívalo en los ajustes del navegador.'
        : 'No pudimos obtener tu ubicación. Inténtalo de nuevo.';
      render();
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
  );
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
    const nextTab = tabBtn.dataset.tab;
    if (nextTab !== state.tab) {
      state.tab = nextTab;
      render();
    }
    return;
  }

  const quick = e.target.closest('[data-map-quick]');
  if (quick) {
    const q = quick.dataset.mapQuick || '';
    const input = document.querySelector('[data-map-search-input]');
    if (input) input.value = q;
    searchPlaceOnMap(q);
    return;
  }

  if (e.target.closest('[data-map-current]')) {
    useCurrentLocationOnMap();
    return;
  }

  if (e.target.closest('[data-location-open]')) {
    openLocation();
    return;
  }

  if (e.target.closest('[data-location-close]')) {
    closeLocation();
    return;
  }

  if (e.target.closest('[data-location-current]')) {
    useCurrentLocation();
    return;
  }

  const locPick = e.target.closest('[data-location-pick]');
  if (locPick) {
    pickLocation(locPick.dataset.locationPick);
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

document.addEventListener('submit', e => {
  const form = e.target.closest('[data-map-search-form]');
  if (!form) return;

  e.preventDefault();
  const input = form.querySelector('[data-map-search-input]');
  searchPlaceOnMap(input ? input.value : '');
});

document.addEventListener('input', e => {
  if (e.target.matches('[data-search]')) {
    state.query = e.target.value;
    state.searchFocused = true;
    render();
    return;
  }
  if (e.target.matches('[data-location-search]')) {
    state.locationQuery = e.target.value;
    state.locationFocused = true;
    render();
  }
});

document.addEventListener('focusin', e => {
  if (e.target.matches('[data-search]')) state.searchFocused = true;
  if (e.target.matches('[data-location-search]')) state.locationFocused = true;
});

document.addEventListener('focusout', e => {
  if (e.target.matches('[data-search]')) state.searchFocused = false;
  if (e.target.matches('[data-location-search]')) state.locationFocused = false;
});

window.addEventListener('resize', () => {
  if (mapRuntime.instance) mapRuntime.instance.resize();
});

// ── Arranque ─────────────────────────────────────────────────────────────────
render();
