/* ============================================================================
   icons.js — iconos SVG inline reutilizables (devuelven markup como string)
   ========================================================================== */

const SVG = {
  pin: (c, s = 12) =>
    `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>`,

  chevDown: (c, s = 17) =>
    `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"></path></svg>`,

  bell: (c, s = 20) =>
    `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 8 2.5 8h-17S6 15 6 9Z"></path><path d="M10.5 21a1.8 1.8 0 0 0 3 0"></path></svg>`,

  search: (c, s = 19) =>
    `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"></circle><path d="M21 21l-4.3-4.3"></path></svg>`,

  sliders: (c, s = 17) =>
    `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M2 14h4M10 8h4M18 16h4"></path></svg>`,

  close: (c, s = 18) =>
    `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"></path></svg>`,

  cal: (c, s = 14) =>
    `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4M16 2v4M3 10h18"></path><rect x="3" y="4" width="18" height="18" rx="2"></rect></svg>`,

  mapPin: (c, s = 14) =>
    `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>`,

  check: (c, s = 18) =>
    `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>`,

  locate: (c, s = 18) =>
    `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.2"></circle><path d="M12 2v3M12 19v3M2 12h3M19 12h3"></path></svg>`,

  // el corazón lleva data-eid para poder actualizarlo al marcar favorito
  heart: (fill, stroke, s, id) =>
    `<svg class="hsvg" data-eid="${id}" width="${s}" height="${s}" viewBox="0 0 24 24" fill="${fill}" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"></path></svg>`,

  // icono por categoría — usado en las miniaturas de las mini-cards del mapa
  catIcon: (cat, c = '#fff', s = 14) => {
    const paths = {
      concert:    '<path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle>',
      festival:   '<path d="M12 2.5l2.9 5.9 6.6 1-4.8 4.6 1.1 6.5L12 17.4 6.2 20.5l1.1-6.5L2.5 9.4l6.6-1z"></path>',
      football:   '<circle cx="12" cy="12" r="9"></circle><path d="M12 7.2l2.6 1.9-1 3.1h-3.2l-1-3.1z"></path><path d="m5.6 10.2 2.8 1M18.4 10.2l-2.8 1M8.4 18l1.2-2.7M15.6 18l-1.2-2.7"></path>',
      basket:     '<circle cx="12" cy="12" r="9"></circle><path d="M3 12h18M12 3v18"></path><path d="M5.6 5.6c3.4 2.6 3.4 10.2 0 12.8M18.4 5.6c-3.4 2.6-3.4 10.2 0 12.8"></path>',
      balonmano:  '<circle cx="12" cy="12" r="9"></circle><path d="M12 3c2.6 2.6 2.6 15.4 0 18M12 3c-2.6 2.6-2.6 15.4 0 18M3.5 9c3 1.4 14 1.4 17 0M3.5 15c3-1.4 14-1.4 17 0"></path>',
      experience: '<path d="M12 3v3M12 18v3M3 12h3M18 12h3"></path><path d="M12 8l1.3 2.7L16 12l-2.7 1.3L12 16l-1.3-2.7L8 12l2.7-1.3z"></path>',
    };
    return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths[cat] || paths.experience}</svg>`;
  },

  // iconos por tipo de notificación in-app
  notifType: (type, c = '#374151', s = 20) => {
    const paths = {
      event_start:  '<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path>',
      price_alert:  '<path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.41 0l7.3-7.3a1 1 0 0 0 0-1.41Z"></path><circle cx="7" cy="7" r="1.5" fill="' + c + '" stroke="none"></circle>',
      last_tickets: '<path d="M4 6h16a1 1 0 0 1 1 1v3a2 2 0 0 0 0 4v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3a2 2 0 0 0 0-4V7a1 1 0 0 1 1-1Z"></path><path d="M14 6v12"></path><path d="M18 8v2M18 14v2"></path>',
      reminder:     '<path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 8 2.5 8h-17S6 15 6 9Z"></path><path d="M10.5 21a1.8 1.8 0 0 0 3 0"></path>',
      new_event:    '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle>',
    };
    return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths[type] || paths.reminder}</svg>`;
  },
};
