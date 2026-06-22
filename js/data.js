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
  sport:      'repeating-linear-gradient(125deg,#16252b 0 16px,#101e23 16px 32px)',
  experience: 'repeating-linear-gradient(125deg,#2c271f 0 16px,#241f19 16px 32px)',
};

// etiqueta de categoría en español (para el placeholder "imagen · …")
const CATNAME = {
  concert: 'concierto', festival: 'festival', football: 'fútbol',
  sport: 'deporte', experience: 'experiencia',
};

// estados de disponibilidad de entradas
const STATUS = {
  avail: { text: 'Disponible',       bg: 'rgba(17,24,39,.55)', color: '#fff', dot: '#34D399' },
  last:  { text: 'Últimas entradas', bg: AC,                   color: '#fff', dot: 'transparent' },
  soon:  { text: 'Próximamente',     bg: 'rgba(17,24,39,.62)', color: '#fff', dot: '#9CA3AF' },
};

// catálogo de eventos
const EVENTS = [
  { id:'e1',  title:'Lúa Nova · Gira 2026',       venue:'Palau Sant Jordi',   area:'Montjuïc',     dateShort:'SÁB 14 JUN', time:'21:00', price:'€45',  status:'avail', cat:'concert' },
  { id:'e2',  title:'Electronit Festival',         venue:'Parc del Fòrum',     area:'Sant Martí',   dateShort:'VIE 27 JUN', time:'18:00', price:'€62',  status:'last',  cat:'festival' },
  { id:'e3',  title:'Derbi Mediterráneo',          venue:'RCDE Stadium',       area:'Cornellà',     dateShort:'DOM 22 JUN', time:'16:15', price:'€38',  status:'avail', cat:'football' },
  { id:'e4',  title:'Indie Sessions Vol. 4',       venue:'Razzmatazz',         area:'Poblenou',     dateShort:'JUE 19 JUN', time:'20:30', price:'€24',  status:'last',  cat:'concert' },
  { id:'e5',  title:'Flamenco Roots Live',         venue:'Teatre Grec',        area:'Montjuïc',     dateShort:'MIÉ 02 JUL', time:'22:00', price:'€30',  status:'avail', cat:'experience' },
  { id:'e6',  title:'Champions Night · Octavos',   venue:'Estadi Olímpic',     area:'Montjuïc',     dateShort:'MAR 24 JUN', time:'21:00', price:'€85',  status:'soon',  cat:'football' },
  { id:'e7',  title:'Litoral Sound 2026',          venue:'Parc del Fòrum',     area:'Sant Martí',   dateShort:'SÁB 05 JUL', time:'17:00', price:'€120', status:'last',  cat:'festival' },
  { id:'e8',  title:'Cena en las Alturas',         venue:'Rooftop Eixample',   area:'Eixample',     dateShort:'VIE 13 JUN', time:'20:00', price:'€55',  status:'avail', cat:'experience' },
  { id:'e9',  title:'Jazz al Fòrum',               venue:"L'Auditori",         area:'El Clot',      dateShort:'JUE 26 JUN', time:'20:00', price:'€28',  status:'avail', cat:'concert' },
  { id:'e10', title:'Eurolliga · Jornada 21',      venue:'Palau Municipal',    area:'Les Corts',    dateShort:'VIE 20 JUN', time:'20:45', price:'€19',  status:'avail', cat:'sport' },
  { id:'e11', title:'Vibra Festival',              venue:'Poble Espanyol',     area:'Montjuïc',     dateShort:'SÁB 28 JUN', time:'19:00', price:'€49',  status:'soon',  cat:'festival' },
  { id:'e12', title:'Tour Gastronòmic del Born',   venue:'El Born',            area:'Ciutat Vella', dateShort:'DOM 15 JUN', time:'12:00', price:'€35',  status:'avail', cat:'experience' },
  { id:'e13', title:'Atardecer en Montjuïc',       venue:'Teleférico',         area:'Montjuïc',     dateShort:'SÁB 21 JUN', time:'19:30', price:'€18',  status:'last',  cat:'experience' },
  { id:'e14', title:'Noche Electrónica',           venue:'Sala Apolo',         area:'Poble-sec',    dateShort:'SÁB 14 JUN', time:'23:59', price:'€22',  status:'avail', cat:'concert' },
  { id:'e15', title:'Open Internacional Tenis',    venue:'RC Tenis BCN',       area:'Pedralbes',    dateShort:'LUN 23 JUN', time:'11:00', price:'€40',  status:'soon',  cat:'sport' },
  { id:'e16', title:'Cata de Vinos Penedès',       venue:'Wine Loft',          area:'Gràcia',       dateShort:'JUE 12 JUN', time:'19:00', price:'€42',  status:'avail', cat:'experience' },
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
