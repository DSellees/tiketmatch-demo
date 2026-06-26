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
  mapCat: new Set(),   // categorías activas en el filtro del mapa (vacío = todas)
  mapSelected: null,   // id del evento seleccionado (bottom sheet abierto)
  ticketDetail: null,  // id del evento cuya entrada se muestra en pantalla completa
  eventDetail: null,   // id del evento cuyo detalle previo a la compra se muestra
  descExpanded: false, // descripción del detalle de evento expandida ("Leer más")
  purchaseFlow: null,       // null | 'seats' | 'summary' | 'payment' | 'processing' | 'success'
  purchaseEventId: null,    // id del evento en proceso de compra
  purchaseSeat: null,       // butaca seleccionada (ej: 'B4')
  purchasedTickets: [],     // ids de eventos comprados en esta sesión
  qrFullscreen: false, // QR expandido a pantalla completa sobre fondo negro
  userLocation: null,  // { lat, lng } — ubicación actual del usuario (solicitada una sola vez)
  // ── Perfil ──
  profilePanel: null,
  profileName: 'MPV Demo',
  profileAvatar: 'assets/user/mpv_ic.png',
  profileEditingName: false,
  profileNotifs: { events: true, offers: true, reminders: true },
  profileRating: 0,
  profileRatingDone: false,
  profileCats: new Set(['concert', 'festival']),
  profileLang: 'Español',
  profileContactSent: false,
  profileFaqOpen: new Set(),
  // ── Notificaciones ──
  notificationsOpen: false,
  notificationsQuery: '',
  notificationsSearchOpen: false,
  notificationsSearchFocused: false,
  notificationsRead: new Set(),
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
  eventMarkers: [],       // marcadores DOM de cada evento (con su mini-card)
  mainMarker: null,
  userLocationMarker: null, // marcador azul pulsante de la ubicación del usuario
  statusTimer: null,
  requestId: 0,
  collisionRaf: null,     // rAF que agrupa el recálculo de colisiones al mover el mapa
};

const detailMapRuntime = {
  instance: null,
  marker: null,
  eventId: null,
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
      basemap: {
        type: 'raster',
        tiles: [
          'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
          'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
          'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
          'https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        ],
        tileSize: 256,
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      },
    },
    layers: [{ id: 'basemap', type: 'raster', source: 'basemap' }],
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
  let lng = event.lng;
  let lat = event.lat;

  if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
    const base = AREA_CENTER[event.area] || MAP_DEFAULT.center;
    lng = base[0];
    lat = base[1];
  }

  // Dispersión determinista basada en el ID del evento para evitar solapes en el mapa
  // (por ejemplo, Spotify Camp Nou y Palau Blaugrana comparten coordenadas exactas)
  const n = Number(String(event.id).replace('e', '')) || 1;
  const angle = (n * 137.5) * Math.PI / 180; // Distribución por ángulo de oro
  const radius = 0.0003; // ~30 metros en grados de coordenada
  
  return [lng + Math.cos(angle) * radius, lat + Math.sin(angle) * radius];
}

function clearEventMarkers() {
  mapRuntime.eventMarkers.forEach(rec => rec.marker.remove());
  mapRuntime.eventMarkers = [];
}

// ¿Pasa el evento el filtro de categoría activo del mapa?
function mapEventVisible(event) {
  return state.mapCat.size === 0 || state.mapCat.has(event.cat);
}

// Prioridad de la card al resolver solapes (menor = se dibuja antes / gana sitio).
// Los populares y los de "últimas entradas" tienen preferencia.
function mapPriority(event) {
  const popular = POPULAR.includes(event.id) ? 0 : 1;
  const urgent = event.status === 'last' ? 0 : 1;
  const idNum = Number(String(event.id).replace('e', '')) || 99;
  return popular * 1000 + urgent * 100 + idNum;
}

function rectsIntersect(a, b) {
  return a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t;
}

// Construye cada marcador como punto grande + mini-card anclada encima.
function buildEventMarkers() {
  if (!mapRuntime.instance || !window.maplibregl) return;
  clearEventMarkers();

  EVENTS.forEach(event => {
    const root = document.createElement('div');
    root.className = 'ev-marker';
    root.dataset.eid = event.id;
    root.innerHTML = mapMarkerMarkup(event);
    root.addEventListener('click', ev => {
      ev.stopPropagation();
      selectMapEvent(event.id);
    });

    const marker = new maplibregl.Marker({ element: root, anchor: 'center' })
      .setLngLat(eventLngLat(event))
      .addTo(mapRuntime.instance);

    mapRuntime.eventMarkers.push({
      event,
      marker,
      root,
      lngLat: eventLngLat(event),
      cw: 0,
      ch: 0,
    });
  });

  applyMapFilter();
  // medimos las cards en el siguiente frame (ya con layout) y de nuevo al cargar
  // las fuentes, porque su ancho depende del título renderizado.
  requestAnimationFrame(() => { measureMarkerCards(); updateMarkerCollisions(); });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { measureMarkerCards(); updateMarkerCollisions(); });
  }
}

// Cachea el tamaño real de cada mini-card (para el cálculo de solapes).
function measureMarkerCards() {
  mapRuntime.eventMarkers.forEach(rec => {
    const card = rec.root.querySelector('.ev-card');
    if (card && card.offsetWidth) {
      rec.cw = card.offsetWidth;
      rec.ch = card.offsetHeight;
    }
  });
}

// Aplica el filtro de categoría: oculta los marcadores que no pasan y recalcula.
function applyMapFilter() {
  mapRuntime.eventMarkers.forEach(rec => {
    rec.root.style.display = mapEventVisible(rec.event) ? '' : 'none';
  });
  if (state.mapSelected && !mapEventVisible(EV[state.mapSelected])) {
    deselectMapEvent(false);
  }
  updateMarkerCollisions();
}

function scheduleCollisions() {
  if (mapRuntime.collisionRaf) return;
  mapRuntime.collisionRaf = requestAnimationFrame(() => {
    mapRuntime.collisionRaf = null;
    updateMarkerCollisions();
  });
}

// Decide qué mini-cards se muestran sin pisarse. Las que colisionan se colapsan
// a su punto; al hacer zoom se separan y vuelven a aparecer.
function updateMarkerCollisions() {
  const map = mapRuntime.instance;
  const canvas = document.getElementById('map-canvas');
  if (!map || !canvas) return;

  const mapRect = canvas.getBoundingClientRect();
  const toLocal = el => {
    const r = el.getBoundingClientRect();
    return { l: r.left - mapRect.left, t: r.top - mapRect.top, r: r.right - mapRect.left, b: r.bottom - mapRect.top };
  };

  // zonas reservadas: buscador + chips arriba y, si está abierto, el bottom sheet.
  const obstacles = [];
  const top = document.getElementById('map-overlay-top');
  if (top) { const o = toLocal(top); obstacles.push({ l: -50, t: -50, r: mapRect.width + 50, b: o.b + 8 }); }
  const preview = document.getElementById('map-preview');
  if (preview && preview.classList.contains('show')) {
    const o = toLocal(preview);
    obstacles.push({ l: o.l - 8, t: o.t - 8, r: o.r + 8, b: mapRect.height + 50 });
  }

  const placed = obstacles.slice();

  const recs = mapRuntime.eventMarkers
    .filter(rec => mapEventVisible(rec.event))
    .map(rec => {
      const p = map.project(rec.lngLat);
      return { rec, x: p.x, y: p.y };
    })
    .sort((a, b) => {
      const sa = state.mapSelected === a.rec.event.id ? 0 : 1;
      const sb = state.mapSelected === b.rec.event.id ? 0 : 1;
      if (sa !== sb) return sa - sb;               // el seleccionado primero
      return mapPriority(a.rec.event) - mapPriority(b.rec.event);
    });

  recs.forEach(({ rec, x, y }) => {
    const cw = rec.cw || 150;
    const ch = rec.ch || 46;
    const half = cw / 2;
    const bottom = y - 16;                          // hueco entre punto y card

    // mantenemos la card dentro del ancho desplazándola; la cola sigue apuntando
    // al punto (en vez de recortarse contra el borde, se "ancla" al lateral).
    let center = x;
    const minC = 6 + half;
    const maxC = mapRect.width - 6 - half;
    if (maxC >= minC) center = Math.min(Math.max(x, minC), maxC);
    const shift = center - x;

    const box = { l: center - half - 5, t: bottom - ch - 5, r: center + half + 5, b: bottom + 5 };
    const onScreen = x > -60 && x < mapRect.width + 60 && y > -60 && y < mapRect.height + 60;
    const selected = state.mapSelected === rec.event.id;

    const show = onScreen && (selected || !placed.some(p => rectsIntersect(p, box)));
    if (show) {
      placed.push(box);
      rec.root.style.setProperty('--shift', shift.toFixed(1) + 'px');
    }

    rec.root.classList.toggle('show-card', show);
    rec.root.style.zIndex = selected ? 40 : (show ? 12 : 2);
  });
}

// ── Selección de un evento en el mapa (carrusel de detalle) ──────────────────

// Distancia (en grados²; suficiente para ordenar en escala de ciudad).
function eventDistanceSq(a, b) {
  const [ax, ay] = eventLngLat(a);
  const [bx, by] = eventLngLat(b);
  return (ax - bx) ** 2 + (ay - by) ** 2;
}

// Eventos visibles (pasan el filtro) ordenados por cercanía a un evento ancla.
function visibleEventsByDistance(anchorId) {
  const anchor = EV[anchorId];
  return EVENTS
    .filter(mapEventVisible)
    .map(ev => ({ ev, d: eventDistanceSq(anchor, ev) }))
    .sort((a, b) => a.d - b.d)
    .map(o => o.ev);
}

// El evento visible más cercano a un punto del mapa (centro por defecto).
function nearestVisibleEvent(refLngLat) {
  const visible = EVENTS.filter(mapEventVisible);
  if (!visible.length) return null;
  let best = null, bd = Infinity;
  visible.forEach(ev => {
    const [x, y] = eventLngLat(ev);
    const d = (x - refLngLat[0]) ** 2 + (y - refLngLat[1]) ** 2;
    if (d < bd) { bd = d; best = ev; }
  });
  return best;
}

// Resalta el marcador y la card activos sin reconstruir el carrusel.
function highlightMapSelection(id) {
  mapRuntime.eventMarkers.forEach(rec => rec.root.classList.toggle('is-selected', rec.event.id === id));
  const track = document.querySelector('[data-map-track]');
  if (track) {
    track.querySelectorAll('.map-preview-card').forEach(card => {
      card.classList.toggle('is-active', card.dataset.eid === id);
    });
  }
}

function flyToEvent(id, opts = {}) {
  const rec = mapRuntime.eventMarkers.find(r => r.event.id === id);
  if (!rec || !mapRuntime.instance) return;
  mapRuntime.instance.flyTo({
    center: rec.lngLat,
    zoom: Math.max(mapRuntime.instance.getZoom(), 13.4),
    speed: 0.7,
    offset: [0, -70],   // levanta el punto por encima del carrusel
    essential: true,
    ...opts,
  });
}

// Card centrada en el carrusel en este instante.
function centeredPreviewCardId(track) {
  const center = track.scrollLeft + track.clientWidth / 2;
  let best = null, bd = Infinity;
  [...track.children].forEach(card => {
    const cc = card.offsetLeft + card.offsetWidth / 2;
    const d = Math.abs(cc - center);
    if (d < bd) { bd = d; best = card; }
  });
  return best && best.dataset.eid;
}

// Sincroniza selección + mapa SOLO cuando el scroll ya se ha asentado en una
// card (scrollend). El flyTo nunca corre mientras se arrastra, para no frenar.
function attachPreviewScroll(track) {
  const settle = () => {
    const id = centeredPreviewCardId(track);
    if (!id || id === state.mapSelected) return;
    state.mapSelected = id;
    highlightMapSelection(id);
    updateMarkerCollisions();
    flyToEvent(id);
  };

  if ('onscrollend' in window) {
    track.addEventListener('scrollend', settle, { passive: true });
  } else {
    // Fallback: esperamos a que el scroll se detenga del todo antes de mover el mapa.
    let timer = null;
    track.addEventListener('scroll', () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(settle, 160);
    }, { passive: true });
  }
}

// Construye el carrusel de cards (ancla primero) y lo deja centrado en `id`.
function renderMapPreview(id) {
  const box = document.getElementById('map-preview');
  if (!box) return;
  const list = visibleEventsByDistance(id);
  box.innerHTML = `<div class="map-preview-track" data-map-track>${list.map(e => mapPreviewCard(e)).join('')}</div>`;
  const track = box.querySelector('[data-map-track]');
  track.scrollLeft = 0;            // el ancla es el primero → queda centrado
  attachPreviewScroll(track);
  requestAnimationFrame(() => {
    box.classList.add('show');
    highlightMapSelection(id);
  });
}

// Selección desde marcador o filtro → reconstruye el carrusel anclado en `id`.
function selectMapEvent(id) {
  if (!EV[id]) return;
  state.mapSelected = id;
  highlightMapSelection(id);
  renderMapPreview(id);
  flyToEvent(id);
  requestAnimationFrame(() => updateMarkerCollisions());
}

function deselectMapEvent(recompute = true) {
  state.mapSelected = null;
  mapRuntime.eventMarkers.forEach(rec => rec.root.classList.remove('is-selected'));
  const box = document.getElementById('map-preview');
  if (box) { box.classList.remove('show'); box.innerHTML = ''; }
  if (recompute) updateMarkerCollisions();
}

function destroyMap() {
  if (mapRuntime.statusTimer) {
    clearTimeout(mapRuntime.statusTimer);
    mapRuntime.statusTimer = null;
  }
  if (mapRuntime.collisionRaf) {
    cancelAnimationFrame(mapRuntime.collisionRaf);
    mapRuntime.collisionRaf = null;
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
  state.mapSelected = null;   // el bottom sheet no sobrevive al salir del mapa
}

function destroyDetailMap() {
  if (detailMapRuntime.marker) {
    detailMapRuntime.marker.remove();
    detailMapRuntime.marker = null;
  }
  if (detailMapRuntime.instance) {
    detailMapRuntime.instance.remove();
    detailMapRuntime.instance = null;
  }
  detailMapRuntime.eventId = null;
}

function ensureDetailMapReady() {
  if (!state.eventDetail) return;
  const e = EV[state.eventDetail];
  if (!e) return;

  const mount = document.getElementById('event-detail-map');
  if (!mount) return;

  if (!window.maplibregl || typeof maplibregl.Map !== 'function') return;

  if (detailMapRuntime.instance && detailMapRuntime.eventId === e.id) {
    detailMapRuntime.instance.resize();
    return;
  }

  destroyDetailMap();

  const lngLat = eventLngLat(e);
  detailMapRuntime.eventId = e.id;
  detailMapRuntime.instance = new maplibregl.Map({
    container: mount,
    style: mapStyle(),
    center: lngLat,
    zoom: 13.4,
    cooperativeGestures: true,
    attributionControl: false,
  });

  detailMapRuntime.instance.addControl(new maplibregl.AttributionControl({ compact: true }));

  detailMapRuntime.instance.on('load', () => {
    if (!detailMapRuntime.instance) return;

    const root = document.createElement('div');
    root.className = 'ev-marker';
    root.innerHTML = '<span class="ev-dot"></span>';

    detailMapRuntime.marker = new maplibregl.Marker({ element: root, anchor: 'center' })
      .setLngLat(lngLat)
      .addTo(detailMapRuntime.instance);

    detailMapRuntime.instance.resize();
  });
}

// ── Solicita geolocalización del usuario (una sola vez, reutilizable en toda la app) ────
function requestUserLocation() {
  if (!navigator.geolocation || !window.isSecureContext) {
    return;
  }

  if (state.userLocation) {
    return;
  }

  navigator.geolocation.getCurrentPosition(
    pos => {
      state.userLocation = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      };
      if (state.tab === 'home') render();
    },
    () => {},
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
  );
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
    // Si ya estamos en el mapa, solicita la ubicación del usuario
    requestUserLocation();
    if (state.userLocation) {
      addUserLocationMarker();
    }
    return;
  }

  mapRuntime.instance = new maplibregl.Map({
    container: mount,
    style: mapStyle(),
    center: MAP_DEFAULT.center,
    zoom: MAP_DEFAULT.zoom,
    attributionControl: false,
  });

  mapRuntime.instance.addControl(new maplibregl.AttributionControl({ compact: true }));

  mapRuntime.instance.on('load', () => {
    requestUserLocation();
    buildEventMarkers();
    // Si la ubicación ya se obtuvo, añade el marcador
    if (state.userLocation) {
      addUserLocationMarker();
    }
  });

  // recalcula qué cards caben mientras se mueve/zoom el mapa
  mapRuntime.instance.on('move', scheduleCollisions);
  mapRuntime.instance.on('zoom', scheduleCollisions);
  mapRuntime.instance.on('resize', scheduleCollisions);

  // tocar el fondo del mapa cierra el bottom sheet
  mapRuntime.instance.on('click', () => deselectMapEvent());
}

// ── Añade un marcador azul pulsante en la ubicación del usuario ────
function addUserLocationMarker() {
  if (!mapRuntime.instance || !state.userLocation) return;

  const el = document.createElement('div');
  el.style.width = '24px';
  el.style.height = '24px';
  el.style.borderRadius = '50%';
  el.style.background = '#3B82F6';
  el.style.border = '3px solid #fff';
  el.style.animation = 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite';

  if (!document.getElementById('pulse-animation')) {
    const style = document.createElement('style');
    style.id = 'pulse-animation';
    style.innerHTML = `@keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.75; transform: scale(1.08); }
    }`;
    document.head.appendChild(style);
  }

  if (mapRuntime.userLocationMarker) {
    mapRuntime.userLocationMarker.remove();
  }

  mapRuntime.userLocationMarker = new maplibregl.Marker({ element: el })
    .setLngLat([state.userLocation.lng, state.userLocation.lat])
    .addTo(mapRuntime.instance);
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
    <div class="pill-surface" style="display:flex;align-items:center;gap:10px;height:50px;padding:0 5px 0 16px;">
      ${SVG.search('#9CA3AF')}
      <input data-search type="search" enterkeyhint="search" placeholder="Busca conciertos, deporte, planes…" value="${state.query.replace(/"/g, '&quot;')}" style="flex:1;border:none;outline:none;background:transparent;color:#111827;font-size:14.5px;font-weight:500;font-family:inherit;">
      <button type="button" data-filter-open class="pill-icon-btn pill-icon-btn--accent" style="position:relative;width:40px;height:40px;">
        ${SVG.sliders('#fff')}
        ${active ? `<span style="position:absolute;top:-3px;right:-3px;width:18px;height:18px;border-radius:50%;background:#111827;color:#fff;font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center;line-height:1;box-sizing:border-box;border:2px solid #fff;padding:0;">${active}</span>` : ''}
      </button>
    </div>
  </div>`;
}

function renderHomeSections() {
  const rendered = new Set();
  const getUnique = (list, limit = 6) => {
    const result = [];
    for (const id of list) {
      if (!rendered.has(id)) {
        result.push(id);
        rendered.add(id);
        if (limit && result.length >= limit) break;
      }
    }
    return result;
  };

  const shownOportunos = getUnique(OPORTUNOS, 6);
  const shownRecommended = getUnique(RECOMMENDED, 6);
  const shownPremium = PREMIUM; // sección destacada muestra siempre sus eventos fijos

  // Calcular dinámicamente los eventos más cercanos a la ubicación del usuario,
  // permitiendo duplicados para evitar que la sección geográfica se muestre vacía.
  const ref = state.userLocation || AREA_COORDS[state.location] || AREA_COORDS.Barcelona;
  const eventsWithDistance = EVENTS.map(e => {
    const km = haversineDistance(ref.lat, ref.lng, e.lat, e.lng);
    return { id: e.id, km };
  });
  eventsWithDistance.sort((a, b) => a.km - b.km);
  const shownNearby = eventsWithDistance.slice(0, 6).map(item => item.id);

  const stdRow  = ids => ids.map(id => `<div style="flex:0 0 auto;width:278px;">${cardStd(EV[id])}</div>`).join('');
  const editRow = ids => ids.map(id => `<div style="flex:0 0 auto;width:240px;">${cardEdit(EV[id])}</div>`).join('');

  return `
      <!-- Oportunidades Catchtime (<24 h) -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:0 20px;margin:22px 0 12px;">
        <div style="font-family:'Sora';font-weight:700;font-size:19px;color:#111827;letter-spacing:-.02em;">Oportunidades Catchtime</div>
        <span style="display:inline-flex;align-items:center;gap:5px;color:${AC};font-size:10.5px;font-weight:800;background:${AS};padding:4px 9px;border-radius:999px;">&lt;24 H</span>
      </div>
      <div data-scroll style="display:flex;gap:14px;overflow-x:auto;padding:0 20px 4px;">${stdRow(shownOportunos)}</div>

      <!-- Recomendado para ti -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:0 20px;margin:24px 0 12px;">
        <div style="font-family:'Sora';font-weight:700;font-size:19px;color:#111827;letter-spacing:-.02em;">Recomendado para ti</div>
        <button style="border:none;background:none;color:${AC};font-size:13px;font-weight:700;">Ver todo</button>
      </div>
      <div data-scroll style="display:flex;gap:14px;overflow-x:auto;padding:0 20px 4px;">${stdRow(shownRecommended)}</div>

      <!-- Banda destacada (deporte) -->
      <div style="margin:26px 0 6px;background:#111827;padding:22px 0 24px;">
        <div style="padding:0 20px;">
          <div style="display:inline-flex;align-items:center;gap:6px;background:${AS};color:${AC};font-size:10.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;padding:5px 11px;border-radius:999px;">Destacado · Deporte</div>
          <div style="color:rgba(255,255,255,.78);font-size:15px;font-weight:600;margin-top:12px;line-height:1.45;max-width:320px;">Los partidos más esperados de la ciudad, con venta oficial dentro de Catchtime.</div>
        </div>
        <div data-scroll style="display:flex;gap:14px;overflow-x:auto;padding:16px 20px 2px;">${editRow(shownPremium)}</div>
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
      <div data-scroll style="display:flex;gap:14px;overflow-x:auto;padding:0 20px 4px;">${stdRow(shownNearby)}</div>`;
}

// ── Simulación en vivo del precio en el detalle de evento ────────────────────
let priceAnimTimer = null;
function stopPriceAnim() {
  if (priceAnimTimer) { clearInterval(priceAnimTimer); priceAnimTimer = null; }
}
function startPriceAnim(id) {
  stopPriceAnim();
  const svg = document.getElementById('pc-svg-' + id);
  if (!svg) return;

  const init = +svg.dataset.init;
  const base = +svg.dataset.cur;
  const floor = Math.round(init * 0.30);  // nunca por debajo del 30% del precio inicial
  const ceiling = base;                   // no sube por encima del precio actual
  let cur = base;
  let ticksSinceRepunte = 0;

  const priceEl = document.getElementById('pc-price-' + id);
  const saveEl  = document.getElementById('pc-save-' + id);

  function paint() {
    if (priceEl) priceEl.textContent = '€' + cur;
    if (saveEl)  saveEl.textContent = 'Ahorras €' + Math.max(0, init - cur);
  }

  priceAnimTimer = setInterval(() => {
    ticksSinceRepunte++;
    let next;
    // Repunte ocasional: cada 5-9 ticks, sube 4-9€ de golpe
    const isRepunte = ticksSinceRepunte >= 5 && Math.random() < 0.28;
    if (isRepunte) {
      const bounce = Math.round(4 + Math.random() * 5);
      next = Math.min(cur + bounce, ceiling);
      ticksSinceRepunte = 0;
    } else {
      // Tendencia bajista: 72% baja, 28% sube; pasos de 1-3€
      const dir = Math.random() < 0.72 ? -1 : 1;
      const mag = 1 + Math.floor(Math.random() * 3);
      next = cur + dir * mag;
    }
    next = Math.max(floor, Math.min(ceiling, next));
    cur = next;
    paint();
  }, 5000);
}

function render() {
  destroyDetailMap();

  const results = isSearchMode() ? filterEvents(state.appliedFilters, state.query) : [];
  const body = isSearchMode()
    ? `<div style="margin-top:18px;">${searchResults(results, state.query)}</div>`
    : renderHomeSections();

  // pantallas modales a pantalla completa: ocultan la home y la nav por completo
  // para que nada se cuele por detrás ni quede scroll vacío en móvil.
  const modalOpen = state.filtersOpen || state.locationOpen;
  const notificationsOpen = state.notificationsOpen;

  const home = `
    <div id="content">
      ${homeUserHeader()}
      ${renderSearchBar()}
      ${body}
    </div>`;

  const map       = mapTabView();
  const favorites = favoritesTabView();
  const tickets   = ticketsTabView();
  const profile   = `${profileTabView()}${state.profilePanel ? profilePanelView() : ''}`;
  const overlays  = `${state.filtersOpen ? filterPanel(state.draftFilters) : ''}${state.locationOpen ? locationPanel(state.locationQuery) : ''}`;
  const purchaseOpen      = !!state.purchaseFlow;
  const ticketDetailOpen  = !!state.ticketDetail;   // se abre desde la pestaña Entradas
  const eventDetailOpen   = !!state.eventDetail;     // detalle de evento previo a la compra (cards, mapa, trending…)
  const profilePanelOpen  = state.tab === 'profile' && !!state.profilePanel;
  const screen = notificationsOpen
    ? notificationsScreenView()
    : modalOpen
    ? overlays
    : purchaseOpen
      ? purchaseFlowView()
      : eventDetailOpen
        ? eventDetailView()
        : ticketDetailOpen
        ? ticketDetailView()
        : state.tab === 'discover'
        ? map
        : state.tab === 'favorites'
          ? favorites
          : state.tab === 'tickets'
            ? tickets
            : state.tab === 'profile'
              ? profile
              : home;

  document.getElementById('app').innerHTML = screen;

  const navSlot = document.getElementById('nav-slot');
  const showNav = !modalOpen && !notificationsOpen && !purchaseOpen && !ticketDetailOpen && !eventDetailOpen && !profilePanelOpen;
  if (navSlot) {
    navSlot.innerHTML = showNav ? bottomNav() : '';
    navSlot.setAttribute('aria-hidden', showNav ? 'false' : 'true');
  }

  if (!modalOpen && !eventDetailOpen && state.tab === 'discover') {
    requestAnimationFrame(() => ensureMapReady());
  } else {
    destroyMap();
  }

  // Simulación en vivo del precio y mini-mapa del detalle de evento.
  if (eventDetailOpen) {
    startPriceAnim(state.eventDetail);                       // los elementos ya existen
    requestAnimationFrame(() => ensureDetailMapReady());     // el mapa necesita layout
  } else {
    stopPriceAnim();
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

  if (state.profileEditingName) {
    const inp = document.querySelector('[data-profile-name-input]');
    if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
  }

  if (notificationsOpen && state.notificationsSearchFocused) {
    const inp = document.querySelector('[data-notifications-search]');
    if (inp) {
      inp.focus();
      const len = inp.value.length;
      inp.setSelectionRange(len, len);
    }
  }

  // bloquea el scroll del fondo mientras hay una pantalla modal abierta
  document.body.style.overflow = (modalOpen || purchaseOpen || ticketDetailOpen || profilePanelOpen || notificationsOpen) ? 'hidden' : '';

  // Auto-avanza de "processing" a "success" tras simular el pago
  if (state.purchaseFlow === 'processing') {
    setTimeout(() => {
      if (!Array.isArray(state.purchasedTickets)) state.purchasedTickets = [];
      if (state.purchaseEventId && !state.purchasedTickets.includes(state.purchaseEventId)) {
        state.purchasedTickets.push(state.purchaseEventId);
      }
      state.purchaseFlow = 'success';
      render();
    }, 2200);
  }

  syncEventUrl();
}

// ── Compartir evento (Web Share API + enlace directo) ────────────────────────
function eventShareUrl(eventId) {
  const url = new URL(window.location.href);
  url.searchParams.set('event', eventId);
  url.hash = '';
  return url.toString();
}

function syncEventUrl() {
  const url = new URL(window.location.href);
  if (state.eventDetail && EV[state.eventDetail]) {
    url.searchParams.set('event', state.eventDetail);
  } else {
    url.searchParams.delete('event');
  }
  const next = url.pathname + url.search + url.hash;
  if (window.location.pathname + window.location.search + window.location.hash !== next) {
    history.replaceState(null, '', next);
  }
}

function readEventFromUrl() {
  const id = new URLSearchParams(window.location.search).get('event');
  if (id && EV[id]) {
    state.eventDetail = id;
    state.descExpanded = false;
  }
}

async function copyEventLink(eventId) {
  const url = eventShareUrl(eventId);
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(url);
      flashToast('Enlace copiado al portapapeles');
      return;
    }
  } catch (_) {}
  flashToast(url);
}

async function shareEvent(eventId) {
  const e = EV[eventId];
  if (!e) return;

  const h = cardHeadlines(dec(e));
  const url = eventShareUrl(eventId);
  const payload = {
    title: `${h.title} · Catchtime`,
    text: `${h.title} — ${e.dateShort} · ${e.time} · ${e.venue}`,
    url,
  };

  if (navigator.share) {
    try {
      await navigator.share(payload);
      return;
    } catch (err) {
      if (err && err.name === 'AbortError') return;
    }
  }

  await copyEventLink(eventId);
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
      state.userLocation = { lat: latitude, lng: longitude };
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

function closeNotifications() {
  state.notificationsOpen = false;
  state.notificationsSearchFocused = false;
  render();
}

function openNotifications() {
  state.notificationsOpen = true;
  render();
}

function markNotifRead(id) {
  if (id) state.notificationsRead.add(id);
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
// Toast efímero (demo): aviso inferior que desaparece solo.
let toastTimer = null;
function flashToast(text) {
  let el = document.getElementById('app-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'app-toast';
    el.style.cssText = 'position:fixed;left:50%;bottom:calc(28px + env(safe-area-inset-bottom));transform:translateX(-50%) translateY(8px);z-index:60;background:#1A1A1A;color:#fff;font-family:\'Plus Jakarta Sans\',sans-serif;font-size:13.5px;font-weight:600;padding:13px 20px;border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,.28);opacity:0;transition:opacity .2s ease,transform .2s ease;max-width:88%;text-align:center;pointer-events:none;';
    document.body.appendChild(el);
  }
  el.textContent = text;
  requestAnimationFrame(() => {
    el.style.opacity = '1';
    el.style.transform = 'translateX(-50%) translateY(0)';
  });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(-50%) translateY(8px)';
  }, 2200);
}

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
    return;
  }

  const tabBtn = e.target.closest('[data-tab]');
  if (tabBtn) {
    const nextTab = tabBtn.dataset.tab;
    if (nextTab !== state.tab) {
      state.tab = nextTab;
      state.profilePanel = null;
      state.profileEditingName = false;
      state.ticketDetail = null;
      state.eventDetail = null;
      state.qrFullscreen = false;
      render();
    }
    return;
  }

  // ── Detalle de evento (previo a la compra) ──────────────────────────────────
  const eventOpenBtn = e.target.closest('[data-event-open]');
  if (eventOpenBtn) {
    state.eventDetail = eventOpenBtn.dataset.eventOpen;
    state.descExpanded = false;
    window.scrollTo(0, 0);
    render();
    return;
  }

  if (e.target.closest('[data-event-close]')) {
    state.eventDetail = null;
    state.descExpanded = false;
    render();
    return;
  }

  if (e.target.closest('[data-desc-toggle]')) {
    state.descExpanded = !state.descExpanded;
    render();
    return;
  }

  const eventBuyBtn = e.target.closest('[data-event-buy]');
  if (eventBuyBtn) {
    state.purchaseFlow = 'seats';
    state.purchaseEventId = eventBuyBtn.dataset.eventBuy || state.eventDetail;
    state.purchaseSeat = null;
    render();
    return;
  }

  // ── Flujo de compra ─────────────────────────────────────────────────────────
  const seatBtn = e.target.closest('[data-seat-pick]');
  if (seatBtn) {
    state.purchaseSeat = seatBtn.dataset.seatPick;
    render();
    return;
  }

  if (e.target.closest('[data-purchase-next]')) {
    if (state.purchaseFlow === 'seats') state.purchaseFlow = 'summary';
    else if (state.purchaseFlow === 'summary') state.purchaseFlow = 'payment';
    render();
    return;
  }

  if (e.target.closest('[data-purchase-back]')) {
    if (state.purchaseFlow === 'seats') { state.purchaseFlow = null; state.purchaseEventId = null; }
    else if (state.purchaseFlow === 'summary') state.purchaseFlow = 'seats';
    else if (state.purchaseFlow === 'payment') state.purchaseFlow = 'summary';
    render();
    return;
  }

  if (e.target.closest('[data-purchase-pay]')) {
    state.purchaseFlow = 'processing';
    render();
    return;
  }

  if (e.target.closest('[data-purchase-view-ticket]')) {
    const eid = state.purchaseEventId;
    state.purchaseFlow = null;
    state.purchaseEventId = null;
    state.eventDetail = null;
    state.tab = 'tickets';
    state.ticketDetail = eid;
    render();
    return;
  }

  if (e.target.closest('[data-purchase-done]')) {
    state.purchaseFlow = null;
    state.purchaseEventId = null;
    state.eventDetail = null;
    state.tab = 'home';
    render();
    return;
  }

  const eventNotifyBtn = e.target.closest('[data-event-notify]');
  if (eventNotifyBtn) {
    flashToast('Te avisaremos cuando salgan a la venta');
    return;
  }

  if (e.target.closest('[data-event-share]')) {
    const shareBtn = e.target.closest('[data-event-share]');
    const id = shareBtn?.dataset.eventShare || state.eventDetail;
    if (id) shareEvent(id);
    return;
  }

  // ── Entradas: detalle ────────────────────────────────────────────────────────
  const ticketOpenBtn = e.target.closest('[data-ticket-open]');
  if (ticketOpenBtn) {
    state.ticketDetail = ticketOpenBtn.dataset.ticketOpen;
    render();
    return;
  }

  if (e.target.closest('[data-ticket-close]')) {
    state.ticketDetail = null;
    state.qrFullscreen = false;
    render();
    return;
  }

  if (e.target.closest('[data-qr-open]')) {
    state.qrFullscreen = true;
    render();
    return;
  }

  if (e.target.closest('[data-qr-close]')) {
    state.qrFullscreen = false;
    render();
    return;
  }

  const mapsBtn = e.target.closest('[data-ticket-maps]');
  if (mapsBtn) {
    window.open('https://maps.google.com/maps?q=' + mapsBtn.dataset.ticketMaps, '_blank');
    return;
  }

  const calBtn = e.target.closest('[data-ticket-cal]');
  if (calBtn) {
    window.open(decodeURIComponent(calBtn.dataset.ticketCal), '_blank');
    return;
  }

  // ── Notificaciones ───────────────────────────────────────────────────────────
  if (e.target.closest('[data-notifications-open]')) {
    openNotifications();
    return;
  }

  if (e.target.closest('[data-notifications-close]')) {
    closeNotifications();
    return;
  }

  if (e.target.closest('[data-notifications-search-toggle]')) {
    state.notificationsSearchOpen = !state.notificationsSearchOpen;
    if (!state.notificationsSearchOpen) state.notificationsQuery = '';
    state.notificationsSearchFocused = state.notificationsSearchOpen;
    render();
    return;
  }

  const notifCard = e.target.closest('[data-notif-id]');
  if (notifCard) {
    const n = NOTIFICATIONS.find(x => x.id === notifCard.dataset.notifId);
    markNotifRead(notifCard.dataset.notifId);
    state.notificationsOpen = false;
    if (n && n.eventId) {
      state.tab = 'home';
      state.query = EV[n.eventId].title;
      state.appliedFilters = defaultFilters();
      state.searchFocused = true;
    }
    render();
    return;
  }

  // ── Perfil: sub-paneles ──────────────────────────────────────────────────────
  const profilePanelBtn = e.target.closest('[data-profile-panel]');
  if (profilePanelBtn) {
    state.profilePanel = profilePanelBtn.dataset.profilePanel;
    render();
    return;
  }

  if (e.target.closest('[data-profile-back]')) {
    state.profilePanel = null;
    render();
    return;
  }

  if (e.target.closest('[data-profile-name-tap]')) {
    state.profileEditingName = true;
    render();
    return;
  }

  if (e.target.closest('[data-profile-open-location]')) {
    openLocation();
    return;
  }

  const notifToggle = e.target.closest('[data-notif-toggle]');
  if (notifToggle) {
    const key = notifToggle.dataset.notifToggle;
    state.profileNotifs[key] = !state.profileNotifs[key];
    render();
    return;
  }

  const faqToggle = e.target.closest('[data-faq-toggle]');
  if (faqToggle) {
    const i = Number(faqToggle.dataset.faqToggle);
    state.profileFaqOpen.has(i) ? state.profileFaqOpen.delete(i) : state.profileFaqOpen.add(i);
    render();
    return;
  }

  const langPick = e.target.closest('[data-lang-pick]');
  if (langPick) {
    state.profileLang = langPick.dataset.langPick;
    state.profilePanel = null;
    render();
    return;
  }

  const catPref = e.target.closest('[data-cat-pref]');
  if (catPref) {
    const cat = catPref.dataset.catPref;
    state.profileCats.has(cat) ? state.profileCats.delete(cat) : state.profileCats.add(cat);
    render();
    return;
  }

  const rateStar = e.target.closest('[data-rate-star]');
  if (rateStar) {
    state.profileRating = Number(rateStar.dataset.rateStar);
    render();
    return;
  }

  if (e.target.closest('[data-rate-submit]')) {
    if (state.profileRating > 0) { state.profileRatingDone = true; render(); }
    return;
  }

  if (e.target.closest('[data-contact-send]')) {
    state.profileContactSent = true;
    render();
    return;
  }

  if (e.target.closest('[data-profile-save]')) {
    const nameInput = document.querySelector('[data-edit-name]');
    if (nameInput && nameInput.value.trim()) state.profileName = nameInput.value.trim();
    state.profilePanel = null;
    render();
    return;
  }

  if (e.target.closest('[data-profile-change-photo]')) {
    const input = document.querySelector('[data-profile-photo-input]');
    if (input) input.click();
    return;
  }

  if (e.target.closest('[data-logout-confirm]')) {
    state.profilePanel = null;
    state.tab = 'home';
    render();
    return;
  }

  // ── Mapa: filtros, cierre del sheet y CTA (sin re-render para no recrear el mapa)
  const mapCatChip = e.target.closest('[data-map-cat]');
  if (mapCatChip) {
    const val = mapCatChip.dataset.mapCat;
    if (val === 'all') state.mapCat.clear();
    else state.mapCat.has(val) ? state.mapCat.delete(val) : state.mapCat.add(val);

    document.querySelectorAll('[data-map-cat]').forEach(chip => {
      const v = chip.dataset.mapCat;
      const on = v === 'all' ? state.mapCat.size === 0 : state.mapCat.has(v);
      chip.classList.toggle('is-active', on);
    });
    applyMapFilter();

    // Al elegir un filtro concreto, saltamos al evento más cercano y abrimos
    // su detalle automáticamente. "Todos" solo limpia y cierra el detalle.
    if (state.mapCat.size > 0 && mapRuntime.instance) {
      const c = mapRuntime.instance.getCenter();
      const near = nearestVisibleEvent([c.lng, c.lat]);
      if (near) selectMapEvent(near.id);
    } else {
      deselectMapEvent();
    }
    return;
  }

  if (e.target.closest('[data-map-preview-close]')) {
    deselectMapEvent();
    return;
  }

  const detailBtn = e.target.closest('[data-map-detail]');
  if (detailBtn) {
    selectMapEvent(detailBtn.dataset.mapDetail);
    setMapStatus('Detalle del evento — demo de Catchtime', 2200);
    return;
  }

  const buyBtn = e.target.closest('[data-map-buy]');
  if (buyBtn) {
    setMapStatus('Compra de entradas — demo de Catchtime', 2200);
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
    return;
  }
  if (e.target.matches('[data-notifications-search]')) {
    state.notificationsQuery = e.target.value;
    state.notificationsSearchFocused = true;
    render();
  }
});

document.addEventListener('change', e => {
  if (!e.target.matches('[data-profile-photo-input]')) return;
  const file = e.target.files && e.target.files[0];
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = () => {
    state.profileAvatar = reader.result;
    render();
  };
  reader.readAsDataURL(file);
  e.target.value = '';
});

document.addEventListener('focusin', e => {
  if (e.target.matches('[data-search]')) state.searchFocused = true;
  if (e.target.matches('[data-location-search]')) state.locationFocused = true;
  if (e.target.matches('[data-notifications-search]')) state.notificationsSearchFocused = true;
});

document.addEventListener('focusout', e => {
  if (e.target.matches('[data-search]')) state.searchFocused = false;
  if (e.target.matches('[data-location-search]')) state.locationFocused = false;
  if (e.target.matches('[data-notifications-search]')) state.notificationsSearchFocused = false;
  if (e.target.matches('[data-profile-name-input]')) {
    const val = e.target.value.trim();
    if (val) state.profileName = val;
    state.profileEditingName = false;
    render();
  }
});

document.addEventListener('keydown', e => {
  if (!e.target.matches('[data-profile-name-input]')) return;
  if (e.key === 'Enter') {
    const val = e.target.value.trim();
    if (val) state.profileName = val;
    state.profileEditingName = false;
    render();
  } else if (e.key === 'Escape') {
    state.profileEditingName = false;
    render();
  }
});

window.addEventListener('resize', () => {
  if (mapRuntime.instance) mapRuntime.instance.resize();
});

// ── Arranque ─────────────────────────────────────────────────────────────────
readEventFromUrl();
requestUserLocation();
render();
