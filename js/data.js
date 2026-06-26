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

// referencia temporal para filtros de fecha (demo: 23 jun 2026, mediodía)
const TODAY = new Date('2026-06-23T12:00:00');

// Encuadre object-fit:cover por categoría (posters verticales vs banners)
const PORTADA_FIT = {
  football:  'center 18%',
  basket:    'center 15%',
  balonmano: 'center 18%',
  concert:   'center center',
  festival:  'center center',
};

// Precio Catchtime: descuento del 20-25% sobre precio de salida (pct entre 0.75-0.80)
function catchtimePrice(initialPrice, pct) {
  const currentPrice = Math.round(initialPrice * pct);
  return {
    initialPrice,
    currentPrice,
    priceNum: currentPrice,
    price: '€' + currentPrice,
  };
}

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
  // e17 — El Clásico (oportuno · <24 h)
  {
    id:'e17', cat:'football', status:'last',
    homeTeam:'FC Barcelona', awayTeam:'Real Madrid',
    homeCrest:'fcb',        awayCrest:'rma',
    competition:'LaLiga',
    title:'El Clásico',
    venue:'Spotify Camp Nou', area:'Les Corts',
    dateShort:'MAR 23 JUN', date:'2026-06-23', time:'21:00',
    lng:2.1228, lat:41.3809,
    portada: 'assets/portadas/Futbol/el-clasico-laliga.png',
    ...catchtimePrice(340, 0.78),
  },
  // e25 — Valencia CF vs Girona FC (oportuno · <24 h)
  {
    id:'e25', cat:'football', status:'avail',
    homeTeam:'Valencia CF', awayTeam:'Girona FC',
    homeCrest:'vcf',        awayCrest:'gir',
    competition:'LaLiga',
    title:'Valencia vs Girona',
    venue:'Estadio Mestalla', area:'Valencia',
    dateShort:'MIÉ 24 JUN', date:'2026-06-24', time:'10:30',
    lng:-0.3582, lat:39.4747,
    portada: 'assets/portadas/Futbol/vlcvsgirona.png',
    ...catchtimePrice(80, 0.76),
  },
  // e24 — Atlético de Madrid vs Real Betis (oportuno · <24 h)
  {
    id:'e24', cat:'football', status:'avail',
    homeTeam:'Atlético de Madrid', awayTeam:'Real Betis',
    homeCrest:'atm',              awayCrest:'bet',
    competition:'LaLiga',
    title:'Atlético vs Betis',
    venue:'Cívitas Metropolitano', area:'Madrid',
    dateShort:'MIÉ 24 JUN', date:'2026-06-24', time:'11:00',
    lng:-3.5994, lat:40.4361,
    portada: 'assets/portadas/Futbol/ATHvsBETIS.png',
    ...catchtimePrice(145, 0.80),
  },
  // e23 — Derbi de Barcelona (oportuno · <24 h)
  {
    id:'e23', cat:'football', status:'last',
    homeTeam:'FC Barcelona', awayTeam:'Espanyol',
    homeCrest:'fcb',         awayCrest:'rcde',
    competition:'LaLiga',
    title:'Derbi de Barcelona',
    venue:'Spotify Camp Nou', area:'Les Corts',
    dateShort:'MAR 23 JUN', date:'2026-06-23', time:'20:00',
    lng:2.1228, lat:41.3809,
    portada: 'assets/portadas/Futbol/BCNvsRCD.png',
    ...catchtimePrice(190, 0.77),
  },
  // e26 — Espanyol vs Villarreal (oportuno · <24 h)
  {
    id:'e26', cat:'football', status:'avail',
    homeTeam:'Espanyol', awayTeam:'Villarreal',
    homeCrest:'rcde',      awayCrest:'vil',
    competition:'LaLiga',
    title:'Espanyol vs Villarreal',
    venue:'RCDE Stadium', area:'Cornellà',
    dateShort:'MAR 23 JUN', date:'2026-06-23', time:'19:00',
    lng:2.0747, lat:41.3475,
    portada: 'assets/portadas/Futbol/RCDvsVILLA.png',
    ...catchtimePrice(90, 0.79),
  },
  // e27 — Balonmano Clásico (oportuno · <24 h)
  {
    id:'e27', cat:'balonmano', status:'last',
    homeTeam:'FC Barcelona', awayTeam:'Real Madrid',
    homeCrest:'fcb',         awayCrest:'rma',
    competition:'EHF Champions League',
    title:'Champions · Clásico',
    venue:'Palau Blaugrana', area:'Les Corts',
    dateShort:'MAR 23 JUN', date:'2026-06-23', time:'20:30',
    lng:2.1228, lat:41.3809,
    portada: 'assets/portadas/balonamno/barca-vs-madrid-ehf.png',
    ...catchtimePrice(110, 0.75),
  },
  // e28 — Euroliga Clásico (oportuno · <24 h)
  {
    id:'e28', cat:'basket', status:'last',
    homeTeam:'Barça Basket', awayTeam:'Real Madrid',
    homeCrest:'fcb',         awayCrest:'rma',
    competition:'EuroLiga',
    title:'Euroliga · Clásico',
    venue:'Palau Blaugrana', area:'Les Corts',
    dateShort:'MAR 23 JUN', date:'2026-06-23', time:'21:15',
    lng:2.1228, lat:41.3809,
    portada: 'assets/portadas/basquet/barca-vs-madrid-euroliga.webp',
    ...catchtimePrice(130, 0.78),
  },
  // e31 — Olympiacos vs Real Madrid (oportuno · <24 h)
  {
    id:'e31', cat:'basket', status:'avail',
    homeTeam:'Olympiacos', awayTeam:'Real Madrid',
    awayCrest:'rma',
    competition:'EuroLiga',
    title:'Olympiacos vs Real Madrid',
    venue:'WiZink Center', area:'Madrid',
    dateShort:'MIÉ 24 JUN', date:'2026-06-24', time:'11:00',
    lng:-3.6873, lat:40.4237,
    portada: 'assets/portadas/basquet/olympiacos-vs-madrid-euroliga.webp',
    ...catchtimePrice(102, 0.77),
  },

  // ── Conciertos & festivales oportunos (<24 h) ─────────────────────────────
  // e32 — Leiva
  {
    id:'e32', cat:'concert', status:'avail',
    title:'Leiva · Cuando te muerdes el labio',
    venue:'Razzmatazz', area:'Poblenou',
    dateShort:'MAR 23 JUN', date:'2026-06-23', time:'21:30',
    lng:2.1936, lat:41.3984,
    portada: 'assets/portadas/conciertos/leiva-tour-cuando-te-muerdes-el-labio.jpg',
    ...catchtimePrice(105, 0.79),
  },
  // e33 — La Oreja de Van Gogh
  {
    id:'e33', cat:'concert', status:'avail',
    title:'La Oreja de Van Gogh',
    venue:'Palau Sant Jordi', area:'Montjuïc',
    dateShort:'MIÉ 24 JUN', date:'2026-06-24', time:'11:00',
    lng:2.1527, lat:41.3634,
    portada: 'assets/portadas/conciertos/la-oreja-de-van-gogh.webp',
    ...catchtimePrice(138, 0.76),
  },
  // e34 — Morat
  {
    id:'e34', cat:'concert', status:'last',
    title:'Morat · Tour 2026',
    venue:'Palau Sant Jordi', area:'Montjuïc',
    dateShort:'MAR 23 JUN', date:'2026-06-23', time:'20:30',
    lng:2.1527, lat:41.3634,
    portada: 'assets/portadas/conciertos/morat-tour.webp',
    ...catchtimePrice(120, 0.78),
  },
  // e35 — Cruïlla Festival 2026
  {
    id:'e35', cat:'festival', status:'soon',
    title:'Cruïlla Festival 2026',
    venue:'Parc del Fòrum', area:'Sant Martí',
    dateShort:'MIÉ 24 JUN', date:'2026-06-24', time:'11:45',
    lng:2.2186, lat:41.4102,
    portada: 'assets/portadas/conciertos/cruilla-festival-2026.jpg',
    ...catchtimePrice(225, 0.75),
  },
  // e36 — Share Festival Barcelona
  {
    id:'e36', cat:'festival', status:'avail',
    title:'Share Festival · Music & Solidarity',
    venue:'Parc del Fòrum', area:'Sant Martí',
    dateShort:'MAR 23 JUN', date:'2026-06-23', time:'18:00',
    lng:2.2186, lat:41.4102,
    portada: 'assets/portadas/conciertos/share-festival-barcelona.png',
    ...catchtimePrice(88, 0.80),
  },
  // e37 — Brunch Electronik Festival 2026
  {
    id:'e37', cat:'festival', status:'avail',
    title:'Brunch Electronik Festival 2026',
    venue:'Parc del Fòrum', area:'Sant Martí',
    dateShort:'MAR 23 JUN', date:'2026-06-23', time:'14:00',
    lng:2.2238, lat:41.4118,
    portada: 'assets/portadas/conciertos/brunch-electronik-festival-2026.webp',
    ...catchtimePrice(170, 0.77),
  },
  // e38 — Primavera Sound Barcelona 2026
  {
    id:'e38', cat:'festival', status:'last',
    title:'Primavera Sound Barcelona 2026',
    venue:'Parc del Fòrum', area:'Sant Martí',
    dateShort:'MIÉ 24 JUN', date:'2026-06-24', time:'11:30',
    lng:2.2186, lat:41.4102,
    portada: 'assets/portadas/conciertos/primavera-sound-barcelona-2026.jpg',
    ...catchtimePrice(195, 0.79),
  },
];

// índice por id para acceso rápido
const EV = Object.fromEntries(EVENTS.map(e => [e.id, e]));

// Direcciones postales reales (demo) por recinto
const VENUE_ADDRESSES = {
  'Palau Sant Jordi':            { street: 'Passeig Olímpic, 5-7', postal: '08038', city: 'Barcelona' },
  'Parc del Fòrum':              { street: 'Parc del Fòrum, s/n', postal: '08019', city: 'Barcelona' },
  'Razzmatazz':                  { street: 'Carrer dels Almogàvers, 122', postal: '08018', city: 'Barcelona' },
  'Teatre Grec':                 { street: 'Passeig de Santa Madrona, s/n', postal: '08038', city: 'Barcelona' },
  'Rooftop Eixample':            { street: 'Carrer de València, 284', postal: '08007', city: 'Barcelona' },
  "L'Auditori":                  { street: 'Carrer de Lepant, 150', postal: '08013', city: 'Barcelona' },
  'Poble Espanyol':              { street: 'Av. de Francesc Ferrer i Guàrdia, 13', postal: '08038', city: 'Barcelona' },
  'El Born':                     { street: 'Plaça Comercial, 12', postal: '08003', city: 'Barcelona' },
  'Teleférico':                  { street: 'Avinguda Miramar, 30', postal: '08038', city: 'Barcelona' },
  'Sala Apolo':                  { street: 'Carrer Nou de la Rambla, 113', postal: '08004', city: 'Barcelona' },
  'Pavelló Municipal':           { street: 'Carrer de Martí i Genís, 27', postal: '08034', city: 'Barcelona' },
  'Wine Loft':                   { street: 'Carrer de Verdi, 58', postal: '08012', city: 'Barcelona' },
  'RCDE Stadium':                { street: 'Av. Baix Llobregat, 100', postal: '08940', city: 'Cornellà de Llobregat' },
  'Spotify Camp Nou':            { street: "Carrer d'Arístides Maillol, 12", postal: '08028', city: 'Barcelona' },
  'Estadi Montilivi':            { street: 'Av. Montilivi, 171', postal: '17003', city: 'Girona' },
  'Estadio Benito Villamarín':   { street: 'Av. de Heliópolis, s/n', postal: '41012', city: 'Sevilla' },
  'Reale Arena':                 { street: 'Paseo de Anoeta, 1', postal: '20014', city: 'San Sebastián' },
  'Palau Blaugrana':             { street: "Carrer d'Arístides Maillol, s/n", postal: '08028', city: 'Barcelona' },
  'Pabellón Fuente de San Luis': { street: 'Av. de Suecia, s/n', postal: '46010', city: 'València' },
  'Estadio Mestalla':            { street: 'Av. de Suècia, s/n', postal: '46010', city: 'València' },
  'Cívitas Metropolitano':       { street: 'Av. de Luis Aragonés, 4', postal: '28022', city: 'Madrid' },
  'WiZink Center':               { street: 'Av. de Felipe II, s/n', postal: '28009', city: 'Madrid' },
};

function eventAddress(e) {
  const base = VENUE_ADDRESSES[e.venue];
  if (base) {
    const district = e.area && e.area !== base.city ? ` · ${e.area}` : '';
    return {
      street: base.street,
      cityLine: `${base.postal} ${base.city}${district}`,
      mapsQuery: `${base.street}, ${base.postal} ${base.city}`,
    };
  }
  const city = e.area === 'Girona' || e.area === 'Sevilla' || e.area === 'San Sebastián' || e.area === 'Valencia' || e.area === 'Madrid'
    ? e.area
    : 'Barcelona';
  return {
    street: e.venue,
    cityLine: `${city}${e.area ? ' · ' + e.area : ''}`,
    mapsQuery: `${e.venue}, ${city}`,
  };
}

// Eventos oportunos Catchtime: todos con portada, <24 h, precio ≤40 % salida
// Orden: baloncesto → balonmano → festivales → conciertos → fútbol
const OPORTUNOS = [
  'e28','e31',
  'e27',
  'e35','e36','e37','e38',
  'e32','e33','e34',
  'e17','e23','e24','e25','e26',
];

// colecciones que alimentan cada sección de la Home (solo eventos con portada)
const EVENTS_FOOTBALL    = ['e17','e23','e24','e25','e26'];
const EVENTS_BASKET      = ['e28','e31'];
const EVENTS_BALONMANO   = ['e27'];
const EVENTS_CONCERT     = ['e32','e33','e34'];
const EVENTS_FESTIVAL    = ['e35','e36','e37','e38'];
const EVENTS_EXPERIENCE  = [];

// Populares: basket/balonmano primero, festivales intercalados, fútbol al final
const POPULAR     = ['e28', 'e35', 'e27', 'e36', 'e37', 'e38', 'e31', 'e17'];
const PREMIUM     = ['e17', 'e27', 'e28', 'e31', 'e23'];
const RECOMMENDED = ['e32', 'e35', 'e33', 'e37', 'e34', 'e36', 'e38', 'e26'];
const NEARBY      = ['e28', 'e27', 'e35', 'e37', 'e32', 'e36', 'e34', 'e23'];
const TREND = [
  { id:'e28', rank:1, dir:'up' },
  { id:'e27', rank:2, dir:'up' },
  { id:'e35', rank:3, dir:'up' },
  { id:'e36', rank:4, dir:'up' },
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
    id: 'n1', section: 'unread', type: 'event_start', eventId: 'e28',
    time: 'Ahora', title: 'Empieza pronto',
    body: 'Euroliga · Clásico comienza en 9 horas en Palau Blaugrana.',
    read: false, cta: 'Ver entrada',
  },
  {
    id: 'n2', section: 'unread', type: 'price_alert', eventId: 'e17',
    time: 'Hace 1 h', title: 'Precio objetivo alcanzado',
    body: 'El Clásico bajó a €136. Es el precio que marcaste como objetivo.',
    read: false, cta: 'Ver evento',
  },
  {
    id: 'n3', section: 'yesterday', type: 'last_tickets', eventId: 'e35',
    time: 'Ayer · 18:42', title: 'Quedan pocas entradas',
    body: 'Solo quedan unas entradas para Cruïlla Festival 2026. No te quedes fuera.',
    read: true, cta: 'Comprar ahora',
  },
  {
    id: 'n4', section: 'yesterday', type: 'reminder', eventId: 'e33',
    time: 'Ayer · 09:15', title: 'Recordatorio de evento',
    body: 'La Oreja de Van Gogh es mañana a las 11:00. Lleva tu entrada en el móvil.',
    read: true, cta: 'Ver entrada',
  },
  {
    id: 'n5', section: 'yesterday', type: 'price_alert', eventId: 'e27',
    time: 'Ayer · 08:30', title: 'Bajada de precio',
    body: 'Champions · Clásico de balonmano ahora desde €44. Antes €110.',
    read: true, cta: 'Ver evento',
  },
  {
    id: 'n6', section: 'week', type: 'new_event', eventId: 'e38',
    time: 'Lun · 14:20', title: 'Nuevo evento cerca de ti',
    body: 'Primavera Sound Barcelona 2026 encaja con tus categorías favoritas.',
    read: true, cta: 'Ver evento',
  },
  {
    id: 'n7', section: 'week', type: 'last_tickets', eventId: 'e34',
    time: 'Dom · 11:05', title: 'Últimas entradas',
    body: 'Quedan menos de 20 entradas para Morat · Tour 2026.',
    read: true, cta: 'Comprar ahora',
  },
  {
    id: 'n8', section: 'week', type: 'event_start', eventId: 'e27',
    time: 'Vie · 19:50', title: 'Tu evento empieza pronto',
    body: 'Champions · Clásico de balonmano comienza en 30 minutos en Palau Blaugrana.',
    read: true, cta: 'Ver entrada',
  },
];
