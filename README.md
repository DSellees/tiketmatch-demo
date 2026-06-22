# Catchtime · Home (web app móvil)

Web app responsive (HTML + CSS + JS sin frameworks) que recrea la pantalla
**Home** de Catchtime — un buscador de eventos y entradas para Barcelona.
Pensada para móvil: ocupa toda la pantalla y se comporta como una app nativa
(barra inferior fija, carruseles horizontales, favoritos, filtros).

## Estructura

```
.
├── index.html          # Shell: tipografías, <link> al CSS y <script> de la app
├── css/
│   └── styles.css      # Reset, tokens (:root) y layout (#app, #content, #nav)
├── js/
│   ├── data.js         # Datos de ejemplo y constantes (eventos, categorías…)
│   ├── icons.js        # Iconos SVG inline reutilizables (objeto SVG)
│   ├── components.js   # Funciones de UI: tarjetas, pills, nav, fila trending
│   └── app.js          # Estado, render de la Home e interacciones
├── assets/             # (reservado para imágenes/recursos futuros)
└── README.md
```

### Por qué este reparto
- **`data.js`** centraliza el contenido. El día que haya backend, solo se cambia
  esto por una llamada `fetch`.
- **`icons.js`** evita repetir SVG por toda la app.
- **`components.js`** son funciones puras `dato → string HTML`. Leen `state` en
  tiempo de llamada, por eso pueden cargarse antes que `app.js`.
- **`app.js`** es el único que tiene estado y orquesta el render.

> Los estilos a nivel de componente van *inline* dentro de los templates de
> `components.js` para mantener la fidelidad 1:1 con el diseño original. El CSS
> global y el layout están en `css/styles.css`.

## Cómo ejecutar

Al ser estático no necesita build. Cualquiera de estas opciones:

```bash
# opción 1 — servidor local (recomendado)
python3 -m http.server 7823
# luego abre http://localhost:7823
```

O simplemente abre `index.html` en el navegador (doble clic). Se usan
`<script>` clásicos en orden, así que funciona también con `file://`.

## Estado e interacciones
- **Categorías**: la pill activa se resalta (`state.cat`).
- **Favoritos**: el corazón alterna y el badge de la pestaña *Favoritos* cuenta
  (`state.fav`).
- **Barra inferior**: marca la pestaña activa (`state.tab`).

## Pendiente / siguientes pasos
- Pantalla de **detalle de evento**.
- Pantallas de **Entradas**, **Favoritos** y **Perfil**.
- Convertir en **PWA** (instalable, pantalla completa).
- Conectar datos reales (sustituir `data.js` por API).
