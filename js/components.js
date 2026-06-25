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
  // Si tenemos ubicación del usuario, calcula distancia
  if (state.userLocation) {
    const km = haversineDistance(state.userLocation.lat, state.userLocation.lng, e.lat, e.lng);
    d.distanceText = km < 1 ? '< 1 km' : km.toFixed(1) + ' km';
  }
  return d;
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
    const crestStyle = `width:72px;height:72px;object-fit:contain;filter:drop-shadow(0 4px 16px rgba(0,0,0,.6));`;
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
  return `<div data-ticket-open="${e.id}" style="display:flex;background:#fff;border-radius:20px;overflow:hidden;border:1px solid #EFEFF1;box-shadow:0 2px 14px rgba(17,24,39,.07);cursor:pointer;margin-bottom:14px;min-height:100px;">
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

// Vista detalle de una entrada — forma de ticket todo blanco
function ticketDetailView() {
  const e = EV[state.ticketDetail];
  if (!e) return '';
  const isPast   = new Date(e.date + 'T12:00:00') < TODAY;
  const pageBg   = '#F2F3F5';
  const catLabel = CATNAME[e.cat][0].toUpperCase() + CATNAME[e.cat].slice(1);

  const qrMed = qrSvg(e.id, 200, '#111827');
  const qrXL  = qrSvg(e.id, 300, '#ffffff');

  // URLs para acciones externas
  const dateStr  = e.date.replace(/-/g, '');
  const timeStr  = e.time.replace(':', '') + '00';
  const calUrl   = encodeURIComponent(`https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(e.title)}&dates=${dateStr}T${timeStr}/${dateStr}T${timeStr}&location=${encodeURIComponent(e.venue + ', Barcelona')}`);
  const mapsQ    = encodeURIComponent(e.venue + ', Barcelona');

  // Chip de acción inline
  const chip = (label, ico, dataKey, dataVal) =>
    `<button type="button" ${dataKey}="${dataVal}" style="display:inline-flex;align-items:center;gap:5px;padding:5px 10px;border-radius:999px;border:1.5px solid #E5E7EB;background:#F9FAFB;font-family:'Plus Jakarta Sans',sans-serif;font-size:11px;font-weight:700;color:#374151;cursor:pointer;white-space:nowrap;flex:none;">
       ${ico} ${label}
     </button>`;

  // Fila de detalle con chip opcional a la derecha
  const drow = (label, val, chipHtml = '') =>
    `<div style="display:flex;align-items:center;padding:12px 0;border-bottom:1px solid #F3F4F6;gap:8px;">
       <span style="flex:0 0 72px;font-family:'Plus Jakarta Sans',sans-serif;font-size:12px;font-weight:500;color:#9CA3AF;">${label}</span>
       <span style="flex:1;font-family:'Plus Jakarta Sans',sans-serif;font-size:13.5px;font-weight:600;color:#111827;line-height:1.3;">${val}</span>
       ${chipHtml}
     </div>`;

  const calIco  = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4M16 2v4M3 10h18"></path><rect x="3" y="4" width="18" height="18" rx="2"></rect></svg>`;
  const mapIco  = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;

  // QR fullscreen (negro)
  const fullscreen = state.qrFullscreen ? `
    <div data-qr-close style="position:absolute;inset:0;background:#000;z-index:40;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;cursor:pointer;">
      <div style="background:#111;border-radius:24px;padding:24px;">${qrXL}</div>
      <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:11px;font-weight:700;color:rgba(255,255,255,.3);letter-spacing:.16em;text-transform:uppercase;">Toca para cerrar</div>
    </div>` : '';

  return `<div style="position:absolute;inset:0;background:${pageBg};display:flex;flex-direction:column;z-index:30;overflow-y:auto;-webkit-overflow-scrolling:touch;">
    ${fullscreen}

    <!-- Cabecera -->
    <div style="display:flex;align-items:center;justify-content:center;padding:18px 20px 10px;position:relative;flex:none;">
      <div style="font-family:'Sora',sans-serif;font-weight:700;font-size:16px;color:#111827;">Tu entrada</div>
      <button type="button" data-ticket-close style="position:absolute;right:20px;width:34px;height:34px;border-radius:50%;border:none;background:rgba(17,24,39,.08);display:flex;align-items:center;justify-content:center;cursor:pointer;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#374151" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"></path></svg>
      </button>
    </div>

    <!-- ── Tarjeta ticket: todo blanco ── -->
    <div style="position:relative;margin:6px 16px 20px;flex:none;filter:drop-shadow(0 4px 28px rgba(17,24,39,.13));">

      <!-- Sección QR -->
      <div style="background:#fff;border-radius:24px 24px 0 0;padding:24px 20px 28px;text-align:center;">
        <div data-qr-open style="display:inline-block;position:relative;cursor:pointer;">
          ${qrMed}
          <div style="position:absolute;bottom:4px;right:4px;background:rgba(17,24,39,.07);border-radius:6px;padding:3px 7px;font-family:'Plus Jakarta Sans',sans-serif;font-size:9px;font-weight:700;color:#6B7280;display:flex;align-items:center;gap:2px;">
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"></path></svg>ampliar
          </div>
        </div>
        <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:12px;font-weight:500;color:#9CA3AF;margin-top:12px;">Muestra este código en la entrada del recinto</div>
        <div style="display:inline-flex;align-items:center;gap:6px;margin-top:10px;background:${isPast ? '#F3F4F6' : '#ECFDF5'};color:${isPast ? '#9CA3AF' : '#16A34A'};font-size:11px;font-weight:700;padding:4px 12px;border-radius:999px;">
          <div style="width:6px;height:6px;border-radius:50%;background:currentColor;"></div>
          ${isPast ? 'Usada' : 'Válida'}
        </div>
      </div>

      <!-- Muescas del ticket -->
      <div style="position:relative;height:0;z-index:5;overflow:visible;">
        <div style="position:absolute;left:-16px;top:-16px;width:calc(100% + 32px);height:32px;display:flex;align-items:center;pointer-events:none;">
          <div style="width:32px;height:32px;border-radius:50%;background:${pageBg};flex:none;"></div>
          <div style="flex:1;border-top:2px dashed #D1D5DB;"></div>
          <div style="width:32px;height:32px;border-radius:50%;background:${pageBg};flex:none;"></div>
        </div>
      </div>

      <!-- Sección detalles -->
      <div style="background:#fff;border-radius:0 0 24px 24px;padding:22px 20px 20px;">

        <!-- Nombre + categoría -->
        <div style="font-family:'Sora',sans-serif;font-weight:700;font-size:17px;color:#111827;letter-spacing:-.02em;line-height:1.25;margin-bottom:6px;">${e.title}</div>
        <div style="display:inline-flex;align-items:center;gap:5px;background:${AS};color:${AC};font-size:11px;font-weight:700;padding:4px 10px;border-radius:999px;margin-bottom:14px;">
          ${SVG.catIcon(e.cat, AC, 11)} ${catLabel}
        </div>

        <!-- Filas de info -->
        ${drow('Fecha',   e.dateShort, chip('Calendario', calIco, 'data-ticket-cal', calUrl))}
        ${drow('Hora',    e.time)}
        ${drow('Recinto', e.venue,     chip('Maps', mapIco, 'data-ticket-maps', mapsQ))}
        ${drow('Zona',    e.area)}
        ${drow('Precio',  `<span style="font-family:'Sora',sans-serif;font-weight:800;font-size:17px;letter-spacing:-.02em;">${e.price}</span>`)}

        <!-- Wallet -->
        <div style="margin-top:18px;padding-top:16px;border-top:1px solid #F3F4F6;">
          <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:10.5px;font-weight:700;color:#9CA3AF;letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px;">Añadir a cartera</div>
          <div style="display:flex;gap:10px;">
            <!-- Apple Wallet -->
            <button type="button" style="flex:1;height:44px;border:none;border-radius:12px;background:#000;color:#fff;font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;">
              <svg width="13" height="16" viewBox="0 0 814 1000" fill="white"><path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.5-155.5-98.3C111.5 787.8 47 665.2 47 543.5c0-183.7 120.5-280.9 232.1-280.9 61.5 0 112.8 43.5 150.7 43.5 36.1 0 93.5-46.2 162.4-46.2 26.4 0 108.2 2.6 164.4 100.4zm-180.6-159.8c28.5-35.7 49.2-85.4 49.2-135.1 0-6.9-.6-13.9-1.9-19.5-46.5 1.9-101.6 31.2-135.2 70.6-26.1 29.9-50.9 79.6-50.9 130 0 7.5 1.3 14.9 1.9 17.2 3.2.6 8.4 1.3 13.6 1.3 41.5 0 93.7-28 123.3-64.5z"/></svg>
              Apple Wallet
            </button>
            <!-- Google Wallet -->
            <button type="button" style="flex:1;height:44px;border:1.5px solid #E5E7EB;border-radius:12px;background:#fff;font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:12px;color:#374151;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;">
              <svg width="14" height="14" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Google Wallet
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- CTAs -->
    <div style="padding:0 16px 26px;display:flex;gap:12px;flex:none;">
      <button type="button" style="flex:1;height:50px;border:1.5px solid #E5E7EB;border-radius:14px;background:#fff;font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:14px;color:#374151;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#374151" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
        Descargar
      </button>
      <button type="button" style="flex:1;height:50px;border:none;border-radius:14px;background:${AC};color:#fff;font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;box-shadow:0 6px 18px rgba(255,87,34,.28);">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
        Compartir
      </button>
    </div>
    <div style="height:env(safe-area-inset-bottom,0px);min-height:8px;"></div>
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
      ${navItem('profile', 'Perfil', '<circle cx="12" cy="8" r="4"></circle><path d="M4 21a8 8 0 0 1 16 0"></path>')}
    </div>
  </nav>`;
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
        <button type="button" data-map-detail="${e.id}" class="map-preview-btn map-preview-ghost">Ver detalle</button>
        <button type="button" data-map-buy="${e.id}" class="map-preview-btn map-preview-cta">Comprar</button>
      </div>
    </div>
  </article>`;
}

// Tarjeta estándar (imagen arriba, ficha debajo)
function cardStd(e) {
  const d = dec(e);
  const teamsLine = d.homeTeam && d.awayTeam
    ? `<div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:12px;font-weight:600;color:#6B7280;margin-top:3px;">${d.homeTeam} <span style="color:#9CA3AF;">vs</span> ${d.awayTeam}</div>`
    : '';
  const distanceBadge = d.distanceText
    ? `<span style="font-size:10px;font-weight:700;color:#EF4444;background:#FEE2E2;padding:2px 8px;border-radius:999px;margin-left:6px;">${d.distanceText}</span>`
    : '';
  return `<div style="width:100%;font-family:'Plus Jakarta Sans',-apple-system,sans-serif;background:#fff;">
    <div style="position:relative;width:100%;aspect-ratio:1.55;border-radius:18px;overflow:hidden;box-shadow:0 6px 18px rgba(17,24,39,.10);">
      ${cardVisual(d)}
      <div style="position:absolute;top:10px;left:10px;background:#fff;color:#111827;font-weight:800;font-size:13px;padding:5px 11px;border-radius:999px;box-shadow:0 2px 8px rgba(17,24,39,.18);">${d.price}</div>
      <button data-fav="${e.id}" style="position:absolute;top:10px;right:10px;width:34px;height:34px;border:none;border-radius:50%;background:rgba(17,24,39,.42);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:0;">${SVG.heart(d.heartFill, d.heartStroke, 17, e.id)}</button>
      <div style="position:absolute;bottom:10px;left:10px;display:flex;align-items:center;gap:6px;background:${d.statusBg};color:${d.statusColor};font-size:11px;font-weight:700;padding:5px 10px;border-radius:999px;backdrop-filter:blur(6px);"><span style="width:6px;height:6px;border-radius:50%;background:${d.dotColor};"></span>${d.statusText}</div>
    </div>
    <div style="padding:12px 2px 2px;">
      <div style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;">${SVG.cal(AC)}<span style="color:#6B7280;">${d.dateShort} · ${d.time}</span></div>
      <div style="font-family:'Sora',sans-serif;font-weight:700;font-size:16px;color:#111827;margin-top:7px;line-height:1.25;letter-spacing:-.01em;">${d.title}</div>
      ${teamsLine}
      <div style="display:flex;align-items:center;gap:6px;color:#6B7280;font-size:12.5px;font-weight:500;margin-top:6px;">${SVG.mapPin('#9CA3AF')}<span>${d.venue} · ${d.area}</span>${distanceBadge}</div>
      <div style="display:inline-flex;align-items:center;gap:5px;margin-top:11px;background:${AS};color:${AC};font-size:11px;font-weight:800;padding:5px 10px;border-radius:999px;"><span style="width:5px;height:5px;border-radius:50%;background:${AC};"></span>Venta en Catchtime</div>
    </div>
  </div>`;
}

// Tarjeta editorial (imagen inmersiva, texto superpuesto)
function cardEdit(e) {
  const d = dec(e);
  const teamsLine = d.homeTeam && d.awayTeam
    ? `<div style="font-size:13px;font-weight:600;color:rgba(255,255,255,.75);">${d.homeTeam} <span style="opacity:.55;">vs</span> ${d.awayTeam}</div>`
    : '';
  const distanceLine = d.distanceText
    ? `<span style="display:flex;align-items:center;gap:5px;font-size:11px;font-weight:700;color:#FCA5A5;background:rgba(239,68,68,.2);padding:3px 9px;border-radius:999px;white-space:nowrap;">📍 ${d.distanceText}</span>`
    : '';
  return `<div style="position:relative;width:100%;height:392px;border-radius:22px;overflow:hidden;font-family:'Plus Jakarta Sans',sans-serif;box-shadow:0 10px 26px rgba(17,24,39,.18);display:flex;flex-direction:column;justify-content:space-between;">
    ${cardVisual(d)}
    <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(17,24,39,.22) 0%,rgba(17,24,39,0) 32%,rgba(17,24,39,.55) 68%,rgba(17,24,39,.93) 100%);pointer-events:none;"></div>
    <div style="position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;padding:14px;">
      <div style="background:#fff;color:#111827;font-weight:800;font-size:14px;padding:6px 13px;border-radius:999px;box-shadow:0 2px 10px rgba(0,0,0,.18);">${d.price}</div>
      <button data-fav="${e.id}" style="width:38px;height:38px;border:none;border-radius:50%;background:rgba(255,255,255,.18);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:0;">${SVG.heart(d.heartFill, d.heartStroke, 19, e.id)}</button>
    </div>
    <div style="position:relative;z-index:1;padding:16px 16px 18px;display:flex;flex-direction:column;gap:9px;">
      <div style="display:inline-flex;align-self:flex-start;align-items:center;gap:6px;background:${d.statusBg};color:${d.statusColor};font-size:11px;font-weight:700;padding:5px 11px;border-radius:999px;backdrop-filter:blur(6px);"><span style="width:6px;height:6px;border-radius:50%;background:${d.dotColor};"></span>${d.statusText}</div>
      <div style="font-family:'Sora',sans-serif;font-weight:800;font-size:23px;color:#fff;line-height:1.12;letter-spacing:-.02em;">${d.title}</div>
      ${teamsLine}
      <div style="display:flex;align-items:center;gap:14px;color:rgba(255,255,255,.85);font-size:12.5px;font-weight:600;flex-wrap:wrap;">
        <span style="display:flex;align-items:center;gap:5px;">${SVG.cal('currentColor')}${d.dateShort}</span>
        <span style="display:flex;align-items:center;gap:5px;min-width:0;overflow:hidden;">${SVG.mapPin('currentColor')}<span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${d.venue}</span></span>
        ${distanceLine}
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
        <button type="button" data-filter-apply style="width:100%;height:54px;border:none;border-radius:999px;background:${AC};color:#fff;font-family:'Sora',sans-serif;font-weight:700;font-size:16px;box-shadow:0 8px 24px rgba(255,87,34,.28);">Aplicar filtros</button>
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
  const dirPath  = t.dir === 'up' ? 'M6 15l6-6 6 6' : t.dir === 'down' ? 'M6 9l6 6 6-6' : 'M5 12h14';
  const dirColor = t.dir === 'up' ? AC : '#9CA3AF';
  return `<div style="display:flex;align-items:center;gap:12px;padding:13px 0;border-bottom:1px solid #F3F4F6;font-family:'Plus Jakarta Sans',sans-serif;">
    <div style="width:20px;text-align:center;font-family:'Sora',sans-serif;font-weight:800;font-size:17px;color:#111827;flex:none;">${t.rank}</div>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${dirColor}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" style="flex:none;"><path d="${dirPath}"></path></svg>
    <div style="position:relative;width:52px;height:52px;flex:none;border-radius:12px;overflow:hidden;"><div style="position:absolute;inset:0;background:${d.bg};"></div><div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(17,24,39,0) 40%,rgba(17,24,39,.3));"></div></div>
    <div style="flex:1;min-width:0;">
      <div style="font-family:'Sora',sans-serif;font-weight:700;font-size:14.5px;color:#111827;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:-.01em;">${d.title}</div>
      <div style="color:#9CA3AF;font-size:11.5px;font-weight:500;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${d.dateShort} · ${d.venue}</div>
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
    return `<div id="content" style="display:flex;flex-direction:column;min-height:calc(100dvh - 88px);">
      <!-- Cabecera -->
      <div style="padding:6px 20px 0;">
        <div style="font-family:'Sora',sans-serif;font-weight:800;font-size:22px;color:#111827;letter-spacing:-.03em;line-height:50px;">Favoritos</div>
      </div>
      <!-- Estado vacío -->
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 36px 80px;text-align:center;">
        <div style="width:96px;height:96px;border-radius:32px;background:${AS};display:flex;align-items:center;justify-content:center;margin-bottom:24px;box-shadow:0 0 0 14px rgba(255,87,34,.04),0 0 0 28px rgba(255,87,34,.02);">
          ${heartIcon}
        </div>
        <div style="font-family:'Sora',sans-serif;font-weight:800;font-size:20px;color:#111827;letter-spacing:-.03em;line-height:1.2;margin-bottom:10px;">Aún no tienes favoritos</div>
        <div style="color:#9CA3AF;font-size:14px;font-weight:500;line-height:1.65;max-width:240px;">Pulsa el corazón en cualquier evento para guardarlo aquí y no perdértelo.</div>
        <button type="button" data-tab="home" style="margin-top:32px;display:inline-flex;align-items:center;gap:9px;border:none;border-radius:999px;background:${AC};color:#fff;font-family:'Sora',sans-serif;font-weight:700;font-size:14.5px;padding:15px 32px;box-shadow:0 10px 28px rgba(255,87,34,.30);cursor:pointer;">Explorar eventos</button>
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
    `<div style="background:#fff;border:1px solid #EFEFF1;border-radius:18px;overflow:hidden;box-shadow:0 1px 6px rgba(17,24,39,.05);">${content}</div>`;

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
      <div style="width:64px;height:64px;border-radius:20px;background:linear-gradient(135deg,${AC} 0%,#FF8A50 100%);display:flex;align-items:center;justify-content:center;font-family:'Sora',sans-serif;font-weight:800;font-size:26px;color:#fff;flex:none;box-shadow:0 6px 18px rgba(255,87,34,.30);">D</div>
      <div style="flex:1;min-width:0;">
        ${nameArea}
        <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:13.5px;font-weight:500;color:#9CA3AF;margin-top:4px;">david@catchtime.app</div>
      </div>
    </div>

    <!-- Card de ahorro -->
    <div style="margin:0 16px 24px;">
      <div style="background:${AS};border:1px solid rgba(255,87,34,.14);border-radius:18px;padding:18px 20px;display:flex;align-items:center;gap:16px;">
        <div style="width:48px;height:48px;border-radius:14px;background:${AC};display:flex;align-items:center;justify-content:center;flex:none;box-shadow:0 6px 16px rgba(255,87,34,.28);">
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
      <div style="display:flex;flex-direction:column;align-items:center;gap:10px;margin-bottom:10px;">
        <div style="width:80px;height:80px;border-radius:24px;background:linear-gradient(135deg,${AC} 0%,#FF8A50 100%);display:flex;align-items:center;justify-content:center;font-family:'Sora',sans-serif;font-weight:800;font-size:32px;color:#fff;box-shadow:0 6px 18px rgba(255,87,34,.30);">D</div>
        <button type="button" style="border:none;background:none;color:${AC};font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:13.5px;cursor:pointer;padding:0;">Cambiar foto</button>
      </div>
      ${fieldRow('Nombre', 'text', state.profileName, 'data-edit-name')}
      ${fieldRow('Email', 'email', 'david@catchtime.app', 'data-edit-email', '', 'El cambio de email requiere verificación.')}
      ${fieldRow('Teléfono', 'tel', '', 'data-edit-phone', '+34 6__ ___ ___')}
      <button type="button" data-profile-save style="width:100%;height:54px;border:none;border-radius:16px;background:${AC};color:#fff;font-family:'Sora',sans-serif;font-weight:700;font-size:16px;cursor:pointer;margin-top:6px;box-shadow:0 8px 22px rgba(255,87,34,.26);">Guardar cambios</button>
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
          <div style="position:absolute;top:3px;left:${on ? '23px' : '3px'};width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.18);"></div>
        </div>
      </div>`;
    };
    const body = `<div style="padding:20px 16px;">
      <div style="background:#fff;border:1px solid #EFEFF1;border-radius:18px;overflow:hidden;box-shadow:0 1px 6px rgba(17,24,39,.04);">
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
      <div style="background:#fff;border:1px solid #EFEFF1;border-radius:18px;overflow:hidden;box-shadow:0 1px 6px rgba(17,24,39,.04);">${rows}</div>
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
      <div style="background:#fff;border:1px solid #EFEFF1;border-radius:18px;overflow:hidden;box-shadow:0 1px 6px rgba(17,24,39,.04);">${rows}</div>
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
      <button type="button" data-contact-send style="height:54px;border:none;border-radius:16px;background:${AC};color:#fff;font-family:'Sora',sans-serif;font-weight:700;font-size:15px;cursor:pointer;margin-top:4px;box-shadow:0 8px 20px rgba(255,87,34,.24);">Enviar mensaje</button>
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
      <button type="button" data-rate-submit style="width:100%;height:54px;border:none;border-radius:16px;background:${state.profileRating ? AC : '#E5E7EB'};color:${state.profileRating ? '#fff' : '#9CA3AF'};font-family:'Sora',sans-serif;font-weight:700;font-size:15px;cursor:${state.profileRating ? 'pointer' : 'default'};margin-top:14px;${state.profileRating ? 'box-shadow:0 8px 20px rgba(255,87,34,.24);' : ''}">Enviar valoración</button>
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
