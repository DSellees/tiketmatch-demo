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

// catálogo de eventos — lng/lat: coordenadas reales aprox. de cada recinto en
// Barcelona (Montjuïc concentra varios para probar el anti-solape de las cards).
const EVENTS = [
  { id:'e1',  title:'Lúa Nova · Gira 2026',       venue:'Palau Sant Jordi',   area:'Montjuïc',     dateShort:'SÁB 14 JUN', date:'2026-06-14', time:'21:00', price:'€45',  priceNum:45,  status:'avail', cat:'concert',    lng:2.1527, lat:41.3634 },
  { id:'e2',  title:'Electronit Festival',         venue:'Parc del Fòrum',     area:'Sant Martí',   dateShort:'VIE 27 JUN', date:'2026-06-27', time:'18:00', price:'€62',  priceNum:62,  status:'last',  cat:'festival',   lng:2.2186, lat:41.4102 },
  { id:'e3',  title:'Derbi Mediterráneo',          venue:'RCDE Stadium',       area:'Cornellà',     dateShort:'DOM 22 JUN', date:'2026-06-22', time:'16:15', price:'€38',  priceNum:38,  status:'avail', cat:'football',   lng:2.0747, lat:41.3475 },
  { id:'e4',  title:'Indie Sessions Vol. 4',       venue:'Razzmatazz',         area:'Poblenou',     dateShort:'JUE 19 JUN', date:'2026-06-19', time:'20:30', price:'€24',  priceNum:24,  status:'last',  cat:'concert',    lng:2.1936, lat:41.3984 },
  { id:'e5',  title:'Flamenco Roots Live',         venue:'Teatre Grec',        area:'Montjuïc',     dateShort:'MIÉ 02 JUL', date:'2026-07-02', time:'22:00', price:'€30',  priceNum:30,  status:'avail', cat:'experience', lng:2.1612, lat:41.3702 },
  { id:'e6',  title:'Champions Night · Octavos',   venue:'Estadi Olímpic',     area:'Montjuïc',     dateShort:'MAR 24 JUN', date:'2026-06-24', time:'21:00', price:'€85',  priceNum:85,  status:'soon',  cat:'football',   lng:2.1556, lat:41.3647 },
  { id:'e7',  title:'Litoral Sound 2026',          venue:'Parc del Fòrum',     area:'Sant Martí',   dateShort:'SÁB 05 JUL', date:'2026-07-05', time:'17:00', price:'€120', priceNum:120, status:'last',  cat:'festival',   lng:2.2238, lat:41.4118 },
  { id:'e8',  title:'Cena en las Alturas',         venue:'Rooftop Eixample',   area:'Eixample',     dateShort:'VIE 13 JUN', date:'2026-06-13', time:'20:00', price:'€55',  priceNum:55,  status:'avail', cat:'experience', lng:2.1635, lat:41.3905 },
  { id:'e9',  title:'Jazz al Fòrum',               venue:"L'Auditori",         area:'El Clot',      dateShort:'JUE 26 JUN', date:'2026-06-26', time:'20:00', price:'€28',  priceNum:28,  status:'avail', cat:'concert',    lng:2.1872, lat:41.3985 },
  { id:'e10', title:'Euroliga · Jornada 21',        venue:'Palau Blaugrana',    area:'Les Corts',    dateShort:'VIE 20 JUN', date:'2026-06-20', time:'20:45', price:'€19',  priceNum:19,  status:'avail', cat:'basket',     lng:2.1228, lat:41.3809 },
  { id:'e11', title:'Vibra Festival',              venue:'Poble Espanyol',     area:'Montjuïc',     dateShort:'SÁB 28 JUN', date:'2026-06-28', time:'19:00', price:'€49',  priceNum:49,  status:'soon',  cat:'festival',   lng:2.1470, lat:41.3686 },
  { id:'e12', title:'Tour Gastronòmic del Born',   venue:'El Born',            area:'Ciutat Vella', dateShort:'DOM 15 JUN', date:'2026-06-15', time:'12:00', price:'€35',  priceNum:35,  status:'avail', cat:'experience', lng:2.1818, lat:41.3851 },
  { id:'e13', title:'Atardecer en Montjuïc',       venue:'Teleférico',         area:'Montjuïc',     dateShort:'SÁB 21 JUN', date:'2026-06-21', time:'19:30', price:'€18',  priceNum:18,  status:'last',  cat:'experience', lng:2.1660, lat:41.3635 },
  { id:'e14', title:'Noche Electrónica',           venue:'Sala Apolo',         area:'Poble-sec',    dateShort:'SÁB 14 JUN', date:'2026-06-14', time:'23:59', price:'€22',  priceNum:22,  status:'avail', cat:'concert',    lng:2.1690, lat:41.3744 },
  { id:'e15', title:'Liga ASOBAL · Derbi',          venue:'Pavelló Municipal',  area:'Pedralbes',    dateShort:'LUN 23 JUN', date:'2026-06-23', time:'11:00', price:'€40',  priceNum:40,  status:'soon',  cat:'balonmano',  lng:2.1086, lat:41.3886 },
  { id:'e16', title:'Cata de Vinos Penedès',       venue:'Wine Loft',          area:'Gràcia',       dateShort:'JUE 12 JUN', date:'2026-06-12', time:'19:00', price:'€42',  priceNum:42,  status:'avail', cat:'experience', lng:2.1563, lat:41.4034 },
];

// índice por id para acceso rápido
const EV = Object.fromEntries(EVENTS.map(e => [e.id, e]));

// colecciones que alimentan cada sección de la Home
const NEARBY      = ['e1', 'e4', 'e3', 'e8', 'e14', 'e13'];
const POPULAR     = ['e2', 'e6', 'e7', 'e11', 'e10', 'e9'];
const PREMIUM     = ['e6', 'e3', 'e10', 'e15'];
const RECOMMENDED = ['e5', 'e12', 'e16', 'e9'];
const TREND = [
  { id:'e7',  rank:1, dir:'up' },
  { id:'e2',  rank:2, dir:'up' },
  { id:'e1',  rank:3, dir:'down' },
  { id:'e6',  rank:4, dir:'up' },
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
