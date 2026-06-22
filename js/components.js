/* ============================================================================
   components.js — funciones que devuelven el markup de cada pieza de UI.
   Dependen de: data.js (datos), icons.js (SVG) y `state` (definido en app.js).
   Todas leen el estado en tiempo de llamada, no al cargar.
   ========================================================================== */

// Decora un evento con todo lo derivado del estado actual (favorito, colores…)
function dec(e) {
  const faved = state.fav.has(e.id);
  const st = STATUS[e.status];
  return {
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
}

// Barra de navegación inferior flotante (solo iconos)
function navItem(id, label, paths, hasBadge = false) {
  const active = state.tab === id;
  const cnt = state.fav.size;
  const badge = hasBadge
    ? `<span data-badge class="nav-badge" style="display:${cnt > 0 ? 'flex' : 'none'};">${cnt}</span>`
    : '';
  const svg = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
  return `<button type="button" data-tab="${id}" aria-label="${label}" class="nav-item${active ? ' is-active' : ''}">
    <span class="nav-icon">${svg}${badge}</span>
  </button>`;
}

function bottomNav() {
  const mapIcon = '<path d="M3 13 9 11l6 2 6-2v7l-6 2-6-2-6 2Z"></path><path d="M9 11v7"></path><path d="M15 13v7"></path><path d="M17.5 13c-2-2.5-3.5-4.4-3.5-6.5a3.5 3.5 0 0 1 7 0c0 2.1-1.5 4-3.5 6.5Z"></path><circle cx="17.5" cy="6.5" r="1.5"></circle>';
  return `<nav id="nav">
    <div id="nav-pill">
      ${navItem('home', 'Inicio', '<path d="M3 10.5 12 3l9 7.5"></path><path d="M5.5 9.5V20a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V9.5"></path>')}
      ${navItem('favorites', 'Favoritos', '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"></path>', true)}
      ${navItem('discover', 'Mapa', mapIcon)}
      ${navItem('tickets', 'Entradas', '<path d="M4 6h16a1 1 0 0 1 1 1v3a2 2 0 0 0 0 4v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3a2 2 0 0 0 0-4V7a1 1 0 0 1 1-1Z"></path><path d="M14 6v12"></path>')}
      ${navItem('profile', 'Perfil', '<circle cx="12" cy="8" r="4"></circle><path d="M4 21a8 8 0 0 1 16 0"></path>')}
    </div>
  </nav>`;
}

// Tarjeta estándar (imagen arriba, ficha debajo)
function cardStd(e) {
  const d = dec(e);
  return `<div style="width:100%;font-family:'Plus Jakarta Sans',-apple-system,sans-serif;background:#fff;">
    <div style="position:relative;width:100%;aspect-ratio:1.55;border-radius:18px;overflow:hidden;box-shadow:0 6px 18px rgba(17,24,39,.10);">
      <div style="position:absolute;inset:0;background:${d.bg};"></div>
      <div style="position:absolute;inset:0;background:radial-gradient(130% 90% at 50% -10%,rgba(255,255,255,.08),transparent 55%),linear-gradient(180deg,rgba(17,24,39,0) 45%,rgba(17,24,39,.34));"></div>
      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:'SF Mono',ui-monospace,monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.34);">${d.label}</div>
      <div style="position:absolute;top:10px;left:10px;background:#fff;color:#111827;font-weight:800;font-size:13px;padding:5px 11px;border-radius:999px;box-shadow:0 2px 8px rgba(17,24,39,.18);">${d.price}</div>
      <button data-fav="${e.id}" style="position:absolute;top:10px;right:10px;width:34px;height:34px;border:none;border-radius:50%;background:rgba(17,24,39,.42);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:0;">${SVG.heart(d.heartFill, d.heartStroke, 17, e.id)}</button>
      <div style="position:absolute;bottom:10px;left:10px;display:flex;align-items:center;gap:6px;background:${d.statusBg};color:${d.statusColor};font-size:11px;font-weight:700;padding:5px 10px;border-radius:999px;backdrop-filter:blur(6px);"><span style="width:6px;height:6px;border-radius:50%;background:${d.dotColor};"></span>${d.statusText}</div>
    </div>
    <div style="padding:12px 2px 2px;">
      <div style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;">${SVG.cal(AC)}<span style="color:#6B7280;">${d.dateShort} · ${d.time}</span></div>
      <div style="font-family:'Sora',sans-serif;font-weight:700;font-size:16px;color:#111827;margin-top:7px;line-height:1.25;letter-spacing:-.01em;">${d.title}</div>
      <div style="display:flex;align-items:center;gap:6px;color:#6B7280;font-size:12.5px;font-weight:500;margin-top:6px;">${SVG.mapPin('#9CA3AF')}<span>${d.venue} · ${d.area}</span></div>
      <div style="display:inline-flex;align-items:center;gap:5px;margin-top:11px;background:${AS};color:${AC};font-size:11px;font-weight:800;padding:5px 10px;border-radius:999px;"><span style="width:5px;height:5px;border-radius:50%;background:${AC};"></span>Venta en Catchtime</div>
    </div>
  </div>`;
}

// Tarjeta editorial (imagen inmersiva, texto superpuesto)
function cardEdit(e) {
  const d = dec(e);
  return `<div style="position:relative;width:100%;height:392px;border-radius:22px;overflow:hidden;font-family:'Plus Jakarta Sans',sans-serif;box-shadow:0 10px 26px rgba(17,24,39,.18);display:flex;flex-direction:column;justify-content:space-between;">
    <div style="position:absolute;inset:0;background:${d.bg};"></div>
    <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(17,24,39,.22) 0%,rgba(17,24,39,0) 32%,rgba(17,24,39,.55) 68%,rgba(17,24,39,.93) 100%);"></div>
    <div style="position:absolute;top:45%;left:0;right:0;text-align:center;font-family:'SF Mono',ui-monospace,monospace;font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.3);">${d.label}</div>
    <div style="position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;padding:14px;">
      <div style="background:#fff;color:#111827;font-weight:800;font-size:14px;padding:6px 13px;border-radius:999px;box-shadow:0 2px 10px rgba(0,0,0,.18);">${d.price}</div>
      <button data-fav="${e.id}" style="width:38px;height:38px;border:none;border-radius:50%;background:rgba(255,255,255,.18);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:0;">${SVG.heart(d.heartFill, d.heartStroke, 19, e.id)}</button>
    </div>
    <div style="position:relative;z-index:1;padding:16px 16px 18px;display:flex;flex-direction:column;gap:9px;">
      <div style="display:inline-flex;align-self:flex-start;align-items:center;gap:6px;background:${d.statusBg};color:${d.statusColor};font-size:11px;font-weight:700;padding:5px 11px;border-radius:999px;backdrop-filter:blur(6px);"><span style="width:6px;height:6px;border-radius:50%;background:${d.dotColor};"></span>${d.statusText}</div>
      <div style="font-family:'Sora',sans-serif;font-weight:800;font-size:23px;color:#fff;line-height:1.12;letter-spacing:-.02em;">${d.title}</div>
      <div style="display:flex;align-items:center;gap:14px;color:rgba(255,255,255,.85);font-size:12.5px;font-weight:600;">
        <span style="display:flex;align-items:center;gap:5px;">${SVG.cal('currentColor')}${d.dateShort}</span>
        <span style="display:flex;align-items:center;gap:5px;min-width:0;overflow:hidden;">${SVG.mapPin('currentColor')}<span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${d.venue}</span></span>
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
