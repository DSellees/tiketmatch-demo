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

// Barra de navegación inferior con badge de favoritos
function bottomNav() {
  const t = state.tab;
  const c = k => t === k ? AC : '#9CA3AF';
  const cnt = state.fav.size;
  const badge = `<span data-badge style="position:absolute;top:-3px;right:24px;min-width:16px;height:16px;padding:0 4px;border-radius:999px;background:${AC};color:#fff;font-size:9px;font-weight:800;display:${cnt > 0 ? 'flex' : 'none'};align-items:center;justify-content:center;border:2px solid #fff;">${cnt}</span>`;
  return `<nav id="nav">
    <button data-tab="home" style="flex:1;background:none;border:none;display:flex;flex-direction:column;align-items:center;gap:5px;color:${c('home')};font-size:10.5px;font-weight:700;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"></path><path d="M5.5 9.5V20a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V9.5"></path></svg>Inicio</button>
    <button data-tab="discover" style="flex:1;background:none;border:none;display:flex;flex-direction:column;align-items:center;gap:5px;color:${c('discover')};font-size:10.5px;font-weight:700;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M15.5 8.5l-2 5-5 2 2-5 5-2Z"></path></svg>Descubre</button>
    <button data-tab="tickets" style="flex:1;background:none;border:none;display:flex;flex-direction:column;align-items:center;gap:5px;color:${c('tickets')};font-size:10.5px;font-weight:700;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16a1 1 0 0 1 1 1v3a2 2 0 0 0 0 4v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3a2 2 0 0 0 0-4V7a1 1 0 0 1 1-1Z"></path><path d="M14 6v12"></path></svg>Entradas</button>
    <button data-tab="favorites" style="position:relative;flex:1;background:none;border:none;display:flex;flex-direction:column;align-items:center;gap:5px;color:${c('favorites')};font-size:10.5px;font-weight:700;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"></path></svg>Favoritos${badge}</button>
    <button data-tab="profile" style="flex:1;background:none;border:none;display:flex;flex-direction:column;align-items:center;gap:5px;color:${c('profile')};font-size:10.5px;font-weight:700;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"></circle><path d="M4 21a8 8 0 0 1 16 0"></path></svg>Perfil</button>
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
