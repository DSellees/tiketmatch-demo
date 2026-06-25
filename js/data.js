/* ============================================================================
   data.js — datos y constantes de la app (sin backend, datos de ejemplo)
   ========================================================================== */

// acento de marca
const AC = '#FF5722';
const AS = 'rgba(255,87,34,0.1)';

// fondo (patrón) por categoría — sustituye a la imagen real del evento
const CATBG = {
  concert:    'repeating-linear-gradient(125deg,#2b2e3b 0 16px,#262936 16px 32px)',
  festival:   'repeating-linear-gradient(125deg,#2f2433 0 16px,#281e2c 16px 32px)',
  football:   'repeating-linear-gradient(125deg,#16271d 0 16px,#102019 16px 32px)',
  basket:     'repeating-linear-gradient(125deg,#33271a 0 16px,#2b2015 16px 32px)',
  balonmano:  'repeating-linear-gradient(125deg,#1d2433 0 16px,#171d2a 16px 32px)',
  experience: 'repeating-linear-gradient(125deg,#2c271f 0 16px,#241f19 16px 32px)',
};

// etiqueta de categoría en español (para el placeholder "imagen · …")
const CATNAME = {
  concert: 'concierto', festival: 'festival', football: 'fútbol',
  basket: 'baloncesto', balonmano: 'balonmano', experience: 'experiencia',
};

// estados de disponibilidad de entradas
const STATUS = {
  avail: { text: 'Disponible',       bg: 'rgba(17,24,39,.55)', color: '#fff', dot: '#34D399' },
  last:  { text: 'Últimas entradas', bg: AC,                   color: '#fff', dot: 'transparent' },
  soon:  { text: 'Próximamente',     bg: 'rgba(17,24,39,.62)', color: '#fff', dot: '#9CA3AF' },
};

// referencia temporal para filtros de fecha (demo: 22 jun 2026)
const TODAY = new Date('2026-06-22T12:00:00');

// ── helpers de escudos ────────────────────────────────────────────────────────
// Ruta relativa al PNG de escudo (assets/crests/<code>.png).
// Devuelve null si no se conoce el código para ese equipo.
const CREST_CODES = {
  // LaLiga
  'FC Barcelona':         'fcb',
  'Real Madrid':          'rma',
  'Atlético de Madrid':   'atm',
  'Girona FC':            'gir',
  'Espanyol':             'rcde',
  'Athletic Club':        'ath',
  'Real Betis':           'bet',
  'RC Celta':             'cel',
  'Getafe CF':            'get',
  'Granada CF':           'gra',
  'RCD Mallorca':         'mll',
  'Real Sociedad':        'rso',
  'Sevilla FC':           'sev',
  'Valencia CF':          'vcf',
  'Villarreal CF':        'vil',
  // ACB Basket
  'Barça Basket':         'fcb',
  'Baskonia':             'bas',
  'Bilbao Basket':        'bid',
  'Joventut':             'jov',
  'Bàsquet Manresa':      'man',
  'Unicaja':              'uni',
  'Valencia Basket':      'vbc',
};

function crestPath(code) {
  return code ? `assets/crests/${code}.png` : null;
}

// catálogo de eventos — lng/lat: coordenadas reales aprox. de cada recinto en
// Barcelona (Montjuïc concentra varios para probar el anti-solape de las cards).
// Campos opcionales en partidos: homeTeam, awayTeam, homeCrest, awayCrest, competition
const EVENTS = [
  // ── Conciertos & festivales ───────────────────────────────────────────────
  { id:'e1',  title:'Lúa Nova · Gira 2026',       venue:'Palau Sant Jordi',   area:'Montjuïc',     dateShort:'SÁB 14 JUN', date:'2026-06-14', time:'21:00', price:'€45',  priceNum:45,  status:'avail', cat:'concert',    lng:2.1527, lat:41.3634 },
  { id:'e2',  title:'Electronit Festival',         venue:'Parc del Fòrum',     area:'Sant Martí',   dateShort:'VIE 27 JUN', date:'2026-06-27', time:'18:00', price:'€62',  priceNum:62,  status:'last',  cat:'festival',   lng:2.2186, lat:41.4102 },
  { id:'e4',  title:'Indie Sessions Vol. 4',       venue:'Razzmatazz',         area:'Poblenou',     dateShort:'JUE 19 JUN', date:'2026-06-19', time:'20:30', price:'€24',  priceNum:24,  status:'last',  cat:'concert',    lng:2.1936, lat:41.3984 },
  { id:'e5',  title:'Flamenco Roots Live',         venue:'Teatre Grec',        area:'Montjuïc',     dateShort:'MIÉ 02 JUL', date:'2026-07-02', time:'22:00', price:'€30',  priceNum:30,  status:'avail', cat:'experience', lng:2.1612, lat:41.3702 },
  { id:'e7',  title:'Litoral Sound 2026',          venue:'Parc del Fòrum',     area:'Sant Martí',   dateShort:'SÁB 05 JUL', date:'2026-07-05', time:'17:00', price:'€120', priceNum:120, status:'last',  cat:'festival',   lng:2.2238, lat:41.4118 },
  { id:'e8',  title:'Cena en las Alturas',         venue:'Rooftop Eixample',   area:'Eixample',     dateShort:'VIE 13 JUN', date:'2026-06-13', time:'20:00', price:'€55',  priceNum:55,  status:'avail', cat:'experience', lng:2.1635, lat:41.3905 },
  { id:'e9',  title:'Jazz al Fòrum',               venue:"L'Auditori",         area:'El Clot',      dateShort:'JUE 26 JUN', date:'2026-06-26', time:'20:00', price:'€28',  priceNum:28,  status:'avail', cat:'concert',    lng:2.1872, lat:41.3985 },
  { id:'e11', title:'Vibra Festival',              venue:'Poble Espanyol',     area:'Montjuïc',     dateShort:'SÁB 28 JUN', date:'2026-06-28', time:'19:00', price:'€49',  priceNum:49,  status:'soon',  cat:'festival',   lng:2.1470, lat:41.3686 },
  { id:'e12', title:'Tour Gastronòmic del Born',   venue:'El Born',            area:'Ciutat Vella', dateShort:'DOM 15 JUN', date:'2026-06-15', time:'12:00', price:'€35',  priceNum:35,  status:'avail', cat:'experience', lng:2.1818, lat:41.3851 },
  { id:'e13', title:'Atardecer en Montjuïc',       venue:'Teleférico',         area:'Montjuïc',     dateShort:'SÁB 21 JUN', date:'2026-06-21', time:'19:30', price:'€18',  priceNum:18,  status:'last',  cat:'experience', lng:2.1660, lat:41.3635 },
  { id:'e14', title:'Noche Electrónica',           venue:'Sala Apolo',         area:'Poble-sec',    dateShort:'SÁB 14 JUN', date:'2026-06-14', time:'23:59', price:'€22',  priceNum:22,  status:'avail', cat:'concert',    lng:2.1690, lat:41.3744 },
  { id:'e15', title:'Liga ASOBAL · Derbi',          venue:'Pavelló Municipal',  area:'Pedralbes',    dateShort:'LUN 23 JUN', date:'2026-06-23', time:'11:00', price:'€40',  priceNum:40,  status:'soon',  cat:'balonmano',  lng:2.1086, lat:41.3886 },
  { id:'e16', title:'Cata de Vinos Penedès',       venue:'Wine Loft',          area:'Gràcia',       dateShort:'JUE 12 JUN', date:'2026-06-12', time:'19:00', price:'€42',  priceNum:42,  status:'avail', cat:'experience', lng:2.1563, lat:41.4034 },

  // ── Fútbol — importados/actualizados con escudos reales ───────────────────
  // e3 actualizado: Derbi Mediterráneo = Espanyol vs FC Barcelona
  {
    id:'e3', cat:'football', status:'avail',
    homeTeam:'Espanyol', awayTeam:'FC Barcelona',
    homeCrest:'rcde',    awayCrest:'fcb',
    competition:'LaLiga',
    title:'Derbi Mediterráneo',
    venue:'RCDE Stadium', area:'Cornellà',
    dateShort:'DOM 22 JUN', date:'2026-06-22', time:'16:15',
    price:'€38', priceNum:38, lng:2.0747, lat:41.3475,
  },
  // e6 actualizado: Champions = FC Barcelona vs Atlético de Madrid
  {
    id:'e6', cat:'football', status:'soon',
    homeTeam:'FC Barcelona', awayTeam:'Atlético de Madrid',
    homeCrest:'fcb',        awayCrest:'atm',
    competition:'UEFA Champions League',
    title:'Champions Night · Octavos',
    venue:'Spotify Camp Nou', area:'Les Corts',
    dateShort:'MAR 24 JUN', date:'2026-06-24', time:'21:00',
    price:'€85', priceNum:85, lng:2.1228, lat:41.3809,
  },
  // e17 (ticketcatch): El Clásico — FC Barcelona vs Real Madrid
  {
    id:'e17', cat:'football', status:'last',
    homeTeam:'FC Barcelona', awayTeam:'Real Madrid',
    homeCrest:'fcb',        awayCrest:'rma',
    competition:'LaLiga',
    title:'El Clásico',
    venue:'Spotify Camp Nou', area:'Les Corts',
    dateShort:'SÁB 12 JUL', date:'2026-07-12', time:'21:00',
    price:'€135', priceNum:135, lng:2.1228, lat:41.3809,
  },
  // e18 (ticketcatch): Girona FC vs Atlético de Madrid
  {
    id:'e18', cat:'football', status:'avail',
    homeTeam:'Girona FC', awayTeam:'Atlético de Madrid',
    homeCrest:'gir',      awayCrest:'atm',
    competition:'LaLiga',
    title:'Girona vs Atlético',
    venue:'Estadi Montilivi', area:'Girona',
    dateShort:'MIÉ 08 JUL', date:'2026-07-08', time:'19:30',
    price:'€48', priceNum:48, lng:2.8148, lat:41.9581,
  },
  // e19: Derbi Sevillano — Real Betis vs Sevilla FC
  {
    id:'e19', cat:'football', status:'avail',
    homeTeam:'Real Betis', awayTeam:'Sevilla FC',
    homeCrest:'bet',       awayCrest:'sev',
    competition:'LaLiga',
    title:'Derbi Sevillano',
    venue:'Estadio Benito Villamarín', area:'Sevilla',
    dateShort:'SÁB 04 JUL', date:'2026-07-04', time:'20:00',
    price:'€55', priceNum:55, lng:-5.9817, lat:37.3568,
  },
  // e20: Derbi Vasco — Real Sociedad vs Athletic Club
  {
    id:'e20', cat:'football', status:'soon',
    homeTeam:'Real Sociedad', awayTeam:'Athletic Club',
    homeCrest:'rso',          awayCrest:'ath',
    competition:'LaLiga',
    title:'Derbi Vasco',
    venue:'Reale Arena', area:'San Sebastián',
    dateShort:'DOM 13 JUL', date:'2026-07-13', time:'18:00',
    price:'€42', priceNum:42, lng:-1.9738, lat:43.3014,
  },

  // ── Basket — con escudos ───────────────────────────────────────────────────
  // e10 actualizado: Euroliga = Barça Basket vs Baskonia
  {
    id:'e10', cat:'basket', status:'avail',
    homeTeam:'Barça Basket', awayTeam:'Baskonia',
    homeCrest:'fcb',         awayCrest:'bas',
    competition:'EuroLiga',
    title:'Euroliga · Jornada 21',
    venue:'Palau Blaugrana', area:'Les Corts',
    dateShort:'VIE 20 JUN', date:'2026-06-20', time:'20:45',
    price:'€19', priceNum:19, lng:2.1228, lat:41.3809,
  },
  // e21 (ticketcatch): Barça Basket vs Joventut
  {
    id:'e21', cat:'basket', status:'last',
    homeTeam:'Barça Basket', awayTeam:'Joventut',
    homeCrest:'fcb',         awayCrest:'jov',
    competition:'Liga ACB',
    title:'Clásico Catalán · ACB',
    venue:'Palau Blaugrana', area:'Les Corts',
    dateShort:'VIE 03 JUL', date:'2026-07-03', time:'20:30',
    price:'€24', priceNum:24, lng:2.1228, lat:41.3809,
  },
  // e22: Valencia Basket vs Unicaja
  {
    id:'e22', cat:'basket', status:'avail',
    homeTeam:'Valencia Basket', awayTeam:'Unicaja',
    homeCrest:'vbc',            awayCrest:'uni',
    competition:'Liga ACB',
    title:'Valencia Basket vs Unicaja',
    venue:'Pabellón Fuente de San Luis', area:'Valencia',
    dateShort:'SÁB 05 JUL', date:'2026-07-05', time:'18:00',
    price:'€18', priceNum:18, lng:-0.3876, lat:39.4699,
  },
];

// índice por id para acceso rápido
const EV = Object.fromEntries(EVENTS.map(e => [e.id, e]));

// colecciones que alimentan cada sección de la Home
const NEARBY      = ['e1', 'e4', 'e3', 'e8', 'e14', 'e13'];
const POPULAR     = ['e17', 'e6', 'e2', 'e7', 'e10', 'e21'];
const PREMIUM     = ['e17', 'e6', 'e3', 'e10', 'e15'];
const RECOMMENDED = ['e18', 'e19', 'e20', 'e22', 'e5', 'e12'];
const TREND = [
  { id:'e17', rank:1, dir:'up' },
  { id:'e6',  rank:2, dir:'up' },
  { id:'e2',  rank:3, dir:'down' },
  { id:'e18', rank:4, dir:'up' },
  { id:'e11', rank:5, dir:'same' },
];

// ubicación: zonas cercanas (demo) y ciudades populares para el selector
const NEARBY_ZONES = [
  { name: 'Ciutat Vella',  meta: 'Barcelona · 0,9 km' },
  { name: 'Eixample',      meta: 'Barcelona · 1,4 km' },
  { name: 'Montjuïc',      meta: 'Barcelona · 2,1 km' },
  { name: 'Gràcia',        meta: 'Barcelona · 3,0 km' },
  { name: 'Poblenou',      meta: 'Barcelona · 4,2 km' },
  { name: 'Sant Martí',    meta: 'Barcelona · 5,1 km' },
];

const POPULAR_CITIES = [
  'Barcelona', 'Madrid', 'València', 'Sevilla',
  'Bilbao', 'Málaga', 'Zaragoza', 'Granada', 'Palma',
];

// Coordenadas de referencia para calcular distancia cuando no hay GPS
const AREA_COORDS = {
  'Montjuïc':     { lat: 41.3634, lng: 2.1527 },
  'Sant Martí':   { lat: 41.4102, lng: 2.2004 },
  'Cornellà':     { lat: 41.3556, lng: 2.0706 },
  'Poblenou':     { lat: 41.4019, lng: 2.2042 },
  'Eixample':     { lat: 41.3902, lng: 2.1602 },
  'El Clot':      { lat: 41.4123, lng: 2.1892 },
  'Les Corts':    { lat: 41.3871, lng: 2.1316 },
  'Ciutat Vella': { lat: 41.3827, lng: 2.1762 },
  'Poble-sec':    { lat: 41.3723, lng: 2.1618 },
  'Pedralbes':    { lat: 41.3906, lng: 2.1116 },
  'Gràcia':       { lat: 41.4034, lng: 2.1563 },
  'Barcelona':    { lat: 41.3851, lng: 2.1734 },
  'Madrid':       { lat: 40.4168, lng: -3.7038 },
  'València':     { lat: 39.4699, lng: -0.3763 },
  'Sevilla':      { lat: 37.3891, lng: -5.9845 },
  'Bilbao':       { lat: 43.2630, lng: -2.9350 },
  'Málaga':       { lat: 36.7213, lng: -4.4214 },
  'Zaragoza':     { lat: 41.6488, lng: -0.8891 },
  'Granada':      { lat: 37.1773, lng: -3.5986 },
  'Palma':        { lat: 39.5696, lng: 2.6502 },
};

// opciones del panel de filtros
const FILTER_SECTIONS = [
  {
    key: 'cat', title: 'Categorías', multi: true,
    options: [
      { id: 'concert',    label: 'Concierto' },
      { id: 'football',   label: 'Fútbol' },
      { id: 'basket',     label: 'Baloncesto' },
      { id: 'balonmano',  label: 'Balonmano' },
      { id: 'festival',   label: 'Festival' },
      { id: 'experience', label: 'Experiencia' },
    ],
  },
  {
    key: 'date', title: 'Fecha', multi: false,
    options: [
      { id: 'any',     label: 'Cualquiera' },
      { id: 'today',   label: 'Hoy' },
      { id: 'weekend', label: 'Este finde' },
      { id: 'week',    label: 'Esta semana' },
      { id: 'month',   label: 'Este mes' },
    ],
  },
  {
    key: 'price', title: 'Precio', multi: false,
    options: [
      { id: 'any',    label: 'Cualquiera' },
      { id: 'lt25',   label: 'Menos de €25' },
      { id: '25-50',  label: '€25–50' },
      { id: '50-100', label: '€50–100' },
      { id: 'gt100',  label: 'Más de €100' },
    ],
  },
  {
    key: 'status', title: 'Disponibilidad', multi: true,
    options: [
      { id: 'avail', label: 'Disponible' },
      { id: 'last',  label: 'Últimas entradas' },
      { id: 'soon',  label: 'Próximamente' },
    ],
  },
  {
    key: 'sort', title: 'Ordenar por', multi: false,
    options: [
      { id: 'relevance', label: 'Relevancia' },
      { id: 'price',     label: 'Menor precio' },
      { id: 'date',      label: 'Próximas fechas' },
      { id: 'near',      label: 'Más cercanos' },
    ],
  },
];

function defaultFilters() {
  return { cat: new Set(), date: 'any', price: 'any', status: new Set(), sort: 'relevance' };
}

function cloneFilters(f) {
  return { cat: new Set(f.cat), date: f.date, price: f.price, status: new Set(f.status), sort: f.sort };
}

// ── Notificaciones in-app (demo) ─────────────────────────────────────────────
// section: unread | yesterday | week
const NOTIF_SECTION_LABELS = {
  unread:    'Sin leer',
  yesterday: 'Ayer',
  week:      'Esta semana',
};

// icono y fondo por tipo de aviso (no por categoría del evento)
const NOTIF_TYPE_META = {
  event_start:  { bg: '#EFF6FF', color: '#2563EB' },
  price_alert:  { bg: '#ECFDF5', color: '#059669' },
  last_tickets: { bg: '#FEF2F2', color: '#DC2626' },
  reminder:     { bg: '#F5F3FF', color: '#7C3AED' },
  new_event:    { bg: '#FFF7ED', color: '#EA580C' },
};

const NOTIFICATIONS = [
  {
    id: 'n1', section: 'unread', type: 'event_start', eventId: 'e3',
    time: 'Ahora', title: 'Empieza pronto',
    body: 'Derbi Mediterráneo comienza en 2 horas en RCDE Stadium.',
    read: false, cta: 'Ver entrada',
  },
  {
    id: 'n2', section: 'unread', type: 'price_alert', eventId: 'e17',
    time: 'Hace 1 h', title: 'Precio objetivo alcanzado',
    body: 'El Clásico bajó a €135. Es el precio que marcaste como objetivo.',
    read: false, cta: 'Ver evento',
  },
  {
    id: 'n3', section: 'yesterday', type: 'last_tickets', eventId: 'e2',
    time: 'Ayer · 18:42', title: 'Quedan pocas entradas',
    body: 'Solo quedan 5 entradas para Electronit Festival. No te quedes fuera.',
    read: true, cta: 'Comprar ahora',
  },
  {
    id: 'n4', section: 'yesterday', type: 'reminder', eventId: 'e9',
    time: 'Ayer · 09:15', title: 'Recordatorio de evento',
    body: 'Jazz al Fòrum es mañana a las 20:00. Lleva tu entrada en el móvil.',
    read: true, cta: 'Ver entrada',
  },
  {
    id: 'n5', section: 'yesterday', type: 'price_alert', eventId: 'e6',
    time: 'Ayer · 08:30', title: 'Bajada de precio',
    body: 'Champions Night · Octavos ahora desde €85. Antes €95.',
    read: true, cta: 'Ver evento',
  },
  {
    id: 'n6', section: 'week', type: 'new_event', eventId: 'e11',
    time: 'Lun · 14:20', title: 'Nuevo evento cerca de ti',
    body: 'Vibra Festival en Montjuïc encaja con tus categorías favoritas.',
    read: true, cta: 'Ver evento',
  },
  {
    id: 'n7', section: 'week', type: 'last_tickets', eventId: 'e7',
    time: 'Dom · 11:05', title: 'Últimas entradas',
    body: 'Quedan menos de 20 entradas para Litoral Sound 2026.',
    read: true, cta: 'Comprar ahora',
  },
  {
    id: 'n8', section: 'week', type: 'event_start', eventId: 'e10',
    time: 'Vie · 19:50', title: 'Tu evento empieza pronto',
    body: 'Euroliga · Jornada 21 comienza en 30 minutos en Palau Blaugrana.',
    read: true, cta: 'Ver entrada',
  },
];
