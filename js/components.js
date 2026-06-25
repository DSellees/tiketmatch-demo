/* ============================================================================
   components.js — funciones que devuelven el markup de cada pieza de UI.
   Dependen de: data.js (datos), icons.js (SVG) y `state` (definido en app.js).
   Todas leen el estado en tiempo de llamada, no al cargar.
   ========================================================================== */

// Calcula distancia en km entre dos puntos (lat/lng) usando fórmula Haversine
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistanceKm(km) {
  if (km < 1) return 'A menos de 1 km de ti';
  return 'A ' + km.toFixed(1).replace('.', ',') + ' km de ti';
}

// Título y subtítulo de card: en partidos, el enfrentamiento manda (no nombres de marketing)
function cardHeadlines(d) {
  if (d.homeTeam && d.awayTeam) {
    return {
      title: `${d.homeTeam} vs ${d.awayTeam}`,
      subtitle: d.competition || d.venue,
    };
  }
  return {
    title: d.title,
    subtitle: `${d.venue} · ${d.area}`,
  };
}

function cardStatusBadge(d, extraStyle) {
  if (d.status === 'last') return '';
  return `<div style="display:inline-flex;align-items:center;gap:6px;background:${d.statusBg};color:${d.statusColor};font-size:11px;font-weight:700;padding:5px 10px;border-radius:999px;backdrop-filter:blur(6px);${extraStyle || ''}"><span style="width:6px;height:6px;border-radius:50%;background:${d.dotColor};"></span>${d.statusText}</div>`;
}

function cardPriceBlock(d, theme) {
  return `<div class="card-price card-price--${theme}"><span class="card-price-now">${d.price}</span></div>`;
}

// Decora un evento con todo lo derivado del estado actual (favorito, colores…)
function dec(e) {
  const faved = state.fav.has(e.id);
  const st = STATUS[e.status];
  const d = {
    ...e,
    bg:          CATBG[e.cat],
    label:       'imagen · ' + CATNAME[e.cat],
    heartFill:   faved ? AC : 'rgba(0,0,0,0)',
    heartStroke: faved ? AC : '#ffffff',
    statusText:  st.text,
    statusBg:    e.status === 'last' ? AC : st.bg,
    statusColor: st.color,
    dotColor:    st.dot,
  };
  const ref = state.userLocation || AREA_COORDS[state.location] || AREA_COORDS.Barcelona;
  const km = haversineDistance(ref.lat, ref.lng, e.lat, e.lng);
  d.distanceKm = km;
  d.distanceText = km < 1 ? '< 1 km' : km.toFixed(1) + ' km';
  d.distanceLabel = formatDistanceKm(km);
  return d;
}

function cardDistanceBadge(d, theme) {
  return `<span class="card-distance card-distance--${theme}">${SVG.mapPin(theme === 'dark' ? '#FCA5A5' : '#EF4444', 12)}<span>${d.distanceLabel}</span></span>`;
}

// Renderiza la zona visual de la card: escudos si el evento es un partido,
// o el placeholder de categoría habitual para el resto de eventos.
function cardVisual(d, heightPx) {
  const hasMatch = d.homeCrest && d.awayCrest;
  const h = heightPx || 0;
  const style = `position:absolute;inset:0;background:${d.bg};`;

  const overlay = `<div style="position:absolute;inset:0;background:radial-gradient(130% 90% at 50% -10%,rgba(255,255,255,.08),transparent 55%),linear-gradient(180deg,rgba(17,24,39,0) 45%,rgba(17,24,39,.34));"></div>`;

  if (hasMatch) {
    // Partidos: escudos centrados con VS
    const crestStyle = `width:72px;height:72px;object-fit:contain;`;
    const vsStyle    = `font-family:'Sora',sans-serif;font-weight:800;font-size:13px;color:rgba(255,255,255,.5);letter-spacing:.05em;`;
    // Franja inferior con competición
    const compBadge  = d.competition
      ? `<div style="position:absolute;bottom:10px;left:50%;transform:translateX(-50%);background:rgba(17,24,39,.55);backdrop-filter:blur(6px);color:rgba(255,255,255,.7);font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:4px 12px;border-radius:999px;white-space:nowrap;">${d.competition}</div>`
      : '';
    return `<div style="${style}">
      ${overlay}
      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:18px;">
        <img src="${crestPath(d.homeCrest)}" alt="${d.homeTeam}" style="${crestStyle}" onerror="this.style.display='none'">
        <span style="${vsStyle}">VS</span>
        <img src="${crestPath(d.awayCrest)}" alt="${d.awayTeam}" style="${crestStyle}" onerror="this.style.display='none'">
      </div>
      ${compBadge}
    </div>`;
  }

  // Genérico: placeholder texto
  return `<div style="${style}">
    ${overlay}
    <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:'SF Mono',ui-monospace,monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.34);">${d.label}</div>
  </div>`;
}

// Genera un SVG estilo QR (patrón determinista basado en seed, no escaneable)
function qrSvg(seed, size, fg) {
  if (!size) size = 80; if (!fg) fg = '#111827';
  const N = 21, cx = size / N;
  let s = 0;
  for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) & 0x7FFFFFFF;
  const rng = () => { s = (s * 1103515245 + 12345) & 0x7FFFFFFF; return s / 0x7FFFFFFF; };
  const g = Array.from({length: N}, () => Array(N).fill(false));
  const finder = (r0, c0) => {
    for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) {
      const edge = r === 0 || r === 6 || c === 0 || c === 6;
      g[r0+r][c0+c] = edge || (r >= 2 && r <= 4 && c >= 2 && c <= 4);
    }
  };
  finder(0,0); finder(0,N-7); finder(N-7,0);
  for (let i = 8; i < N-8; i++) g[6][i] = g[i][6] = i % 2 === 0;
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    if (!((r < 9 && (c < 9 || c >= N-8)) || (r >= N-8 && c < 9) || r === 6 || c === 6))
      g[r][c] = rng() > 0.48;
  }
  let rects = '';
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++)
    if (g[r][c]) rects += `<rect x="${+(c*cx).toFixed(1)}" y="${+(r*cx).toFixed(1)}" width="${+cx.toFixed(1)}" height="${+cx.toFixed(1)}" fill="${fg}"/>`;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${rects}</svg>`;
}

// Card de entrada individual (lista)
function ticketCard(e) {
  const isPast = new Date(e.date + 'T12:00:00') < TODAY;
  const qr = qrSvg(e.id, 68, isPast ? '#9CA3AF' : '#111827');
  const sColor = isPast ? '#9CA3AF' : '#16A34A';
  const sBg    = isPast ? '#F3F4F6' : '#F0FDF4';
  const sTxt   = isPast ? 'Usado' : 'Activo';
  return `<div data-ticket-open="${e.id}" style="display:flex;background:#fff;border-radius:20px;overflow:hidden;border:1px solid #EFEFF1;cursor:pointer;margin-bottom:14px;min-height:100px;">
    <div style="width:5px;background:${isPast ? '#E5E7EB' : AC};flex:none;"></div>
    <div style="padding:14px 12px;display:flex;align-items:center;justify-content:center;background:${isPast ? '#F9FAFB' : AS};flex:none;border-right:2px dashed ${isPast ? '#E5E7EB' : 'rgba(255,87,34,.18)'};">
      ${qr}
    </div>
    <div style="flex:1;padding:14px 15px;display:flex;flex-direction:column;justify-content:center;">
      <div style="font-family:'Sora',sans-serif;font-weight:700;font-size:14px;color:${isPast ? '#6B7280' : '#111827'};letter-spacing:-.01em;line-height:1.3;">${e.title}</div>
      <div style="font-size:11.5px;color:#9CA3AF;font-weight:500;margin-top:4px;">${e.dateShort} · ${e.time}</div>
      <div style="font-size:11.5px;color:#9CA3AF;font-weight:500;margin-top:1px;">${e.venue}</div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px;">
        <div style="background:${AS};color:${AC};font-family:'Sora',sans-serif;font-weight:800;font-size:13px;padding:4px 10px;border-radius:999px;">${e.price}</div>
        <div style="background:${sBg};color:${sColor};font-size:11px;font-weight:700;padding:3px 9px;border-radius:999px;display:flex;align-items:center;gap:4px;"><span style="width:5px;height:5px;border-radius:50%;background:${sColor};flex:none;"></span>${sTxt}</div>
      </div>
    </div>
  </div>`;
}

// Pestaña principal de entradas
function ticketsTabView() {
  const upcoming = ['e2','e6','e7','e9'].map(id => EV[id]).filter(Boolean);
  const past     = ['e1','e4','e8','e10'].map(id => EV[id]).filter(Boolean);
  const section = (title, events) => events.length === 0 ? '' :
    `<div style="margin-bottom:28px;">
       <div style="font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:12px;color:#9CA3AF;letter-spacing:.06em;text-transform:uppercase;margin-bottom:14px;">${title}</div>
       ${events.map(e => ticketCard(e)).join('')}
     </div>`;
  return `<div id="content">
    <div style="padding:8px 20px 0;">
      <div style="font-family:'Sora',sans-serif;font-weight:800;font-size:22px;color:#111827;letter-spacing:-.03em;line-height:50px;">Mis entradas</div>
    </div>
    <div style="padding:12px 16px 36px;">
      ${section('Próximas', upcoming)}
      ${section('Pasadas', past)}
    </div>
  </div>`;
}

// Genera el histórico de precio de una entrada (modelo de subasta descendente).
// Usa datos reales si existen (priceHistory/initialPrice/currentPrice/...),
// si no, deriva una curva descendente determinista a partir de priceNum.
function priceTrend(e) {
  const cur  = e.currentPrice || e.priceNum;
  const init = e.initialPrice || Math.round(cur * 1.55);
  const seed = e.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);

  let pts;
  if (Array.isArray(e.priceHistory) && e.priceHistory.length > 1) {
    pts = e.priceHistory.slice();
  } else {
    const n = 7;
    pts = [];
    for (let i = 0; i < n; i++) {
      const frac  = i / (n - 1);
      const base  = init + (cur - init) * Math.pow(frac, 0.8);     // caída suave
      const noise = (((seed * (i + 3)) % 7) - 3) * (init - cur) * 0.012; // micro-ruido
      pts.push(Math.round(base + noise));
    }
    pts[0] = init;
    pts[n - 1] = cur;
  }

  return {
    init, cur, pts,
    dropPct: Math.max(0, Math.round((1 - cur / init) * 100)),
    avail:   e.availableTickets || ((seed % 32) + 7),
    updated: e.lastUpdated || ('hace ' + (((seed % 5) + 1)) + ' h'),
  };
}

// SVG de la gráfica precio/tiempo: línea + área + puntos, tendencia descendente.
function priceChartSvg(pts, gradId) {
  const gid = gradId || 'ptgrad';
  const W = 320, H = 128, padX = 8, padTop = 14, padBot = 14;
  const min = Math.min(...pts), max = Math.max(...pts);
  const range = (max - min) || 1;
  const n = pts.length;
  const X = i => padX + (W - 2 * padX) * (i / (n - 1));
  const Y = p => padTop + (H - padTop - padBot) * (1 - (p - min) / range);

  const line = pts.map((p, i) => `${X(i).toFixed(1)},${Y(p).toFixed(1)}`).join(' ');
  const area = `M${X(0).toFixed(1)},${Y(pts[0]).toFixed(1)} ` +
    pts.map((p, i) => `L${X(i).toFixed(1)},${Y(p).toFixed(1)}`).join(' ') +
    ` L${X(n - 1).toFixed(1)},${H - padBot} L${X(0).toFixed(1)},${H - padBot} Z`;
  const dots = pts.map((p, i) => {
    const last = i === n - 1;
    return `<circle cx="${X(i).toFixed(1)}" cy="${Y(p).toFixed(1)}" r="${last ? 4.6 : 2.4}" fill="${last ? AC : '#fff'}" stroke="${AC}" stroke-width="${last ? 2.4 : 1.6}"/>`;
  }).join('');

  return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block;height:auto;overflow:visible;">
    <defs>
      <linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${AC}" stop-opacity="0.22"/>
        <stop offset="100%" stop-color="${AC}" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <path d="${area}" fill="url(#${gid})"/>
    <polyline points="${line}" fill="none" stroke="${AC}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
    ${dots}
  </svg>`;
}

// Panel reutilizable: tarjeta de evolución de precio con gráfica (insertar donde haga falta)
function priceChartPanel(e, opts) {
  opts = opts || {};
  const t = priceTrend(e);
  const isSoon = e.status === 'soon';
  const availLine = isSoon ? 'Aún no a la venta' : `${t.avail} entradas disponibles`;
  const gradId = 'ptgrad-' + e.id;
  const heading = opts.hideTitle ? '' :
    `<div style="font-family:'Sora',sans-serif;font-weight:700;font-size:15px;color:#1A1A1A;letter-spacing:-.01em;margin:24px 0 10px;">Evolución del precio</div>`;

  return `${heading}
    <div class="price-chart-panel" style="background:#fff;border-radius:20px;padding:16px;box-shadow:0 2px 16px rgba(17,24,39,.05);">
      <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:4px;">
        <div>
          <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:11.5px;font-weight:600;color:#9CA3AF;margin-bottom:3px;">Precio actual</div>
          <div style="display:flex;align-items:flex-end;gap:9px;">
            <span style="font-family:'Sora',sans-serif;font-weight:800;font-size:30px;color:#1A1A1A;letter-spacing:-.03em;line-height:.9;">€${t.cur}</span>
            <span style="font-family:'Plus Jakarta Sans',sans-serif;font-size:15px;font-weight:600;color:#B0B0B0;text-decoration:line-through;margin-bottom:3px;">€${t.init}</span>
          </div>
        </div>
        <span style="display:inline-flex;align-items:center;gap:4px;background:#ECFDF5;color:#16A34A;font-size:12px;font-weight:800;padding:5px 11px;border-radius:999px;">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7l10 10M17 17V9M17 17H9"></path></svg>−${t.dropPct}%
        </span>
      </div>
      <div style="margin:10px 0 6px;">${priceChartSvg(t.pts, gradId)}</div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding-top:12px;border-top:1px solid #F1F1F2;">
        <span style="display:inline-flex;align-items:center;gap:6px;font-family:'Plus Jakarta Sans',sans-serif;font-size:11.5px;font-weight:600;color:#374151;">
          <span style="width:6px;height:6px;border-radius:50%;background:${isSoon ? '#9CA3AF' : '#16A34A'};"></span>${availLine}
        </span>
        <span style="font-family:'Plus Jakarta Sans',sans-serif;font-size:11px;font-weight:500;color:#A3A3A3;">Actualizado ${t.updated}</span>
      </div>
    </div>`;
}

// Ciudad del evento (deriva de la zona/recinto; por defecto Barcelona)
function eventCity(e) {
  const map = { 'Girona': 'Girona', 'Sevilla': 'Sevilla', 'San Sebastián': 'San Sebastián', 'Valencia': 'València' };
  return map[e.area] || 'Barcelona';
}

// Copys de descripción por categoría (demo)
const EVENT_DESC = {
  football:   'Vive el partido desde dentro: ambiente de estadio, afición entregada y noventa minutos de máxima tensión deportiva.',
  basket:     'La mejor cita del baloncesto en cancha, con un ambiente eléctrico de principio a fin y jugadas de altísimo nivel.',
  balonmano:  'Velocidad, intensidad y emoción en un derbi de balonmano que no querrás perderte.',
  concert:    'Una noche de música en directo con un sonido cuidado y una puesta en escena envolvente.',
  festival:   'Varios escenarios, los mejores artistas del momento y una experiencia de festival inolvidable.',
  experience: 'Una experiencia única pensada para disfrutar al máximo, con plazas limitadas y un trato cercano.',
};

// Vista de DETALLE DE EVENTO (previa a la compra) — hero grande + info + CTA
function eventDetailView() {
  const e = EV[state.eventDetail];
  if (!e) return '';
  const d   = dec(e);
  const t   = priceTrend(e);
  const h   = cardHeadlines(d);
  const city = eventCity(e);
  const catLabel = CATNAME[e.cat][0].toUpperCase() + CATNAME[e.cat].slice(1);
  const isSoon = e.status === 'soon';
  const isLast = e.status === 'last';

  // Apertura de puertas = hora del evento − 1 h
  const [hh, mm] = e.time.split(':').map(Number);
  const od = new Date(2000, 0, 1, hh, mm); od.setMinutes(od.getMinutes() - 60);
  const opening = String(od.getHours()).padStart(2, '0') + ':' + String(od.getMinutes()).padStart(2, '0');

  const durationByCat = { football: '≈ 2 h', basket: '≈ 2 h', balonmano: '≈ 1 h 30 min', concert: '≈ 2 h 30 min', festival: 'Todo el día', experience: '≈ 1 h 30 min' };
  const ageByCat      = { football: 'Todos los públicos', basket: 'Todos los públicos', balonmano: 'Todos los públicos', concert: '+16 (menores con adulto)', festival: '+16 (menores con adulto)', experience: 'Todos los públicos' };

  const heroVisual = (d.homeCrest && d.awayCrest)
    ? `<div style="display:flex;align-items:center;justify-content:center;gap:26px;">
        <img src="assets/crests/${d.homeCrest}.png" alt="${d.homeTeam}" style="width:88px;height:88px;object-fit:contain;filter:drop-shadow(0 6px 22px rgba(0,0,0,.7));" onerror="this.style.display='none'">
        <span style="font-family:'Sora',sans-serif;font-weight:800;font-size:15px;color:rgba(255,255,255,.45);letter-spacing:.08em;">VS</span>
        <img src="assets/crests/${d.awayCrest}.png" alt="${d.awayTeam}" style="width:88px;height:88px;object-fit:contain;filter:drop-shadow(0 6px 22px rgba(0,0,0,.7));" onerror="this.style.display='none'">
      </div>`
    : SVG.catIcon(e.cat, 'rgba(255,255,255,.18)', 84);

  // Fila de detalle con icono
  const infoRow = (ico, label, val) =>
    `<div style="display:flex;align-items:center;gap:13px;padding:13px 0;border-bottom:1px solid #F3F4F6;">
       <span style="width:38px;height:38px;border-radius:11px;background:#F6F6F7;display:flex;align-items:center;justify-content:center;flex:none;">${ico}</span>
       <div style="flex:1;min-width:0;">
         <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:11.5px;font-weight:500;color:#9CA3AF;">${label}</div>
         <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:14.5px;font-weight:700;color:#1A1A1A;line-height:1.25;margin-top:1px;">${val}</div>
       </div>
     </div>`;

  const ic = {
    cal:    `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="${AC}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4M16 2v4M3 10h18"></path><rect x="3" y="4" width="18" height="18" rx="2"></rect></svg>`,
    clock:  `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="${AC}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path></svg>`,
    pin:    `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="${AC}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>`,
    city:   `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="${AC}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01"></path></svg>`,
    door:   `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 4h3a2 2 0 0 1 2 2v14M2 20h3M13 20h9M10 12v.01M13 2H7a2 2 0 0 0-2 2v16"></path></svg>`,
    timer:  `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"></circle><path d="M12 9v4l2 2M9 2h6"></path></svg>`,
    user:   `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"></circle><path d="M4 21a8 8 0 0 1 16 0"></path></svg>`,
    ticket: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16a1 1 0 0 1 1 1v3a2 2 0 0 0 0 4v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3a2 2 0 0 0 0-4V7a1 1 0 0 1 1-1Z"></path></svg>`,
  };

  const participants = (d.homeTeam && d.awayTeam)
    ? `<div style="background:#fff;border:1px solid #F0F0F1;border-radius:18px;padding:16px;margin-top:14px;display:flex;align-items:center;justify-content:space-around;">
         <div style="display:flex;flex-direction:column;align-items:center;gap:8px;flex:1;">
           <img src="assets/crests/${d.homeCrest}.png" alt="${d.homeTeam}" style="width:52px;height:52px;object-fit:contain;" onerror="this.style.display='none'">
           <span style="font-family:'Plus Jakarta Sans',sans-serif;font-size:12.5px;font-weight:700;color:#1A1A1A;text-align:center;line-height:1.2;">${d.homeTeam}</span>
         </div>
         <span style="font-family:'Sora',sans-serif;font-weight:800;font-size:14px;color:#C7C9CE;flex:none;padding:0 6px;">VS</span>
         <div style="display:flex;flex-direction:column;align-items:center;gap:8px;flex:1;">
           <img src="assets/crests/${d.awayCrest}.png" alt="${d.awayTeam}" style="width:52px;height:52px;object-fit:contain;" onerror="this.style.display='none'">
           <span style="font-family:'Plus Jakarta Sans',sans-serif;font-size:12.5px;font-weight:700;color:#1A1A1A;text-align:center;line-height:1.2;">${d.awayTeam}</span>
         </div>
       </div>`
    : '';

  const sectionTitle = (txt) =>
    `<div style="font-family:'Sora',sans-serif;font-weight:700;font-size:15px;color:#1A1A1A;letter-spacing:-.01em;margin:24px 0 10px;">${txt}</div>`;

  const ctaLabel  = isSoon ? 'Avísame cuando salga' : (isLast ? 'Comprar · últimas entradas' : 'Comprar entrada');
  const statusBadge = cardStatusBadge(d, 'padding:5px 11px;');

  return `<div style="position:fixed;inset:0;background:#F5F5F6;z-index:30;overflow-y:auto;-webkit-overflow-scrolling:touch;">

    <!-- ── HERO ── -->
    <div style="position:relative;width:100%;height:clamp(320px,54vh,480px);overflow:hidden;background:${d.bg};">
      <div style="position:absolute;inset:0;background:radial-gradient(ellipse 120% 70% at 50% 22%,rgba(255,255,255,.08),transparent 58%),linear-gradient(180deg,rgba(17,24,39,.34) 0%,rgba(17,24,39,0) 30%,rgba(17,24,39,.30) 62%,rgba(17,24,39,.86) 100%);"></div>

      <!-- Barra superior: volver + acciones -->
      <div style="position:absolute;top:0;left:0;right:0;z-index:2;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;">
        <button type="button" data-event-close style="width:40px;height:40px;border-radius:50%;border:none;background:rgba(17,24,39,.38);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;cursor:pointer;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"></path></svg>
        </button>
        <div style="display:flex;gap:10px;">
          <button type="button" data-event-share style="width:40px;height:40px;border-radius:50%;border:none;background:rgba(17,24,39,.38);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;cursor:pointer;">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
          </button>
          <button type="button" data-fav="${e.id}" style="width:40px;height:40px;border-radius:50%;border:none;background:rgba(17,24,39,.38);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;cursor:pointer;">${SVG.heart(d.heartFill, d.heartStroke, 19, e.id)}</button>
        </div>
      </div>

      <div style="position:absolute;inset:0;z-index:1;display:flex;flex-direction:column;padding:72px 22px 40px;box-sizing:border-box;">
        <div style="flex:1;display:flex;align-items:center;justify-content:center;min-height:0;">
          ${heroVisual}
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;text-align:center;">
          <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
            <span style="display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,.92);color:#1A1A1A;font-family:'Plus Jakarta Sans',sans-serif;font-size:11px;font-weight:700;padding:5px 11px;border-radius:999px;">${SVG.catIcon(e.cat, AC, 12)} ${catLabel}</span>
            ${statusBadge}
          </div>
          <div style="font-family:'Sora',sans-serif;font-weight:800;font-size:26px;color:#fff;letter-spacing:-.03em;line-height:1.12;text-shadow:0 2px 14px rgba(0,0,0,.5);max-width:100%;">${h.title}</div>
          <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:15px;font-weight:700;color:rgba(255,255,255,.88);margin-top:8px;line-height:1.35;">${h.subtitle}</div>
          <div style="display:flex;align-items:center;justify-content:center;gap:14px;margin-top:12px;color:rgba(255,255,255,.78);font-size:12.5px;font-weight:600;flex-wrap:wrap;">
            <span style="display:flex;align-items:center;gap:5px;">${SVG.cal('currentColor')} ${e.dateShort} · ${e.time}</span>
            <span style="display:flex;align-items:center;gap:5px;">${SVG.mapPin('currentColor')} ${e.venue}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ── HOJA DE CONTENIDO ── -->
    <div style="position:relative;margin-top:-26px;background:#F5F5F6;border-radius:28px 28px 0 0;padding:8px 18px 130px;">
      <div style="display:flex;justify-content:center;padding:8px 0 4px;"><div style="width:38px;height:4px;border-radius:2px;background:#D8D8DA;"></div></div>

      <!-- Detalles del evento -->
      <div style="background:#fff;border-radius:20px;padding:4px 16px;box-shadow:0 2px 16px rgba(17,24,39,.05);margin-top:8px;">
        ${infoRow(ic.cal, 'Fecha', e.dateShort)}
        ${infoRow(ic.clock, 'Hora', e.time + ' · Puertas ' + opening)}
        ${infoRow(ic.pin, 'Recinto', e.venue + ' · ' + e.area)}
        <div style="display:flex;align-items:center;gap:13px;padding:13px 0;">
          <span style="width:38px;height:38px;border-radius:11px;background:#F6F6F7;display:flex;align-items:center;justify-content:center;flex:none;">${ic.city}</span>
          <div style="flex:1;min-width:0;">
            <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:11.5px;font-weight:500;color:#9CA3AF;">Ciudad</div>
            <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:14.5px;font-weight:700;color:#1A1A1A;line-height:1.25;margin-top:1px;">${city}</div>
          </div>
        </div>
      </div>

      <!-- Participantes (solo deportes) -->
      ${participants}

      <!-- ── GRÁFICA DE PRECIO / TIEMPO ── -->
      ${priceChartPanel(e)}

      <!-- ── DESCRIPCIÓN ── -->
      ${sectionTitle('Sobre el evento')}
      <div style="background:#fff;border-radius:20px;padding:16px 16px 18px;box-shadow:0 2px 16px rgba(17,24,39,.05);">
        <p style="font-family:'Plus Jakarta Sans',sans-serif;font-size:13.5px;font-weight:500;color:#4B5563;line-height:1.6;margin:0 0 14px;">${EVENT_DESC[e.cat] || ''}</p>
        <div style="display:flex;flex-direction:column;gap:9px;">
          ${['Acceso al recinto incluido', isSoon ? 'Reserva con aviso de salida a la venta' : 'Reserva garantizada al instante', 'Entrada digital en tu móvil'].map(txt => `
            <div style="display:flex;align-items:center;gap:9px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${AC}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="flex:none;"><path d="M20 6 9 17l-5-5"></path></svg>
              <span style="font-family:'Plus Jakarta Sans',sans-serif;font-size:13px;font-weight:600;color:#374151;">${txt}</span>
            </div>`).join('')}
        </div>
      </div>

      <!-- ── INFORMACIÓN ADICIONAL ── -->
      ${sectionTitle('Información práctica')}
      <div style="background:#fff;border-radius:20px;padding:4px 16px;box-shadow:0 2px 16px rgba(17,24,39,.05);">
        ${infoRow(ic.door, 'Apertura de puertas', opening + ' (1 h antes)')}
        ${infoRow(ic.timer, 'Duración aproximada', durationByCat[e.cat] || '≈ 2 h')}
        ${infoRow(ic.user, 'Edad mínima', ageByCat[e.cat] || 'Todos los públicos')}
        <div style="display:flex;align-items:center;gap:13px;padding:13px 0;">
          <span style="width:38px;height:38px;border-radius:11px;background:#F6F6F7;display:flex;align-items:center;justify-content:center;flex:none;">${ic.ticket}</span>
          <div style="flex:1;min-width:0;">
            <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:11.5px;font-weight:500;color:#9CA3AF;">Política de entradas</div>
            <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:14.5px;font-weight:700;color:#1A1A1A;line-height:1.25;margin-top:1px;">Nominales · cambios hasta 48 h antes</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── BARRA DE COMPRA STICKY ── -->
    <div style="position:fixed;left:0;right:0;bottom:0;z-index:35;background:rgba(255,255,255,.94);backdrop-filter:blur(12px);border-top:1px solid #ECECEE;padding:12px 18px calc(12px + env(safe-area-inset-bottom));display:flex;align-items:center;gap:14px;">
      <div style="flex:none;">
        <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:11px;font-weight:600;color:#9CA3AF;line-height:1;">Desde</div>
        <div style="display:flex;align-items:baseline;gap:6px;margin-top:3px;">
          <span style="font-family:'Sora',sans-serif;font-weight:800;font-size:23px;color:#1A1A1A;letter-spacing:-.02em;line-height:1;">€${t.cur}</span>
          <span style="font-family:'Plus Jakarta Sans',sans-serif;font-size:12px;font-weight:600;color:#B0B0B0;text-decoration:line-through;">€${t.init}</span>
        </div>
      </div>
      <button type="button" ${isSoon ? 'data-event-notify' : 'data-event-buy'}="${e.id}" style="flex:1;height:52px;border:none;border-radius:15px;background:${isSoon ? '#1A1A1A' : AC};color:#fff;font-family:'Sora',sans-serif;font-weight:700;font-size:15.5px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;letter-spacing:-.01em;">
        ${isSoon ? '' : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16a1 1 0 0 1 1 1v3a2 2 0 0 0 0 4v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3a2 2 0 0 0 0-4V7a1 1 0 0 1 1-1Z"></path></svg>`}
        ${ctaLabel}
      </button>
    </div>
  </div>`;
}

// Vista detalle de una entrada — card premium estilo iOS con notches y QR
function ticketDetailView() {
  const e = EV[state.ticketDetail];
  if (!e) return '';
  const isPast  = new Date(e.date + 'T12:00:00') < TODAY;
  const d       = dec(e);
  const h       = cardHeadlines(d);
  const pageBg  = '#F2F2F2';

  const qrSm = qrSvg(e.id, 132, '#111827');
  const qrXL = qrSvg(e.id, 300, '#ffffff');

  // ID de ticket determinista
  const seed = e.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const ticketId = (seed * 137 + 1001).toString().slice(0, 4) + '-' + (seed * 89 + 2003).toString().slice(0, 4);
  const seat     = 'Sec. ' + String.fromCharCode(65 + (seed % 5)) + ', As. ' + ((seed % 40) + 1);

  // QR fullscreen
  const fullscreen = state.qrFullscreen ? `
    <div data-qr-close style="position:fixed;inset:0;background:#000;z-index:50;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;cursor:pointer;">
      <div style="background:#111;border-radius:24px;padding:24px;">${qrXL}</div>
      <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:11px;font-weight:700;color:rgba(255,255,255,.3);letter-spacing:.16em;text-transform:uppercase;">Toca para cerrar</div>
    </div>` : '';

  // Contenido de la imagen: escudos para partidos, icono de categoría para el resto
  const imageInner = (d.homeCrest && d.awayCrest)
    ? `<div style="display:flex;align-items:center;justify-content:center;gap:22px;">
        <img src="assets/crests/${d.homeCrest}.png" alt="${d.homeTeam}" style="width:78px;height:78px;object-fit:contain;filter:drop-shadow(0 4px 16px rgba(0,0,0,.7));" onerror="this.style.display='none'">
        <span style="font-family:'Sora',sans-serif;font-weight:800;font-size:13px;color:rgba(255,255,255,.4);letter-spacing:.08em;">VS</span>
        <img src="assets/crests/${d.awayCrest}.png" alt="${d.awayTeam}" style="width:78px;height:78px;object-fit:contain;filter:drop-shadow(0 4px 16px rgba(0,0,0,.7));" onerror="this.style.display='none'">
      </div>`
    : SVG.catIcon(e.cat, 'rgba(255,255,255,.16)', 72);

  // Celda de info (label gris + valor oscuro, centrada)
  const cell = (label, val) =>
    `<div style="text-align:center;">
       <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:12px;font-weight:500;color:#9CA3AF;margin-bottom:5px;">${label}</div>
       <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:16px;font-weight:700;color:#1A1A1A;line-height:1.2;">${val}</div>
     </div>`;

  return `<div style="position:fixed;inset:0;background:${pageBg};z-index:30;overflow-y:auto;-webkit-overflow-scrolling:touch;">
    ${fullscreen}

    <!-- Header: volver + título -->
    <div style="display:flex;align-items:center;padding:16px 20px 14px;">
      <button type="button" data-ticket-close style="width:38px;height:38px;border-radius:50%;border:none;background:#fff;box-shadow:0 2px 10px rgba(17,24,39,.10);display:flex;align-items:center;justify-content:center;cursor:pointer;flex:none;">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"></path></svg>
      </button>
      <div style="flex:1;text-align:center;font-family:'Sora',sans-serif;font-weight:700;font-size:17px;color:#1A1A1A;">Entrada</div>
      <div style="width:38px;flex:none;"></div>
    </div>

    <!-- ── Tarjeta de ticket ── -->
    <div style="margin:0 18px 28px;filter:drop-shadow(0 10px 40px rgba(17,24,39,.16));">

      <!-- Parte superior blanca con imagen embebida -->
      <div style="background:#fff;border-radius:28px 28px 0 0;overflow:hidden;padding:0 0 8px;">

        <!-- Imagen del evento a ras de la card (sin márgenes superior/lateral) -->
        <div style="position:relative;width:100%;aspect-ratio:1/1;overflow:hidden;background:${d.bg};display:flex;flex-direction:column;">
          <div style="position:absolute;inset:0;background:radial-gradient(ellipse 120% 75% at 50% 18%,rgba(255,255,255,.08),transparent 55%),linear-gradient(180deg,rgba(17,24,39,.10) 0%,rgba(17,24,39,0) 38%,rgba(17,24,39,.74) 84%,rgba(17,24,39,.95) 100%);"></div>
          <div style="position:relative;z-index:1;flex:1;display:flex;align-items:center;justify-content:center;padding:28px 16px 12px;">
            ${imageInner}
          </div>
          <!-- Texto del evento centrado abajo -->
          <div style="position:relative;z-index:1;padding:0 16px 18px;text-align:center;">
            <div style="font-family:'Sora',sans-serif;font-weight:800;font-size:21px;color:#fff;letter-spacing:-.02em;line-height:1.15;text-shadow:0 2px 12px rgba(0,0,0,.55);">${h.title}</div>
            <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:13px;font-weight:700;color:rgba(255,255,255,.82);margin-top:5px;line-height:1.35;">${h.subtitle}</div>
          </div>
        </div>

        <!-- Info en grid 2 columnas, centrado -->
        <div style="display:grid;grid-template-columns:1fr 1fr;row-gap:20px;column-gap:16px;padding:22px 18px 6px;text-align:center;">
          ${cell('Fecha', e.dateShort)}
          ${cell('Hora', e.time)}
          ${cell('Recinto', e.venue)}
          ${cell('Localidad', seat)}
          ${cell('Titular', state.profileName || 'Titular')}
          ${cell('Referencia', 'ID: ' + ticketId)}
        </div>
      </div>

      <!-- Separador con muescas -->
      <div style="position:relative;background:#fff;height:0;z-index:2;overflow:visible;">
        <div style="position:absolute;left:-18px;top:-16px;width:calc(100% + 36px);height:32px;display:flex;align-items:center;pointer-events:none;">
          <div style="width:32px;height:32px;border-radius:50%;background:${pageBg};flex:none;"></div>
          <div style="flex:1;border-top:1.5px dashed #D1D5DB;margin:0 6px;"></div>
          <div style="width:32px;height:32px;border-radius:50%;background:${pageBg};flex:none;"></div>
        </div>
      </div>

      <!-- Parte inferior blanca: QR -->
      <div style="background:#fff;border-radius:0 0 28px 28px;padding:26px 22px 24px;display:flex;flex-direction:column;align-items:center;gap:14px;">
        <div data-qr-open style="cursor:pointer;position:relative;display:inline-block;">
          ${qrSm}
          <div style="position:absolute;bottom:5px;right:5px;background:rgba(17,24,39,.07);border-radius:5px;padding:2px 6px;font-family:'Plus Jakarta Sans',sans-serif;font-size:8px;font-weight:700;color:#6B7280;display:flex;align-items:center;gap:2px;">
            <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"></path></svg>ampliar
          </div>
        </div>
        <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:11.5px;font-weight:500;color:#B0B0B0;text-align:center;">Muestra este código en el acceso al recinto</div>

        <!-- Apple Wallet -->
        <button type="button" style="width:100%;height:50px;border:none;border-radius:14px;background:#000;color:#fff;font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;margin-top:4px;">
          <svg width="14" height="17" viewBox="0 0 814 1000" fill="white"><path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.5-155.5-98.3C111.5 787.8 47 665.2 47 543.5c0-183.7 120.5-280.9 232.1-280.9 61.5 0 112.8 43.5 150.7 43.5 36.1 0 93.5-46.2 162.4-46.2 26.4 0 108.2 2.6 164.4 100.4zm-180.6-159.8c28.5-35.7 49.2-85.4 49.2-135.1 0-6.9-.6-13.9-1.9-19.5-46.5 1.9-101.6 31.2-135.2 70.6-26.1 29.9-50.9 79.6-50.9 130 0 7.5 1.3 14.9 1.9 17.2 3.2.6 8.4 1.3 13.6 1.3 41.5 0 93.7-28 123.3-64.5z"/></svg>
          Add to Apple Wallet
        </button>
      </div>

    </div>
    <div style="height:env(safe-area-inset-bottom,0px);min-height:12px;"></div>
  </div>`;
}

// Barra de navegación inferior flotante (solo iconos)
function navItem(id, label, paths, hasBadge = false) {
  const active = state.tab === id;
  const cnt = state.fav.size;
  const badge = hasBadge
    ? `<span data-badge class="nav-badge" style="display:${cnt > 0 ? 'flex' : 'none'};">${cnt}</span>`
    : '';
  const svg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
  return `<button type="button" data-tab="${id}" aria-label="${label}" class="nav-item${active ? ' is-active' : ''}">
    <span class="nav-icon">${svg}${badge}</span>
  </button>`;
}

function bottomNav() {
  // Icono de mapa con pin (Lucide map-pinned). Se entrega como <path> sueltos para
  // usar el mismo envoltorio (stroke currentColor, 2px) que el resto de la barra.
  const mapIcon = '<path d="M18 8c0 3.613-3.869 7.429-5.393 8.795a1 1 0 0 1-1.214 0C9.87 15.429 6 11.613 6 8a6 6 0 0 1 12 0"></path><circle cx="12" cy="8" r="2"></circle><path d="M8.714 14h-3.71a1 1 0 0 0-.948.683l-2.004 6A1 1 0 0 0 3 22h18a1 1 0 0 0 .949-1.316l-2-6a1 1 0 0 0-.95-.684h-3.712"></path>';
  return `<nav id="nav">
    <div id="nav-pill">
      ${navItem('home', 'Inicio', '<path d="M3 10.5 12 3l9 7.5"></path><path d="M5.5 9.5V20a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V9.5"></path>')}
      ${navItem('favorites', 'Favoritos', '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"></path>')}
      ${navItem('discover', 'Mapa', mapIcon)}
      ${navItem('tickets', 'Entradas', '<path d="M4 6h16a1 1 0 0 1 1 1v3a2 2 0 0 0 0 4v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3a2 2 0 0 0 0-4V7a1 1 0 0 1 1-1Z"></path><path d="M14 6v12"></path>')}
    </div>
  </nav>`;
}

// ── Notificaciones in-app ─────────────────────────────────────────────────────
function isNotifRead(n) {
  return n.read || state.notificationsRead.has(n.id);
}

function unreadNotifCount() {
  return NOTIFICATIONS.filter(n => !isNotifRead(n)).length;
}

function filterNotifications(query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return NOTIFICATIONS.slice();
  return NOTIFICATIONS.filter(n => {
    const ev = n.eventId ? EV[n.eventId] : null;
    const haystack = [n.title, n.body, ev && ev.title, ev && ev.venue].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(q);
  });
}

function notifIcon(n) {
  const meta = NOTIF_TYPE_META[n.type] || NOTIF_TYPE_META.reminder;
  return `<span class="notif-card-icon" style="background:${meta.bg};">${SVG.notifType(n.type, meta.color, 20)}</span>`;
}

function notificationCard(n) {
  const unread = !isNotifRead(n);
  const chevron = `<svg class="notif-card-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C7C9CE" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"></path></svg>`;
  return `<button type="button" class="notif-card pill-surface${unread ? ' is-unread' : ''}" data-notif-id="${n.id}" aria-label="${n.title}">
    <div class="notif-card-top">
      ${notifIcon(n)}
      <div class="notif-card-main">
        <div class="notif-card-head">
          <div class="notif-card-title">${n.title}</div>
          <time class="notif-card-time">${n.time}</time>
        </div>
        <p class="notif-card-body">${n.body}</p>
      </div>
      ${chevron}
    </div>
  </button>`;
}

function notificationsScreenView() {
  const list = filterNotifications(state.notificationsQuery);
  const sections = ['unread', 'yesterday', 'week'];
  const backArrow = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111827" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"></path></svg>`;

  const sectionBlock = (key) => {
    const items = list.filter(n => n.section === key);
    if (!items.length) return '';
    return `<section class="notif-section" aria-label="${NOTIF_SECTION_LABELS[key]}">
      <div class="notif-section-head">
        <h2 class="notif-section-title">${NOTIF_SECTION_LABELS[key]}</h2>
        <span class="notif-section-badge">${items.length}</span>
      </div>
      <div class="notif-section-list">${items.map(notificationCard).join('')}</div>
    </section>`;
  };

  const body = list.length === 0
    ? `<div class="notif-empty">
         <div class="notif-empty-icon">${SVG.bell('#9CA3AF', 32)}</div>
         <div class="notif-empty-title">Sin resultados</div>
         <div class="notif-empty-text">${state.notificationsQuery.trim()
           ? `No encontramos avisos para «${state.notificationsQuery.trim()}».`
           : 'Cuando haya novedades sobre tus eventos, las verás aquí.'}</div>
       </div>`
    : sections.map(sectionBlock).join('');

  const searchVisible = state.notificationsSearchOpen || state.notificationsQuery.trim().length > 0;

  return `<div id="notifications-screen" aria-label="Notificaciones">
    <header class="notif-header">
      <button type="button" data-notifications-close class="pill-icon-btn notif-header-btn" aria-label="Volver">${backArrow}</button>
      <h1 class="notif-header-title">Notificaciones</h1>
      <button type="button" data-notifications-search-toggle class="pill-icon-btn notif-header-btn${searchVisible ? ' is-active' : ''}" aria-label="Buscar">${SVG.search('#111827', 20)}</button>
    </header>

    ${searchVisible ? `<div class="notif-search-wrap">
      <div class="pill-surface notif-search">
        ${SVG.search('#9CA3AF', 18)}
        <input data-notifications-search type="search" enterkeyhint="search" placeholder="Buscar avisos, eventos…" value="${state.notificationsQuery.replace(/"/g, '&quot;')}" aria-label="Buscar notificaciones">
      </div>
    </div>` : ''}

    <div class="notif-content">${body}</div>
  </div>`;
}

// Avatar circular — imagen real del usuario
function userAvatar(size = 44) {
  const src = state.profileAvatar || 'assets/user/mpv_ic.png';
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;overflow:hidden;flex:none;">
    <img src="${src}" alt="${state.profileName}" style="width:100%;height:100%;object-fit:cover;display:block;">
  </div>`;
}

// Cabecera Home: foto + nombre y debajo ubicación con dropdown
function homeUserHeader() {
  return `<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 20px 0;">
    <div style="display:flex;align-items:center;gap:12px;min-width:0;flex:1;">
      <button type="button" data-tab="profile" aria-label="Mi perfil" style="border:none;background:none;padding:0;flex:none;cursor:pointer;">${userAvatar(56)}</button>
      <div style="min-width:0;flex:1;">
        <div style="font-family:'Sora',sans-serif;font-weight:600;font-size:18px;color:#111827;letter-spacing:-.02em;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${state.profileName}</div>
        <button type="button" data-location-open aria-label="Cambiar ubicación" style="display:flex;align-items:center;gap:5px;margin-top:4px;padding:0;border:none;background:none;max-width:100%;">
          ${SVG.pin('#9CA3AF', 14)}
          <span style="font-family:'Plus Jakarta Sans',sans-serif;font-weight:500;font-size:14px;color:#6B7280;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${state.location}</span>
          ${SVG.chevDown('#9CA3AF', 14)}
        </button>
      </div>
    </div>
    <button type="button" data-notifications-open class="pill-icon-btn" aria-label="Notificaciones" style="width:48px;height:48px;margin-left:10px;position:relative;">
      ${SVG.bell('#111827', 22)}
      ${unreadNotifCount() > 0 ? `<span class="notif-bell-badge">${unreadNotifCount()}</span>` : ''}
    </button>
  </div>`;
}

// Pantalla de mapa (vista grande + buscador + filtros por categoría + preview)
function mapTabView() {
  const cats = [{ id: 'all', label: 'Todos' }, ...FILTER_SECTIONS[0].options];
  const chips = cats.map(c => {
    const on = c.id === 'all' ? state.mapCat.size === 0 : state.mapCat.has(c.id);
    return `<button type="button" data-map-cat="${c.id}" class="map-chip${on ? ' is-active' : ''}">${c.label}</button>`;
  }).join('');

  return `<section id="map-screen" aria-label="Mapa de eventos">
    <div id="map-canvas" aria-label="Mapa"></div>

    <div id="map-overlay-top">
      <form id="map-search-form" data-map-search-form>
        ${SVG.search('#9CA3AF', 18)}
        <input
          type="search"
          data-map-search-input
          enterkeyhint="search"
          placeholder="Buscar lugar..."
          aria-label="Buscar en el mapa"
        >
      </form>
      <div id="map-chips" data-scroll role="group" aria-label="Filtrar por categoría">${chips}</div>
    </div>

    <div id="map-status" aria-live="polite"></div>
    <div id="map-preview" aria-live="polite"></div>
  </section>`;
}

// Mini-card flotante anclada a cada punto del mapa (se inserta como marcador DOM)
function mapMarkerMarkup(e) {
  return `
    <div class="ev-card">
      <span class="ev-thumb" style="background:${CATBG[e.cat]};"><span class="ev-thumb-ic">${SVG.catIcon(e.cat, '#fff', 14)}</span></span>
      <span class="ev-meta">
        <span class="ev-t">${e.title}</span>
        <span class="ev-s">${e.price} · ${e.dateShort}</span>
      </span>
    </div>
    <span class="ev-dot"></span>`;
}

// Card de detalle (blanca) usada dentro del carrusel del mapa
function mapPreviewCard(e) {
  const d = dec(e);
  return `<article class="map-preview-card" data-eid="${e.id}">
    <div class="map-preview-hero" style="background:${d.bg};">
      <div class="map-preview-hero-shine"></div>
      <div class="map-preview-hero-icon">${SVG.catIcon(e.cat, 'rgba(255,255,255,.92)', 30)}</div>
      <div class="map-preview-hero-grad"></div>
      <button type="button" data-fav="${e.id}" class="map-preview-fav" aria-label="Guardar">${SVG.heart(d.heartFill, d.heartStroke, 18, e.id)}</button>
      <button type="button" data-map-preview-close class="map-preview-close" aria-label="Cerrar">${SVG.close('#fff', 16)}</button>
      <span class="map-preview-hero-price">${d.price}</span>
      <span class="map-preview-status map-preview-hero-status" style="background:${d.statusBg};color:${d.statusColor};"><span style="background:${d.dotColor};"></span>${d.statusText}</span>
    </div>
    <div class="map-preview-body">
      <div class="map-preview-title">${d.title}</div>
      <div class="map-preview-line map-preview-date">${SVG.cal(AC, 13)}<span>${d.dateShort} · ${d.time}</span></div>
      <div class="map-preview-line">${SVG.mapPin('#9CA3AF', 13)}<span>${d.venue} · ${d.area}</span></div>
      <div class="map-preview-actions">
        <button type="button" data-event-open="${e.id}" class="map-preview-btn map-preview-ghost">Ver detalle</button>
        <button type="button" data-event-open="${e.id}" class="map-preview-btn map-preview-cta">Comprar</button>
      </div>
    </div>
  </article>`;
}

// Tarjeta estándar (imagen arriba, ficha debajo)
function cardStd(e) {
  const d = dec(e);
  const h = cardHeadlines(d);
  const statusBadge = cardStatusBadge(d);
  return `<div class="home-card" data-event-open="${e.id}" style="width:100%;font-family:'Plus Jakarta Sans',-apple-system,sans-serif;background:#fff;cursor:pointer;">
    <div style="position:relative;width:100%;aspect-ratio:1.55;border-radius:18px;overflow:hidden;">
      ${cardVisual(d)}
      <div style="position:absolute;top:10px;left:10px;max-width:calc(100% - 56px);">${cardPriceBlock(d, 'light')}</div>
      <button data-fav="${e.id}" style="position:absolute;top:10px;right:10px;width:34px;height:34px;border:none;border-radius:50%;background:rgba(17,24,39,.42);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:0;">${SVG.heart(d.heartFill, d.heartStroke, 17, e.id)}</button>
      ${statusBadge ? `<div style="position:absolute;bottom:10px;left:10px;">${statusBadge}</div>` : ''}
      <div style="position:absolute;bottom:10px;right:10px;">${cardDistanceBadge(d, 'light')}</div>
    </div>
    <div style="padding:12px 2px 2px;">
      <div style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;">${SVG.cal(AC)}<span style="color:#6B7280;">${d.dateShort} · ${d.time}</span></div>
      <div style="font-family:'Sora',sans-serif;font-weight:700;font-size:15px;color:#111827;margin-top:7px;line-height:1.25;letter-spacing:-.01em;">${h.title}</div>
      <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:13.5px;font-weight:700;color:#374151;margin-top:5px;line-height:1.35;">${h.subtitle}</div>
      <div style="display:inline-flex;align-items:center;gap:5px;margin-top:11px;background:${AS};color:${AC};font-size:11px;font-weight:800;padding:5px 10px;border-radius:999px;"><span style="width:5px;height:5px;border-radius:50%;background:${AC};"></span>Venta en Catchtime</div>
    </div>
  </div>`;
}

// Tarjeta editorial (imagen inmersiva, texto superpuesto)
function cardEdit(e) {
  const d = dec(e);
  const h = cardHeadlines(d);
  const statusBadge = cardStatusBadge(d, 'padding:5px 11px;');
  return `<div class="home-card" data-event-open="${e.id}" style="position:relative;width:100%;height:392px;border-radius:22px;overflow:hidden;font-family:'Plus Jakarta Sans',sans-serif;display:flex;flex-direction:column;justify-content:space-between;cursor:pointer;">
    ${cardVisual(d)}
    <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(17,24,39,.22) 0%,rgba(17,24,39,0) 32%,rgba(17,24,39,.55) 68%,rgba(17,24,39,.93) 100%);pointer-events:none;"></div>
    <div style="position:relative;z-index:1;display:flex;align-items:flex-start;justify-content:space-between;padding:14px;gap:10px;">
      <div style="max-width:calc(100% - 52px);">${cardPriceBlock(d, 'dark')}</div>
      <button data-fav="${e.id}" style="width:38px;height:38px;border:none;border-radius:50%;background:rgba(255,255,255,.18);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:0;flex:none;">${SVG.heart(d.heartFill, d.heartStroke, 19, e.id)}</button>
    </div>
    <div style="position:relative;z-index:1;padding:16px 16px 18px;display:flex;flex-direction:column;gap:9px;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">
        ${statusBadge}
        ${cardDistanceBadge(d, 'dark')}
      </div>
      <div style="font-family:'Sora',sans-serif;font-weight:800;font-size:22px;color:#fff;line-height:1.12;letter-spacing:-.02em;">${h.title}</div>
      <div style="font-size:14px;font-weight:700;color:rgba(255,255,255,.88);line-height:1.35;">${h.subtitle}</div>
      <div style="display:flex;align-items:center;gap:14px;color:rgba(255,255,255,.72);font-size:12.5px;font-weight:600;flex-wrap:wrap;">
        <span style="display:flex;align-items:center;gap:5px;">${SVG.cal('currentColor')}${d.dateShort} · ${d.time}</span>
        ${!(d.homeTeam && d.awayTeam) ? `<span style="display:flex;align-items:center;gap:5px;min-width:0;overflow:hidden;">${SVG.mapPin('currentColor')}<span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${d.venue}</span></span>` : ''}
      </div>
      <div style="display:inline-flex;align-self:flex-start;align-items:center;gap:6px;margin-top:2px;background:rgba(255,255,255,.16);backdrop-filter:blur(6px);color:#fff;font-size:11px;font-weight:800;padding:5px 11px;border-radius:999px;"><span style="width:5px;height:5px;border-radius:50%;background:${AC};"></span>Venta en Catchtime</div>
    </div>
  </div>`;
}

// chip de filtro (activo / inactivo)
function filterChip(group, option, filters) {
  const multi = group === 'cat' || group === 'status';
  const active = multi ? filters[group].has(option.id) : filters[group] === option.id;
  const bg = active ? AC : '#fff';
  const color = active ? '#fff' : '#374151';
  const border = active ? AC : '#EFEFF1';
  return `<button type="button" data-filter-group="${group}" data-filter-value="${option.id}" style="border:1.5px solid ${border};background:${bg};color:${color};font-size:13.5px;font-weight:600;padding:10px 16px;border-radius:999px;white-space:nowrap;">${option.label}</button>`;
}

// Panel modal de filtros
function filterPanel(filters) {
  const sections = FILTER_SECTIONS.map(sec => `
    <div style="margin-bottom:22px;">
      <div style="font-family:'Sora',sans-serif;font-weight:700;font-size:16px;color:#111827;margin-bottom:12px;">${sec.title}</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;">${sec.options.map(opt => filterChip(sec.key, opt, filters)).join('')}</div>
    </div>`).join('');

  return `<div id="filters" role="dialog" aria-modal="true" aria-label="Filtros">
    <div style="position:absolute;inset:0;background:#fff;display:flex;flex-direction:column;">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px 10px;border-bottom:1px solid #F3F4F6;">
        <button type="button" data-filter-close style="width:40px;height:40px;border-radius:50%;border:1px solid #EFEFF1;background:#fff;display:flex;align-items:center;justify-content:center;">${SVG.close('#111827')}</button>
        <div style="font-family:'Sora',sans-serif;font-weight:700;font-size:17px;color:#111827;">Filtros</div>
        <button type="button" data-filter-clear style="border:none;background:none;color:${AC};font-size:14px;font-weight:700;">Limpiar</button>
      </div>
      <div style="flex:1;overflow-y:auto;padding:20px 20px 100px;">${sections}</div>
      <div style="position:absolute;left:0;right:0;bottom:0;padding:16px 20px calc(16px + env(safe-area-inset-bottom));background:linear-gradient(180deg,rgba(255,255,255,0) 0%,#fff 24%);">
        <button type="button" data-filter-apply style="width:100%;height:54px;border:none;border-radius:999px;background:${AC};color:#fff;font-family:'Sora',sans-serif;font-weight:700;font-size:16px;">Aplicar filtros</button>
      </div>
    </div>
  </div>`;
}

// Pantalla de selección de ubicación (ciudad / zona)
function locationPanel(query) {
  const q = (query || '').trim().toLowerCase();
  const zones  = NEARBY_ZONES.filter(z => (z.name + ' ' + z.meta).toLowerCase().includes(q));
  const cities = POPULAR_CITIES.filter(c => c.toLowerCase().includes(q));

  const row = (value, title, meta, icon) => {
    const active = value === state.location;
    return `<button type="button" data-location-pick="${value.replace(/"/g, '&quot;')}" style="display:flex;align-items:center;gap:13px;width:100%;padding:13px 2px;border:none;border-bottom:1px solid #F3F4F6;background:none;text-align:left;font-family:'Plus Jakarta Sans',sans-serif;">
      <span style="width:40px;height:40px;border-radius:13px;background:${active ? AS : '#F4F4F5'};display:flex;align-items:center;justify-content:center;flex:none;">${icon(active ? AC : '#9CA3AF')}</span>
      <span style="flex:1;min-width:0;">
        <span style="display:block;font-family:'Sora',sans-serif;font-weight:700;font-size:15px;color:#111827;letter-spacing:-.01em;">${title}</span>
        ${meta ? `<span style="display:block;color:#9CA3AF;font-size:12.5px;font-weight:500;margin-top:1px;">${meta}</span>` : ''}
      </span>
      ${active ? SVG.check(AC) : ''}
    </button>`;
  };

  const section = (title, html) => html
    ? `<div style="margin-top:24px;">
        <div style="font-family:'Sora',sans-serif;font-weight:700;font-size:12px;color:#9CA3AF;text-transform:uppercase;letter-spacing:.07em;margin-bottom:2px;">${title}</div>
        ${html}
      </div>` : '';

  const zonesHtml  = zones.map(z => row(z.name, z.name, z.meta, c => SVG.mapPin(c, 18))).join('');
  const citiesHtml = cities.map(c => row(c, c, null, col => SVG.pin(col, 18))).join('');

  const empty = (!zones.length && !cities.length)
    ? `<div style="padding:54px 20px;text-align:center;">
        <div style="font-family:'Sora',sans-serif;font-weight:700;font-size:18px;color:#111827;">Sin resultados</div>
        <div style="color:#9CA3AF;font-size:14px;margin-top:8px;line-height:1.5;">No encontramos «${query.trim()}». Prueba con otra ciudad o zona.</div>
      </div>`
    : '';

  return `<div id="location" role="dialog" aria-modal="true" aria-label="Elegir ubicación">
    <div style="position:absolute;inset:0;background:#fff;display:flex;flex-direction:column;">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px 10px;border-bottom:1px solid #F3F4F6;">
        <button type="button" data-location-close style="width:40px;height:40px;border-radius:50%;border:1px solid #EFEFF1;background:#fff;display:flex;align-items:center;justify-content:center;">${SVG.close('#111827')}</button>
        <div style="font-family:'Sora',sans-serif;font-weight:700;font-size:17px;color:#111827;">Ubicación</div>
        <span style="width:40px;"></span>
      </div>

      <div style="padding:14px 20px 0;">
        <div style="display:flex;align-items:center;gap:10px;height:50px;background:#F4F4F5;border-radius:16px;padding:0 14px;">
          ${SVG.search('#9CA3AF')}
          <input data-location-search type="search" enterkeyhint="search" placeholder="Busca ciudad, zona o barrio…" value="${(query || '').replace(/"/g, '&quot;')}" style="flex:1;border:none;outline:none;background:transparent;color:#111827;font-size:14.5px;font-weight:500;font-family:inherit;">
        </div>
      </div>

      <div style="flex:1;overflow-y:auto;padding:0 20px 40px;">
        <button type="button" data-location-current ${state.locationLoading ? 'disabled' : ''} style="display:flex;align-items:center;gap:13px;width:100%;margin-top:16px;padding:13px 14px;border:none;border-radius:16px;background:${AS};text-align:left;${state.locationLoading ? 'opacity:.7;' : ''}">
          <span style="width:40px;height:40px;border-radius:13px;background:#fff;display:flex;align-items:center;justify-content:center;flex:none;">${SVG.locate(AC)}</span>
          <span style="flex:1;font-family:'Sora',sans-serif;font-weight:700;font-size:15px;color:${AC};">${state.locationLoading ? 'Buscando tu ubicación…' : 'Usar mi ubicación actual'}</span>
        </button>
        ${state.locationError ? `<div style="display:flex;align-items:flex-start;gap:8px;margin-top:10px;padding:11px 13px;border-radius:13px;background:#FEF2F2;color:#B91C1C;font-size:12.5px;font-weight:600;line-height:1.4;">${state.locationError}</div>` : ''}
        ${empty || (section('Cerca de ti', zonesHtml) + section('Ciudades populares', citiesHtml))}
      </div>
    </div>
  </div>`;
}

// Resultados de búsqueda / filtrado
function searchResults(ids, query) {
  if (!ids.length) {
    return `<div style="padding:48px 20px;text-align:center;">
      <div style="font-family:'Sora',sans-serif;font-weight:700;font-size:18px;color:#111827;">Sin resultados</div>
      <div style="color:#9CA3AF;font-size:14px;margin-top:8px;line-height:1.5;">Prueba con otras palabras o ajusta los filtros.</div>
    </div>`;
  }
  const label = query.trim()
    ? `${ids.length} resultado${ids.length === 1 ? '' : 's'} para «${query.trim()}»`
    : `${ids.length} evento${ids.length === 1 ? '' : 's'}`;
  return `<div style="padding:0 20px 8px;">
    <div style="color:#6B7280;font-size:13px;font-weight:600;margin-bottom:14px;">${label}</div>
    <div style="display:flex;flex-direction:column;gap:18px;">${ids.map(id => cardStd(EV[id])).join('')}</div>
  </div>`;
}

// Fila de ranking "trending"
function trendRow(t) {
  const d = dec(EV[t.id]);
  const h = cardHeadlines(d);
  const dirPath  = t.dir === 'up' ? 'M6 15l6-6 6 6' : t.dir === 'down' ? 'M6 9l6 6 6-6' : 'M5 12h14';
  const dirColor = t.dir === 'up' ? AC : '#9CA3AF';
  return `<div data-event-open="${t.id}" style="display:flex;align-items:center;gap:12px;padding:13px 0;border-bottom:1px solid #F3F4F6;font-family:'Plus Jakarta Sans',sans-serif;cursor:pointer;">
    <div style="width:20px;text-align:center;font-family:'Sora',sans-serif;font-weight:800;font-size:17px;color:#111827;flex:none;">${t.rank}</div>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${dirColor}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" style="flex:none;"><path d="${dirPath}"></path></svg>
    <div style="position:relative;width:52px;height:52px;flex:none;border-radius:12px;overflow:hidden;"><div style="position:absolute;inset:0;background:${d.bg};"></div><div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(17,24,39,0) 40%,rgba(17,24,39,.3));"></div></div>
    <div style="flex:1;min-width:0;">
      <div style="font-family:'Sora',sans-serif;font-weight:700;font-size:14px;color:#111827;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:-.01em;">${h.title}</div>
      <div style="font-size:12.5px;font-weight:700;color:#374151;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${h.subtitle}</div>
      <div style="color:#9CA3AF;font-size:11px;font-weight:500;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${d.dateShort} · ${d.time}</div>
      <div style="margin-top:4px;">${cardDistanceBadge(d, 'trend')}</div>
    </div>
    <div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px;flex:none;">
      <span style="font-family:'Sora',sans-serif;font-weight:800;font-size:14px;color:#111827;">${d.price}</span>
      <span style="display:inline-flex;align-items:center;gap:3px;color:${AC};font-size:9.5px;font-weight:800;"><span style="width:4px;height:4px;border-radius:50%;background:${AC};"></span>Catchtime</span>
    </div>
  </div>`;
}

// ── Pantalla de Favoritos ─────────────────────────────────────────────────────
function favoritesTabView() {
  const favIds = EVENTS
    .filter(e => state.fav.has(e.id))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(e => e.id);

  const heartIcon = `<svg width="46" height="46" viewBox="0 0 24 24" fill="${AS}" stroke="${AC}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"></path></svg>`;

  if (favIds.length === 0) {
    return `<div id="content" style="display:flex;flex-direction:column;min-height:100%;">
      <!-- Cabecera -->
      <div style="padding:6px 20px 0;">
        <div style="font-family:'Sora',sans-serif;font-weight:800;font-size:22px;color:#111827;letter-spacing:-.03em;line-height:50px;">Favoritos</div>
      </div>
      <!-- Estado vacío -->
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 36px 80px;text-align:center;">
        <div style="width:96px;height:96px;border-radius:32px;background:${AS};display:flex;align-items:center;justify-content:center;margin-bottom:24px;">
          ${heartIcon}
        </div>
        <div style="font-family:'Sora',sans-serif;font-weight:800;font-size:20px;color:#111827;letter-spacing:-.03em;line-height:1.2;margin-bottom:10px;">Aún no tienes favoritos</div>
        <div style="color:#9CA3AF;font-size:14px;font-weight:500;line-height:1.65;max-width:240px;">Pulsa el corazón en cualquier evento para guardarlo aquí y no perdértelo.</div>
        <button type="button" data-tab="home" style="margin-top:32px;display:inline-flex;align-items:center;gap:9px;border:none;border-radius:999px;background:${AC};color:#fff;font-family:'Sora',sans-serif;font-weight:700;font-size:14.5px;padding:15px 32px;cursor:pointer;">Explorar eventos</button>
      </div>
    </div>`;
  }

  const countBadge = `<span style="display:inline-flex;align-items:center;gap:5px;background:${AS};color:${AC};font-family:'Plus Jakarta Sans',sans-serif;font-size:11px;font-weight:800;padding:5px 12px;border-radius:999px;">${favIds.length} guardado${favIds.length === 1 ? '' : 's'}</span>`;

  // Agrupa por fecha más próxima: próximos esta semana vs. más adelante
  const now = TODAY.getTime();
  const weekMs = 7 * 24 * 3600 * 1000;
  const upcoming = favIds.filter(id => {
    const d = new Date(EV[id].date + 'T12:00:00');
    return d.getTime() - now <= weekMs && d.getTime() >= now;
  });
  const later = favIds.filter(id => !upcoming.includes(id));

  const sectionTitle = (txt) =>
    `<div style="font-family:'Sora',sans-serif;font-weight:700;font-size:13px;color:#9CA3AF;text-transform:uppercase;letter-spacing:.08em;margin:20px 0 12px;">${txt}</div>`;

  const cardList = (ids) =>
    `<div style="display:flex;flex-direction:column;gap:18px;">${ids.map(id => cardStd(EV[id])).join('')}</div>`;

  const sections = [
    upcoming.length ? sectionTitle('Esta semana') + cardList(upcoming) : '',
    later.length    ? sectionTitle(upcoming.length ? 'Más adelante' : 'Todos los eventos') + cardList(later) : '',
  ].join('');

  return `<div id="content">
    <!-- Cabecera -->
    <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 20px 0;min-height:50px;">
      <div style="font-family:'Sora',sans-serif;font-weight:800;font-size:22px;color:#111827;letter-spacing:-.03em;">Favoritos</div>
      ${countBadge}
    </div>
    <!-- Lista agrupada -->
    <div style="padding:4px 20px 12px;">${sections}</div>
  </div>`;
}

// ── Pantalla de Perfil ────────────────────────────────────────────────────────
function profileTabView() {
  const ic = (paths, c = '#6B7280') =>
    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;

  const chevron = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C7C9CE" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"></path></svg>`;

  const card = content =>
    `<div style="background:#fff;border:1px solid #EFEFF1;border-radius:18px;overflow:hidden;">${content}</div>`;

  const row = (iconSvg, label, value = '', panelId = '', last = false) => {
    const attrs = panelId === 'location'
      ? 'data-profile-open-location'
      : panelId && panelId.startsWith('tab:')
        ? `data-tab="${panelId.slice(4)}"`
        : panelId ? `data-profile-panel="${panelId}"` : '';
    return `<div ${attrs} style="display:flex;align-items:center;gap:13px;padding:15px 16px;${last ? '' : 'border-bottom:1px solid #F3F4F6;'}cursor:pointer;">
      <span style="flex:none;display:flex;align-items:center;justify-content:center;width:34px;">${iconSvg}</span>
      <span style="flex:1;font-family:'Plus Jakarta Sans',sans-serif;font-weight:600;font-size:15px;color:#111827;">${label}</span>
      ${value ? `<span style="font-family:'Plus Jakarta Sans',sans-serif;font-size:13px;font-weight:500;color:#9CA3AF;margin-right:4px;">${value}</span>` : ''}
      ${chevron}
    </div>`;
  };

  const section = (title, content) =>
    `<div style="margin-bottom:8px;">
      <div style="font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:12px;color:#9CA3AF;letter-spacing:.06em;text-transform:uppercase;padding:0 4px;margin-bottom:8px;">${title}</div>
      ${card(content)}
    </div>`;

  const iEdit   = ic('<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"></path>');
  const iBell   = ic('<path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 8 2.5 8h-17S6 15 6 9Z"></path><path d="M10.5 21a1.8 1.8 0 0 0 3 0"></path>');
  const iCard   = ic('<rect x="2" y="5" width="20" height="14" rx="2"></rect><path d="M2 10h20"></path>');
  const iTicket = ic('<path d="M4 6h16a1 1 0 0 1 1 1v3a2 2 0 0 0 0 4v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3a2 2 0 0 0 0-4V7a1 1 0 0 1 1-1Z"></path><path d="M14 6v12"></path>');
  const iPin    = ic('<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle>');
  const iTag    = ic('<path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.41 0l7.3-7.3a1 1 0 0 0 0-1.41Z"></path><circle cx="7" cy="7" r="1"></circle>');
  const iGlobe  = ic('<circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 1 0 20M12 2a14.5 14.5 0 0 0 0 20M2 12h20"></path>');
  const iHelp   = ic('<circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><circle cx="12" cy="17" r=".5" fill="#6B7280"></circle>');
  const iMail   = ic('<rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>');
  const iStar   = ic('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>');
  const iShield = ic('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"></path>');
  const iFile   = ic('<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4M10 9H8M16 13H8M16 17H8"></path>');
  const iPencil = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"></path></svg>`;

  const savedAmount = '€127';
  const catLabel = [...state.profileCats].map(c => {
    const n = CATNAME[c] || c; return n[0].toUpperCase() + n.slice(1);
  }).join(', ');

  const nameArea = state.profileEditingName
    ? `<input data-profile-name-input type="text" value="${state.profileName.replace(/"/g,'&quot;')}" style="font-family:'Sora',sans-serif;font-weight:700;font-size:18px;color:#111827;letter-spacing:-.02em;border:none;border-bottom:2px solid ${AC};outline:none;background:transparent;padding:0 0 2px;width:100%;-webkit-appearance:none;">`
    : `<div style="display:flex;align-items:center;gap:7px;">
         <span style="font-family:'Sora',sans-serif;font-weight:700;font-size:18px;color:#111827;letter-spacing:-.02em;">${state.profileName}</span>
         <button type="button" data-profile-name-tap style="border:none;background:none;padding:3px;display:flex;align-items:center;cursor:pointer;">${iPencil}</button>
       </div>`;

  return `<div id="content">

    <!-- Cabecera -->
    <div style="padding:8px 20px 0;">
      <div style="font-family:'Sora',sans-serif;font-weight:800;font-size:22px;color:#111827;letter-spacing:-.03em;line-height:50px;">Mi perfil</div>
    </div>

    <!-- Avatar + nombre -->
    <div style="display:flex;align-items:center;gap:15px;padding:8px 20px 20px;">
      <button type="button" data-profile-panel="editProfile" aria-label="Editar perfil" style="border:none;background:none;padding:0;flex:none;cursor:pointer;">${userAvatar(64)}</button>
      <div style="flex:1;min-width:0;">
        ${nameArea}
        <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:13.5px;font-weight:500;color:#9CA3AF;margin-top:4px;">demo@catchtime.app</div>
      </div>
    </div>

    <!-- Card de ahorro -->
    <div style="margin:0 16px 24px;">
      <div style="background:${AS};border:1px solid rgba(255,87,34,.14);border-radius:18px;padding:18px 20px;display:flex;align-items:center;gap:16px;">
        <div style="width:48px;height:48px;border-radius:14px;background:${AC};display:flex;align-items:center;justify-content:center;flex:none;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.41 0l7.3-7.3a1 1 0 0 0 0-1.41Z"></path><circle cx="7" cy="7" r="1.5" fill="#fff" stroke="none"></circle></svg>
        </div>
        <div>
          <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:12.5px;font-weight:600;color:${AC};margin-bottom:3px;">Ahorro total con Catchtime</div>
          <div style="font-family:'Sora',sans-serif;font-weight:800;font-size:26px;color:#111827;letter-spacing:-.03em;line-height:1;">${savedAmount}</div>
        </div>
      </div>
    </div>

    <!-- Secciones -->
    <div style="padding:0 16px 36px;display:flex;flex-direction:column;gap:20px;">

      ${section('Cuenta',
        row(iEdit,   'Editar perfil',   '',                  'editProfile') +
        row(iBell,   'Notificaciones',  '',                  'notifications') +
        row(iCard,   'Métodos de pago', '',                  'payments') +
        row(iTicket, 'Mis entradas',    '',                  'tab:tickets', true)
      )}

      ${section('Preferencias',
        row(iPin,   'Ubicación',   state.location,    'location') +
        row(iTag,   'Categorías',  catLabel,          'categories') +
        row(iGlobe, 'Idioma',      state.profileLang, 'language', true)
      )}

      ${section('Ayuda',
        row(iHelp,  'Centro de ayuda', '', 'help') +
        row(iMail,  'Contactar',       '', 'contact') +
        row(iStar,  'Valorar la app',  '', 'rate', true)
      )}

      ${section('Legal',
        row(iShield, 'Privacidad',             '', 'privacy') +
        row(iFile,   'Términos y condiciones', '', 'terms', true)
      )}

      <button type="button" data-profile-panel="logout" style="width:100%;padding:15px;border:1.5px solid #FECACA;border-radius:16px;background:#fff;font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:15px;color:#DC2626;cursor:pointer;">Cerrar sesión</button>

      <div style="text-align:center;color:#D1D5DB;font-size:12px;font-weight:500;font-family:'Plus Jakarta Sans',sans-serif;margin-top:-8px;">Catchtime · v1.0.0</div>
    </div>
  </div>`;
}

function profilePanelView() {
  const panel = state.profilePanel;
  if (!panel) return '';

  const backArrow = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111827" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"></path></svg>`;

  const wrap = (title, body) =>
    `<div style="position:absolute;inset:0;background:#F9FAFB;display:flex;flex-direction:column;z-index:20;overflow:hidden;">
       <div style="display:flex;align-items:center;padding:14px 20px;background:#fff;border-bottom:1px solid #F3F4F6;flex:none;">
         <button type="button" data-profile-back style="width:40px;height:40px;border-radius:50%;border:1px solid #EFEFF1;background:#F9FAFB;display:flex;align-items:center;justify-content:center;flex:none;">${backArrow}</button>
         <div style="font-family:'Sora',sans-serif;font-weight:700;font-size:17px;color:#111827;margin-left:12px;flex:1;">${title}</div>
       </div>
       <div style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;">${body}</div>
     </div>`;

  const fieldRow = (label, type, value, attr, placeholder = '', note = '') =>
    `<div>
       <div style="font-family:'Plus Jakarta Sans',sans-serif;font-weight:600;font-size:11.5px;color:#9CA3AF;margin-bottom:6px;letter-spacing:.05em;text-transform:uppercase;">${label}</div>
       <input ${attr} type="${type}" value="${String(value).replace(/"/g,'&quot;')}" placeholder="${placeholder}" style="width:100%;height:50px;border:1.5px solid #EFEFF1;border-radius:14px;padding:0 15px;font-family:'Plus Jakarta Sans',sans-serif;font-size:15px;font-weight:500;color:#111827;background:#fff;outline:none;-webkit-appearance:none;box-sizing:border-box;">
       ${note ? `<div style="font-size:12px;color:#9CA3AF;margin-top:5px;padding:0 2px;">${note}</div>` : ''}
     </div>`;

  const divider = `<div style="height:1px;background:#F3F4F6;margin:0 16px;"></div>`;

  // ── Editar perfil ────────────────────────────────────────────────────────────
  if (panel === 'editProfile') {
    const body = `<div style="padding:24px 20px;display:flex;flex-direction:column;gap:14px;">
      <input type="file" accept="image/*" data-profile-photo-input style="display:none;">
      <div style="display:flex;flex-direction:column;align-items:center;gap:10px;margin-bottom:10px;">
        ${userAvatar(80)}
        <button type="button" data-profile-change-photo style="border:none;background:none;color:${AC};font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:13.5px;cursor:pointer;padding:0;">Cambiar foto</button>
      </div>
      ${fieldRow('Nombre', 'text', state.profileName, 'data-edit-name')}
      ${fieldRow('Email', 'email', 'demo@catchtime.app', 'data-edit-email', '', 'El cambio de email requiere verificación.')}
      ${fieldRow('Teléfono', 'tel', '', 'data-edit-phone', '+34 6__ ___ ___')}
      <button type="button" data-profile-save style="width:100%;height:54px;border:none;border-radius:16px;background:${AC};color:#fff;font-family:'Sora',sans-serif;font-weight:700;font-size:16px;cursor:pointer;margin-top:6px;">Guardar cambios</button>
    </div>`;
    return wrap('Editar perfil', body);
  }

  // ── Notificaciones ───────────────────────────────────────────────────────────
  if (panel === 'notifications') {
    const toggle = (key, label, sub) => {
      const on = state.profileNotifs[key];
      return `<div style="display:flex;align-items:center;padding:16px;">
        <div style="flex:1;">
          <div style="font-family:'Plus Jakarta Sans',sans-serif;font-weight:600;font-size:15px;color:#111827;">${label}</div>
          <div style="font-size:12.5px;color:#9CA3AF;margin-top:2px;">${sub}</div>
        </div>
        <div data-notif-toggle="${key}" style="position:relative;width:46px;height:26px;border-radius:13px;background:${on ? AC : '#E5E7EB'};cursor:pointer;flex:none;">
          <div style="position:absolute;top:3px;left:${on ? '23px' : '3px'};width:20px;height:20px;border-radius:50%;background:#fff;border:1px solid #E5E7EB;"></div>
        </div>
      </div>`;
    };
    const body = `<div style="padding:20px 16px;">
      <div style="background:#fff;border:1px solid #EFEFF1;border-radius:18px;overflow:hidden;">
        ${toggle('events',    'Eventos cercanos',     'Nuevos eventos en tu zona')}
        ${divider}
        ${toggle('offers',    'Ofertas y descuentos', 'Alertas de precio')}
        ${divider}
        ${toggle('reminders', 'Recordatorios',        'Aviso antes del evento')}
      </div>
    </div>`;
    return wrap('Notificaciones', body);
  }

  // ── Métodos de pago ──────────────────────────────────────────────────────────
  if (panel === 'payments') {
    const body = `
      <div style="margin:20px 16px 0;background:linear-gradient(135deg,#1F2937 0%,#374151 100%);border-radius:20px;padding:22px;color:#fff;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:28px;">
          <div style="font-family:'Sora',sans-serif;font-weight:700;font-size:14px;letter-spacing:.08em;opacity:.7;">VISA</div>
          <svg width="36" height="24" viewBox="0 0 36 24" fill="none"><circle cx="14" cy="12" r="12" fill="#EB001B" opacity=".9"/><circle cx="22" cy="12" r="12" fill="#F79E1B" opacity=".9"/><path d="M18 4.8a12 12 0 0 1 0 14.4 12 12 0 0 1 0-14.4Z" fill="#FF5F00" opacity=".8"/></svg>
        </div>
        <div style="font-family:'SF Mono','Courier New',monospace;font-size:16px;letter-spacing:.18em;opacity:.9;margin-bottom:22px;">•••• •••• •••• 4242</div>
        <div style="display:flex;justify-content:space-between;">
          <div><div style="font-size:10px;opacity:.5;margin-bottom:2px;letter-spacing:.06em;">TITULAR</div><div style="font-family:'Plus Jakarta Sans',sans-serif;font-weight:600;font-size:13px;">${state.profileName}</div></div>
          <div><div style="font-size:10px;opacity:.5;margin-bottom:2px;letter-spacing:.06em;">CADUCA</div><div style="font-family:'Plus Jakarta Sans',sans-serif;font-weight:600;font-size:13px;">12/28</div></div>
        </div>
      </div>
      <div style="padding:16px;">
        <button type="button" style="width:100%;height:50px;border:1.5px dashed #D1D5DB;border-radius:16px;background:#fff;font-family:'Plus Jakarta Sans',sans-serif;font-weight:600;font-size:14.5px;color:#6B7280;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"></path></svg>
          Añadir método de pago
        </button>
      </div>`;
    return wrap('Métodos de pago', body);
  }

  // ── Categorías ───────────────────────────────────────────────────────────────
  if (panel === 'categories') {
    const chips = FILTER_SECTIONS[0].options.map(c => {
      const on = state.profileCats.has(c.id);
      return `<button type="button" data-cat-pref="${c.id}" style="padding:12px 18px;border-radius:999px;border:1.5px solid ${on ? AC : '#EFEFF1'};background:${on ? AS : '#fff'};color:${on ? AC : '#374151'};font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:14px;cursor:pointer;">${c.label}</button>`;
    }).join('');
    const body = `<div style="padding:24px 16px;">
      <p style="font-family:'Plus Jakarta Sans',sans-serif;font-size:14px;color:#9CA3AF;margin-bottom:20px;line-height:1.6;margin-top:0;">Selecciona las categorías que más te interesan para personalizar tu experiencia.</p>
      <div style="display:flex;flex-wrap:wrap;gap:10px;">${chips}</div>
    </div>`;
    return wrap('Categorías de interés', body);
  }

  // ── Idioma ───────────────────────────────────────────────────────────────────
  if (panel === 'language') {
    const langs = ['Español', 'English', 'Català', 'Français', 'Português'];
    const rows = langs.map((lang, i) => {
      const on = state.profileLang === lang;
      return `<div data-lang-pick="${lang}" style="display:flex;align-items:center;padding:16px;${i < langs.length-1 ? 'border-bottom:1px solid #F3F4F6;' : ''}cursor:pointer;background:#fff;">
        <span style="flex:1;font-family:'Plus Jakarta Sans',sans-serif;font-weight:600;font-size:15px;color:${on ? AC : '#111827'};">${lang}</span>
        ${on ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${AC}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>` : ''}
      </div>`;
    }).join('');
    const body = `<div style="padding:20px 16px;">
      <div style="background:#fff;border:1px solid #EFEFF1;border-radius:18px;overflow:hidden;">${rows}</div>
    </div>`;
    return wrap('Idioma', body);
  }

  // ── Centro de ayuda ──────────────────────────────────────────────────────────
  if (panel === 'help') {
    const faqs = [
      ['¿Cómo compro una entrada?', 'Busca el evento, pulsa «Ver entradas» y sigue el proceso de pago. Recibirás la entrada en tu email al instante.'],
      ['¿Puedo devolver una entrada?', 'Depende de la política del evento. En general tienes hasta 48 h antes del inicio para solicitar el reembolso desde «Mis entradas».'],
      ['¿Cómo activo las notificaciones?', 'Ve a Perfil → Notificaciones y activa los avisos que prefieras. Puedes gestionarlos en cualquier momento.'],
      ['¿La app es gratuita?', 'Sí, Catchtime es completamente gratuita. Solo pagas el precio de las entradas que compres.'],
      ['¿Dónde veo mis entradas?', 'En Perfil → Mis entradas encontrarás el histórico completo de todas tus compras.'],
    ];
    const rows = faqs.map(([q, a], i) => {
      const open = state.profileFaqOpen.has(i);
      return `<div data-faq-toggle="${i}" style="padding:16px;${i < faqs.length-1 ? 'border-bottom:1px solid #F3F4F6;' : ''}cursor:pointer;">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="flex:1;font-family:'Plus Jakarta Sans',sans-serif;font-weight:600;font-size:14.5px;color:#111827;line-height:1.35;">${q}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex:none;transform:${open ? 'rotate(180deg)' : 'none'};"><path d="M6 9l6 6 6-6"></path></svg>
        </div>
        ${open ? `<div style="margin-top:10px;font-family:'Plus Jakarta Sans',sans-serif;font-size:13.5px;color:#6B7280;line-height:1.65;">${a}</div>` : ''}
      </div>`;
    }).join('');
    const body = `<div style="padding:20px 16px;">
      <div style="background:#fff;border:1px solid #EFEFF1;border-radius:18px;overflow:hidden;">${rows}</div>
    </div>`;
    return wrap('Centro de ayuda', body);
  }

  // ── Contactar ────────────────────────────────────────────────────────────────
  if (panel === 'contact') {
    if (state.profileContactSent) {
      const body = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:72px 32px;text-align:center;">
        <div style="width:72px;height:72px;border-radius:24px;background:${AS};display:flex;align-items:center;justify-content:center;margin-bottom:20px;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="${AC}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>
        </div>
        <div style="font-family:'Sora',sans-serif;font-weight:700;font-size:20px;color:#111827;margin-bottom:8px;">Mensaje enviado</div>
        <div style="color:#9CA3AF;font-size:14px;line-height:1.65;max-width:240px;">Te responderemos en menos de 24 horas en tu email.</div>
      </div>`;
      return wrap('Contactar', body);
    }
    const body = `<div style="padding:24px 16px;display:flex;flex-direction:column;gap:12px;">
      <div>
        <div style="font-family:'Plus Jakarta Sans',sans-serif;font-weight:600;font-size:11.5px;color:#9CA3AF;margin-bottom:6px;letter-spacing:.05em;text-transform:uppercase;">Asunto</div>
        <input data-contact-subject type="text" placeholder="¿En qué podemos ayudarte?" style="width:100%;height:50px;border:1.5px solid #EFEFF1;border-radius:14px;padding:0 15px;font-family:'Plus Jakarta Sans',sans-serif;font-size:15px;color:#111827;background:#fff;outline:none;-webkit-appearance:none;box-sizing:border-box;">
      </div>
      <div>
        <div style="font-family:'Plus Jakarta Sans',sans-serif;font-weight:600;font-size:11.5px;color:#9CA3AF;margin-bottom:6px;letter-spacing:.05em;text-transform:uppercase;">Mensaje</div>
        <textarea data-contact-message placeholder="Escribe tu mensaje aquí..." rows="5" style="width:100%;border:1.5px solid #EFEFF1;border-radius:14px;padding:13px 15px;font-family:'Plus Jakarta Sans',sans-serif;font-size:15px;color:#111827;background:#fff;outline:none;resize:none;-webkit-appearance:none;box-sizing:border-box;line-height:1.5;"></textarea>
      </div>
      <button type="button" data-contact-send style="height:54px;border:none;border-radius:16px;background:${AC};color:#fff;font-family:'Sora',sans-serif;font-weight:700;font-size:15px;cursor:pointer;margin-top:4px;">Enviar mensaje</button>
    </div>`;
    return wrap('Contactar', body);
  }

  // ── Valorar la app ───────────────────────────────────────────────────────────
  if (panel === 'rate') {
    if (state.profileRatingDone) {
      const starsSvg = [1,2,3,4,5].map(n =>
        `<svg width="30" height="30" viewBox="0 0 24 24" fill="${n <= state.profileRating ? AC : '#E5E7EB'}" stroke="${n <= state.profileRating ? AC : '#E5E7EB'}" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`
      ).join('');
      const body = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:72px 32px;text-align:center;">
        <div style="display:flex;gap:4px;margin-bottom:22px;">${starsSvg}</div>
        <div style="font-family:'Sora',sans-serif;font-weight:700;font-size:20px;color:#111827;margin-bottom:8px;">Gracias por tu valoración</div>
        <div style="color:#9CA3AF;font-size:14px;line-height:1.65;max-width:240px;">Tu opinión nos ayuda a mejorar Catchtime para todos.</div>
      </div>`;
      return wrap('Valorar la app', body);
    }
    const labels = ['', 'Malo', 'Regular', 'Bueno', 'Muy bueno', '¡Genial!'];
    const stars = [1,2,3,4,5].map(n => {
      const filled = n <= state.profileRating;
      return `<button type="button" data-rate-star="${n}" style="width:52px;height:52px;border:none;background:none;padding:0;cursor:pointer;display:flex;align-items:center;justify-content:center;">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="${filled ? AC : 'none'}" stroke="${filled ? AC : '#D1D5DB'}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      </button>`;
    }).join('');
    const body = `<div style="padding:36px 20px;display:flex;flex-direction:column;align-items:center;gap:0;">
      <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:15px;font-weight:500;color:#6B7280;margin-bottom:20px;text-align:center;">¿Qué te parece Catchtime?</div>
      <div style="display:flex;gap:2px;margin-bottom:10px;">${stars}</div>
      <div style="font-family:'Sora',sans-serif;font-weight:700;font-size:16px;color:${AC};min-height:22px;">${state.profileRating ? labels[state.profileRating] : ''}</div>
      <textarea data-rate-comment placeholder="Cuéntanos más (opcional)..." rows="3" style="width:100%;margin-top:22px;border:1.5px solid #EFEFF1;border-radius:14px;padding:13px 15px;font-family:'Plus Jakarta Sans',sans-serif;font-size:14px;color:#111827;background:#fff;outline:none;resize:none;box-sizing:border-box;"></textarea>
      <button type="button" data-rate-submit style="width:100%;height:54px;border:none;border-radius:16px;background:${state.profileRating ? AC : '#E5E7EB'};color:${state.profileRating ? '#fff' : '#9CA3AF'};font-family:'Sora',sans-serif;font-weight:700;font-size:15px;cursor:${state.profileRating ? 'pointer' : 'default'};margin-top:14px;">Enviar valoración</button>
    </div>`;
    return wrap('Valorar la app', body);
  }

  // ── Privacidad / Términos ────────────────────────────────────────────────────
  if (panel === 'privacy' || panel === 'terms') {
    const isPrivacy = panel === 'privacy';
    const title = isPrivacy ? 'Política de privacidad' : 'Términos y condiciones';
    const body = `<div style="padding:24px 20px;font-family:'Plus Jakarta Sans',sans-serif;font-size:14.5px;color:#374151;line-height:1.75;">
      <div style="font-family:'Sora',sans-serif;font-weight:700;font-size:14px;color:#9CA3AF;margin-bottom:16px;">${isPrivacy ? 'Última actualización: junio 2026' : 'Versión 1.0 · junio 2026'}</div>
      ${isPrivacy
        ? `<p style="margin:0 0 14px;">Catchtime recoge únicamente los datos necesarios para ofrecerte la mejor experiencia: nombre, email y preferencias de eventos.</p>
           <p style="margin:0 0 14px;">No vendemos ni compartimos tus datos con terceros. Los datos de pago son gestionados exclusivamente por nuestros proveedores certificados PCI-DSS.</p>
           <p style="margin:0 0 14px;">Puedes solicitar la eliminación de tu cuenta y datos en cualquier momento desde la sección de soporte.</p>
           <p style="margin:0;">Contacto: privacidad@catchtime.app</p>`
        : `<p style="margin:0 0 14px;">Al usar Catchtime aceptas utilizar la plataforma únicamente para la compra legítima de entradas para eventos culturales y deportivos.</p>
           <p style="margin:0 0 14px;">Queda prohibida la reventa de entradas adquiridas a través de Catchtime con ánimo de lucro.</p>
           <p style="margin:0 0 14px;">Catchtime se reserva el derecho de suspender cuentas que incumplan estos términos.</p>
           <p style="margin:0;">Jurisdicción: España · legal@catchtime.app</p>`
      }
    </div>`;
    return wrap(title, body);
  }

  // ── Cerrar sesión ────────────────────────────────────────────────────────────
  if (panel === 'logout') {
    const body = `<div style="display:flex;flex-direction:column;align-items:center;padding:48px 24px 32px;">
      <div style="width:64px;height:64px;border-radius:20px;background:#FEF2F2;display:flex;align-items:center;justify-content:center;margin-bottom:20px;">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
      </div>
      <div style="font-family:'Sora',sans-serif;font-weight:700;font-size:20px;color:#111827;margin-bottom:8px;text-align:center;">¿Cerrar sesión?</div>
      <div style="color:#9CA3AF;font-size:14.5px;text-align:center;margin-bottom:32px;line-height:1.65;max-width:240px;">Deberás iniciar sesión de nuevo para acceder a tu cuenta.</div>
      <button type="button" data-logout-confirm style="width:100%;height:52px;border:none;border-radius:16px;background:#DC2626;color:#fff;font-family:'Sora',sans-serif;font-weight:700;font-size:15px;cursor:pointer;margin-bottom:12px;">Sí, cerrar sesión</button>
      <button type="button" data-profile-back style="width:100%;height:52px;border:1.5px solid #EFEFF1;border-radius:16px;background:#fff;font-family:'Plus Jakarta Sans',sans-serif;font-weight:600;font-size:15px;color:#374151;cursor:pointer;">Cancelar</button>
    </div>`;
    return wrap('Cerrar sesión', body);
  }

  return '';
}
