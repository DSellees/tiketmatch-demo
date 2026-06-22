/* ============================================================================
   app.js — estado, render de la pantalla Home e interacciones.
   Debe cargarse el último (depende de data.js, icons.js y components.js).
   ========================================================================== */

// ── Estado de la app ─────────────────────────────────────────────────────────
const state = {
  cat: 'Discover',   // categoría seleccionada
  tab: 'home',       // pestaña activa de la barra inferior
  fav: new Set(),    // ids de eventos marcados como favoritos
};

// ── Render de la pantalla ────────────────────────────────────────────────────
function render() {
  const stdRow  = ids => ids.map(id => `<div style="flex:0 0 auto;width:278px;">${cardStd(EV[id])}</div>`).join('');
  const editRow = ids => ids.map(id => `<div style="flex:0 0 auto;width:240px;">${cardEdit(EV[id])}</div>`).join('');

  document.getElementById('app').innerHTML = `
    <div id="content">
      <!-- cabecera: ciudad + notificaciones -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 20px 0;">
        <div>
          <div style="display:flex;align-items:center;gap:5px;color:#9CA3AF;font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;">${SVG.pin(AC)}&nbsp;Tu ciudad</div>
          <div style="display:flex;align-items:center;gap:6px;margin-top:3px;"><span style="font-family:'Sora';font-weight:800;font-size:21px;color:#111827;letter-spacing:-.02em;">Barcelona</span>${SVG.chevDown('#111827')}</div>
        </div>
        <button style="position:relative;width:44px;height:44px;border-radius:14px;border:1px solid #EFEFF1;background:#fff;display:flex;align-items:center;justify-content:center;">${SVG.bell('#111827')}<span style="position:absolute;top:9px;right:10px;width:8px;height:8px;border-radius:50%;background:${AC};border:2px solid #fff;"></span></button>
      </div>

      <!-- buscador -->
      <div style="padding:14px 20px 0;">
        <div style="display:flex;align-items:center;gap:10px;height:50px;background:#fff;border:1px solid #EFEFF1;border-radius:16px;padding:0 12px 0 14px;box-shadow:0 2px 10px rgba(17,24,39,.04);">
          ${SVG.search('#9CA3AF')}
          <span style="color:#9CA3AF;font-size:14.5px;font-weight:500;flex:1;">Busca conciertos, deporte, planes…</span>
          <span style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:11px;background:${AC};">${SVG.sliders('#fff')}</span>
        </div>
      </div>

      <!-- pills de categoría -->
      ${catPills()}

      <!-- Eventos cerca de ti -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:0 20px;margin:22px 0 12px;">
        <div style="font-family:'Sora';font-weight:700;font-size:19px;color:#111827;letter-spacing:-.02em;">Eventos cerca de ti</div>
        <button style="border:none;background:none;color:${AC};font-size:13px;font-weight:700;">Ver todo</button>
      </div>
      <div data-scroll style="display:flex;gap:14px;overflow-x:auto;padding:0 20px 4px;">${stdRow(NEARBY)}</div>

      <!-- Populares ahora -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:0 20px;margin:24px 0 12px;">
        <div style="font-family:'Sora';font-weight:700;font-size:19px;color:#111827;letter-spacing:-.02em;">Populares ahora</div>
        <button style="border:none;background:none;color:${AC};font-size:13px;font-weight:700;">Ver todo</button>
      </div>
      <div data-scroll style="display:flex;gap:14px;overflow-x:auto;padding:0 20px 4px;">${stdRow(POPULAR)}</div>

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
          <div style="font-family:'Sora';font-weight:700;font-size:19px;color:#111827;letter-spacing:-.02em;">Trending en Barcelona</div>
          <span style="display:inline-flex;align-items:center;gap:5px;color:${AC};font-size:10.5px;font-weight:800;background:${AS};padding:4px 9px;border-radius:999px;">TOP 5</span>
        </div>
        ${TREND.map(t => trendRow(t)).join('')}
      </div>

      <!-- Recomendado para ti -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:0 20px;margin:24px 0 12px;">
        <div style="font-family:'Sora';font-weight:700;font-size:19px;color:#111827;letter-spacing:-.02em;">Recomendado para ti</div>
        <button style="border:none;background:none;color:${AC};font-size:13px;font-weight:700;">Ver todo</button>
      </div>
      <div data-scroll style="display:flex;gap:14px;overflow-x:auto;padding:0 20px 4px;">${stdRow(RECOMMENDED)}</div>
    </div>
    ${bottomNav()}`;
}

// ── Interacciones (delegación de eventos a nivel documento) ──────────────────
document.addEventListener('click', e => {
  // ① marcar / desmarcar favorito
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

  // ② cambiar categoría
  const catBtn = e.target.closest('[data-catbtn]');
  if (catBtn) {
    state.cat = catBtn.dataset.catbtn;
    document.querySelectorAll('[data-catbtn]').forEach(b => {
      const on = b.dataset.catbtn === state.cat;
      b.style.background = on ? AC : '#F1F1F4';
      b.style.color      = on ? '#fff' : '#374151';
      b.style.boxShadow  = on ? '0 8px 18px rgba(255,87,34,0.35)' : 'none';
    });
    return;
  }

  // ③ cambiar pestaña de la barra inferior
  const tabBtn = e.target.closest('[data-tab]');
  if (tabBtn) {
    state.tab = tabBtn.dataset.tab;
    document.querySelectorAll('[data-tab]').forEach(b => {
      b.style.color = b.dataset.tab === state.tab ? AC : '#9CA3AF';
    });
    return;
  }
});

// ── Arranque ─────────────────────────────────────────────────────────────────
render();
