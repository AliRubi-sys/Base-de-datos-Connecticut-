// ============================================================================
// Directorio de Negocios — Estado de Connecticut
// Aplicación 100% Exclusiva para Connecticut
// Leaflet + CartoDB Positron / Google Maps + GeoJSON Coroplético + Marker Clustering
// ============================================================================

function initCTApp() {
  let rawData = window.NEGOCIOS_CT_DATA || null;
  if (!rawData) {
    const dataEl = document.getElementById('negocios-data');
    if (dataEl) {
      try {
        rawData = JSON.parse(dataEl.textContent);
      } catch (e) {
        console.error('Error parseando JSON de negocios:', e);
      }
    }
  }

  if (!rawData || !Array.isArray(rawData)) {
    console.error('No se encontraron datos válidos de negocios.');
    return;
  }

  const searchInput = document.getElementById('search');
  const filterCat = document.getElementById('filterCategoria');
  const filterCiu = document.getElementById('filterCiudad');
  const listEl = document.getElementById('list');
  const listCountEl = document.getElementById('listCount');
  const detailEl = document.getElementById('detail');
  const tallyEl = document.getElementById('tally');

  if (tallyEl) tallyEl.textContent = `${rawData.length} negocios`;

  // Estilos visuales de alto contraste y soporte móvil táctil
  const styleEl = document.createElement('style');
  styleEl.innerHTML = `
    .tiles-cartodb-light {
      filter: grayscale(100%) brightness(107%) contrast(90%);
      -webkit-filter: grayscale(100%) brightness(107%) contrast(90%);
    }
    .tiles-cartodb-osm {
      filter: grayscale(100%) brightness(105%) contrast(85%);
      -webkit-filter: grayscale(100%) brightness(105%) contrast(85%);
    }
    .leaflet-control-layers {
      border-radius: 8px !important;
      border: 1px solid #DADCE0 !important;
      box-shadow: 0 2px 8px rgba(60,64,67,0.18) !important;
      font-family: 'Inter', -apple-system, sans-serif !important;
      font-size: 12px !important;
      padding: 6px 10px !important;
    }
    .leaflet-control-layers-base label {
      display: flex;
      align-items: center;
      gap: 7px;
      margin: 3px 0;
      cursor: pointer;
      font-weight: 500;
      color: #3C4043;
    }
    .gmaps-mode-pill {
      background: #FFFFFF;
      padding: 6px 12px;
      border-radius: 20px;
      border: 1px solid #DADCE0;
      box-shadow: 0 2px 6px rgba(60,64,67,0.22);
      font-size: 12px;
      font-weight: 600;
      color: #202124;
      display: flex;
      align-items: center;
      gap: 7px;
      margin-top: 10px;
      margin-right: 10px;
      z-index: 1000;
    }
    .gmaps-mode-pill .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    .gmaps-mode-pill .dot.choropleth { background: #EA4335; }
    .gmaps-mode-pill .dot.roadmap { background: #34A853; }

    .gmaps-legend {
      background: rgba(255,255,255,0.96);
      padding: 10px 14px;
      border-radius: 8px;
      border: 1px solid #DADCE0;
      box-shadow: 0 2px 8px rgba(60,64,67,0.18);
      font-family: 'Inter', sans-serif;
      font-size: 11.5px;
      color: #202124;
      line-height: 1.4;
      max-width: 220px;
      transition: opacity 0.25s ease, transform 0.25s ease;
      margin-bottom: 12px;
      margin-right: 10px;
      z-index: 1000;
    }
    .gmaps-legend.hidden {
      opacity: 0;
      pointer-events: none;
      transform: translateY(8px);
    }
    .gmaps-legend-title { font-weight: 700; font-size: 12px; margin-bottom: 2px; }
    .gmaps-legend-sub { font-size: 10.5px; color: #5F6368; display: block; margin-bottom: 6px; }
    .gmaps-legend-grades { display: flex; flex-direction: column; gap: 3px; }
    .gmaps-legend-grades div { display: flex; align-items: center; gap: 7px; }
    .gmaps-legend-grades i {
      width: 14px;
      height: 14px;
      border-radius: 3px;
      display: inline-block;
      border: 1px solid rgba(0,0,0,0.15);
      flex: none;
    }
    .gmaps-legend-hint { font-size: 10px; color: #70757A; margin-top: 6px; font-style: italic; border-top: 1px solid #E8EAED; padding-top: 4px; }

    .gmaps-tooltip-custom {
      background: #FFFFFF;
      border: 1px solid #DADCE0;
      box-shadow: 0 4px 16px rgba(60,64,67,0.28);
      border-radius: 8px;
      padding: 9px 13px;
      font-family: 'Inter', -apple-system, sans-serif;
      font-size: 12px;
      color: #202124;
      pointer-events: none;
      min-width: 190px;
      max-width: 280px;
    }
    .gmaps-tooltip-custom .tt-header { font-weight: 700; font-size: 13.5px; color: #1A73E8; margin-bottom: 2px; }
    .gmaps-tooltip-custom .tt-meta { font-size: 11px; color: #5F6368; margin-bottom: 6px; }
    .gmaps-tooltip-custom .tt-stat { font-weight: 600; font-size: 12px; color: #202124; display: flex; align-items: center; gap: 5px; }
    .gmaps-tooltip-custom .tt-stat.empty { color: #80868B; font-weight: 400; }
    .gmaps-tooltip-custom .tt-hint { font-size: 10.5px; color: #1A73E8; margin-top: 6px; border-top: 1px solid #E8EAED; padding-top: 4px; font-weight: 500; }

    .business-pin {
      width: 13px;
      height: 13px;
      border-radius: 50%;
      background: #EA4335;
      border: 2px solid #FFFFFF;
      box-shadow: 0 1px 4px rgba(0,0,0,0.4);
      transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .business-pin.selected {
      background: #FBBC04;
      border: 2.5px solid #FFFFFF;
      box-shadow: 0 0 0 3px #E37400, 0 4px 12px rgba(227,116,0,0.5);
      transform: scale(1.6);
      z-index: 1000 !important;
    }
    .gmaps-cluster-icon {
      background: #1A73E8;
      color: #FFFFFF;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'IBM Plex Mono', monospace;
      font-weight: 700;
      font-size: 12px;
      border: 2px solid #FFFFFF;
      box-shadow: 0 2px 8px rgba(26,115,232,0.45);
    }

    /* Layout táctil responsivo */
    :root { --safe-bottom: env(safe-area-inset-bottom, 0px); }
    html, body {
      width: 100% !important;
      height: 100% !important;
      height: 100dvh !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: hidden !important;
    }
    .app {
      width: 100% !important;
      height: 100% !important;
      height: 100dvh !important;
      display: flex !important;
      flex-direction: column !important;
      overflow: hidden !important;
    }
    header { flex: 0 0 auto !important; width: 100% !important; }
    .main {
      flex: 1 1 auto !important;
      height: 100% !important;
      min-height: 0 !important;
      position: relative !important;
      display: flex !important;
      overflow: hidden !important;
    }

    @media (min-width: 1025px) {
      .sidebar {
        flex: 0 0 350px !important;
        width: 350px !important;
        height: 100% !important;
        display: flex !important;
        flex-direction: column !important;
      }
      .right {
        flex: 1 1 auto !important;
        height: 100% !important;
        display: flex !important;
        flex-direction: column !important;
        position: relative !important;
      }
      #map { flex: 1 1 auto !important; width: 100% !important; height: 100% !important; }
      .detail { flex: 0 0 auto !important; }
      .mobile-tab-bar, .mobile-sheet-handle, .mobile-sheet-close { display: none !important; }
    }

    @media (max-width: 1024px) {
      .app {
        height: 100dvh !important;
        padding-bottom: calc(56px + var(--safe-bottom)) !important;
      }
      .mobile-tab-bar {
        display: flex !important;
        position: fixed !important;
        bottom: 0 !important;
        left: 0 !important;
        right: 0 !important;
        height: calc(56px + var(--safe-bottom)) !important;
        padding-bottom: var(--safe-bottom) !important;
        background: #FFFFFF !important;
        border-top: 1px solid #DADCE0 !important;
        box-shadow: 0 -3px 12px rgba(0,0,0,0.1) !important;
        z-index: 2500 !important;
      }
      .mobile-tab-btn {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        background: none;
        border: none;
        font-family: 'Inter', -apple-system, sans-serif;
        font-size: 14px;
        font-weight: 600;
        color: #5F6368;
        cursor: pointer;
        padding: 8px;
        touch-action: manipulation;
      }
      .mobile-tab-btn.active {
        color: #1A73E8;
        border-top: 3px solid #1A73E8;
        background: #F8F9FA;
      }
      .sidebar {
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        width: 100% !important;
        height: 100% !important;
        background: #FBF8F0 !important;
        z-index: 1500 !important;
        display: flex !important;
        flex-direction: column !important;
        transform: translateX(0);
        transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .sidebar.mobile-hidden {
        transform: translateX(-100%);
        pointer-events: none;
      }
      .right {
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        width: 100% !important;
        height: 100% !important;
        display: flex !important;
        flex-direction: column !important;
      }
      #map {
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        width: 100% !important;
        height: 100% !important;
      }
      .detail {
        position: fixed !important;
        left: 0 !important;
        right: 0 !important;
        bottom: calc(56px + var(--safe-bottom)) !important;
        max-height: 72vh !important;
        border-radius: 18px 18px 0 0 !important;
        box-shadow: 0 -6px 24px rgba(0,0,0,0.22) !important;
        border-top: 2px solid #DADCE0 !important;
        z-index: 2200 !important;
        transform: translateY(105%) !important;
        transition: transform 0.3s cubic-bezier(0.32, 1, 0.23, 1) !important;
        overflow-y: auto !important;
        -webkit-overflow-scrolling: touch !important;
        background: #FBF8F0 !important;
        padding: 16px 20px 24px !important;
      }
      .detail.mobile-open {
        transform: translateY(0) !important;
      }
      .mobile-sheet-handle {
        width: 44px;
        height: 5px;
        background: #B9AD8C;
        border-radius: 3px;
        margin: 0 auto 12px;
        cursor: grab;
      }
      .mobile-sheet-close {
        position: absolute;
        top: 14px;
        right: 16px;
        background: #E8EAED;
        border: none;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        font-size: 16px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #3C4043;
        cursor: pointer;
      }
    }
  `;
  document.head.appendChild(styleEl);

  // Inicialización del Mapa centrado en el corazón de Connecticut
  const map = L.map('map', {
    center: [41.50, -72.75],
    zoom: 10,
    zoomControl: true,
    minZoom: 8,
    maxZoom: 20,
    trackResize: true
  });

  // Capas de mapas base
  const cartoPositronStyle = L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
    subdomains: ['0', '1', '2', '3'],
    attribution: '&copy; Estilo CartoDB Positron / Google Maps',
    className: 'tiles-cartodb-light',
    maxZoom: 20,
    keepBuffer: 10,
    updateWhenIdle: false,
    updateWhenZooming: true
  }).addTo(map);

  const esriCanvasBase = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    attribution: '&copy; Esri World Light Gray',
    maxZoom: 16,
    keepBuffer: 8
  });
  const esriCanvasLabels = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
    attribution: '&copy; Esri Reference',
    maxZoom: 16,
    keepBuffer: 8
  });
  const esriLightGrayGroup = L.layerGroup([esriCanvasBase, esriCanvasLabels]);

  const osmLightGray = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    subdomains: ['a', 'b', 'c'],
    attribution: '&copy; OpenStreetMap',
    className: 'tiles-cartodb-osm',
    maxZoom: 19,
    keepBuffer: 8
  });

  const gmapsRoadmap = L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
    subdomains: ['0', '1', '2', '3'],
    attribution: '&copy; Google Maps',
    maxZoom: 20,
    keepBuffer: 8
  });

  const gmapsTerrain = L.tileLayer('https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}', {
    subdomains: ['0', '1', '2', '3'],
    attribution: '&copy; Google Maps',
    maxZoom: 20,
    keepBuffer: 8
  });

  L.control.layers({
    "Estilo CartoDB (Blanco y Gris Claro)": cartoPositronStyle,
    "Esri Lienzo Gris (World Light Gray)": esriLightGrayGroup,
    "OpenStreetMap (Gris Claro)": osmLightGray,
    "Google Maps (Color Tradicional)": gmapsRoadmap,
    "Google Maps (Terreno)": gmapsTerrain
  }, null, { position: 'topleft', collapsed: true }).addTo(map);

  // Redimensionamiento
  function forceMapResize() {
    if (map) map.invalidateSize({ pan: false, animate: false });
  }
  forceMapResize();
  setTimeout(forceMapResize, 100);
  setTimeout(forceMapResize, 350);
  setTimeout(forceMapResize, 800);
  window.addEventListener('resize', forceMapResize);
  window.addEventListener('orientationchange', () => {
    forceMapResize();
    setTimeout(forceMapResize, 150);
  });

  // Cluster Group para pins
  const clusterGroup = L.markerClusterGroup({
    showCoverageOnHover: false,
    maxClusterRadius: 36,
    iconCreateFunction: (cluster) => {
      const count = cluster.getChildCount();
      const size = count >= 50 ? 38 : count >= 15 ? 32 : 28;
      return L.divIcon({
        html: `<div class="gmaps-cluster-icon" style="width:${size}px;height:${size}px;">${count}</div>`,
        className: 'custom-cluster',
        iconSize: L.point(size, size)
      });
    }
  });

  function getChoroplethStyle(count) {
    if (count >= 20) return { fillColor: '#D93025', fillOpacity: 0.70, color: '#A51D24', weight: 1.8 };
    if (count >= 10) return { fillColor: '#F28B82', fillOpacity: 0.62, color: '#D93025', weight: 1.5 };
    if (count >= 6)  return { fillColor: '#FBBC04', fillOpacity: 0.54, color: '#E37400', weight: 1.4 };
    if (count >= 3)  return { fillColor: '#FDE282', fillOpacity: 0.46, color: '#F9AB00', weight: 1.3 };
    if (count >= 1)  return { fillColor: '#C6EAD4', fillOpacity: 0.40, color: '#34A853', weight: 1.2 };
    return { fillColor: '#E9EEF4', fillOpacity: 0.28, color: '#BAC7D5', weight: 1.0 };
  }

  // Controles en mapa
  const ZOOM_THRESHOLD = 13;

  const ModeControl = L.Control.extend({
    options: { position: 'topright' },
    onAdd: function () {
      const div = L.DomUtil.create('div', 'gmaps-mode-pill');
      div.id = 'gmapsModePill';
      div.style.cursor = 'pointer';
      div.title = 'Haz clic para alternar entre Mapa de Calor (Códigos Postales) y Vista Callejera';
      div.innerHTML = `<span class="dot choropleth"></span><span id="gmapsModeText">Mapa de Calor por CP</span>`;
      L.DomEvent.disableClickPropagation(div);
      div.addEventListener('click', () => {
        if (map.getZoom() >= ZOOM_THRESHOLD) {
          map.setView([41.50, -72.75], 10);
        } else {
          map.setZoom(14);
        }
      });
      return div;
    }
  });
  map.addControl(new ModeControl());

  const LegendControl = L.Control.extend({
    options: { position: 'bottomright' },
    onAdd: function () {
      const div = L.DomUtil.create('div', 'gmaps-legend');
      div.id = 'gmapsLegend';
      div.innerHTML = `
        <div class="gmaps-legend-title">Densidad de Negocios en CT</div>
        <span class="gmaps-legend-sub">Límites Oficiales US Census Bureau</span>
        <div class="gmaps-legend-grades">
          <div><i style="background:#D93025"></i> 20+ negocios</div>
          <div><i style="background:#F28B82"></i> 10 – 19</div>
          <div><i style="background:#FBBC04"></i> 6 – 9</div>
          <div><i style="background:#FDE282"></i> 3 – 5</div>
          <div><i style="background:#C6EAD4"></i> 1 – 2</div>
          <div><i style="background:#E9EEF4;border-color:#BAC7D5"></i> 0 negocios (área limítrofe)</div>
        </div>
        <div class="gmaps-legend-hint">Pasa el cursor o haz clic para explorar</div>
      `;
      L.DomEvent.disableClickPropagation(div);
      return div;
    }
  });
  map.addControl(new LegendControl());

  // Tooltip flotante
  let hoverTooltipEl = document.getElementById('gmapsFloatingTooltip');
  if (!hoverTooltipEl) {
    hoverTooltipEl = document.createElement('div');
    hoverTooltipEl.id = 'gmapsFloatingTooltip';
    hoverTooltipEl.className = 'gmaps-tooltip-custom';
    hoverTooltipEl.style.cssText = 'display:none;position:fixed;z-index:99999;pointer-events:none;transform:translate3d(0,0,0);will-change:top,left;';
    document.body.appendChild(hoverTooltipEl);
  }

  function hideHoverTooltip() {
    if (hoverTooltipEl) hoverTooltipEl.style.display = 'none';
  }

  function showHoverTooltip(html, clientX, clientY) {
    if (!hoverTooltipEl || !html) return;
    hoverTooltipEl.innerHTML = html;
    hoverTooltipEl.style.display = 'block';

    const width = hoverTooltipEl.offsetWidth || 230;
    const height = hoverTooltipEl.offsetHeight || 95;
    let left = clientX + 14;
    let top = clientY + 14;

    if (left + width > window.innerWidth - 12) left = clientX - width - 12;
    if (top + height > window.innerHeight - 12) top = clientY - height - 12;

    hoverTooltipEl.style.left = `${left}px`;
    hoverTooltipEl.style.top = `${top}px`;
  }

  let choroplethGeoJsonLayer = null;
  let activeHoverPolygon = null;
  let currentCountByZip = new Map();

  function buildChoroplethLayers(filteredItems) {
    if (choroplethGeoJsonLayer && map.hasLayer(choroplethGeoJsonLayer)) {
      map.removeLayer(choroplethGeoJsonLayer);
    }
    hideHoverTooltip();
    activeHoverPolygon = null;

    const countByZip = new Map();
    filteredItems.forEach(it => {
      if (!it.cp) return;
      const raw = String(it.cp).trim();
      const cp = raw.padStart(5, '0');
      countByZip.set(cp, (countByZip.get(cp) || 0) + 1);
    });
    currentCountByZip = countByZip;

    if (!window.ZIP_CODE_GEOJSON || !window.ZIP_CODE_GEOJSON.features) return;

    choroplethGeoJsonLayer = L.geoJSON(window.ZIP_CODE_GEOJSON, {
      style: (feature) => {
        const rawZip = feature.properties?.ZCTA5CE10 || feature.properties?.zip || feature.id || (feature.properties?.GEOID10 ? String(feature.properties.GEOID10).slice(2) : '') || '';
        const zip = String(rawZip).trim().padStart(5, '0');
        const count = countByZip.get(zip) || 0;
        return getChoroplethStyle(count);
      },
      onEachFeature: (feature, layer) => {
        const rawZip = feature.properties?.ZCTA5CE10 || feature.properties?.zip || feature.id || (feature.properties?.GEOID10 ? String(feature.properties.GEOID10).slice(2) : '') || '';
        const zip = String(rawZip).trim().padStart(5, '0');
        const meta = (window.CT_ZIP_NAMES && window.CT_ZIP_NAMES[zip]) || null;
        const name = feature.properties?.name || (meta ? meta.name : `Código Postal ${zip}`);
        const region = feature.properties?.region || (meta ? meta.region : 'Connecticut');

        layer.on({
          mousemove: (e) => {
            const count = currentCountByZip.get(zip) || 0;
            const statText = count === 1 ? '1 negocio registrado' : (count > 1 ? `${count} negocios registrados` : 'Sin negocios registrados en esta zona');
            const statClass = count === 0 ? 'tt-stat empty' : 'tt-stat';

            const html = `
              <div class="tt-header">CP ${zip} · ${name}</div>
              <div class="tt-meta">${region} · Connecticut</div>
              <div class="${statClass}">
                <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${count > 0 ? '#1A73E8' : '#80868B'}"></span>
                <span>${statText}</span>
              </div>
              <div class="tt-hint">Haz clic para filtrar y hacer zoom</div>
            `;
            showHoverTooltip(html, e.originalEvent.clientX, e.originalEvent.clientY);
          },
          mouseover: (e) => {
            activeHoverPolygon = layer;
            layer.setStyle({
              weight: 2.8,
              color: '#1A73E8',
              fillOpacity: Math.min(0.85, (layer.options.fillOpacity || 0.4) + 0.15)
            });
            if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
              layer.bringToFront();
            }
          },
          mouseout: (e) => {
            hideHoverTooltip();
            if (activeHoverPolygon === layer) activeHoverPolygon = null;
            const count = currentCountByZip.get(zip) || 0;
            layer.setStyle(getChoroplethStyle(count));
          },
          click: (e) => {
            hideHoverTooltip();
            const polyBounds = layer.getBounds();
            const center = polyBounds.getCenter();
            const calculatedZoom = map.getBoundsZoom(polyBounds);
            // Al hacer clic en un código postal, aseguramos acercar a mínimo nivel 13 para activar la vista de pines del área
            const targetZoom = Math.max(ZOOM_THRESHOLD, Math.min(calculatedZoom, 15));
            map.setView(center, targetZoom);
            if (searchInput) {
              searchInput.value = zip;
              applyFilters();
            }
          }
        });
      }
    });

    if (map.getZoom() < ZOOM_THRESHOLD) {
      choroplethGeoJsonLayer.addTo(map);
    }
  }

  function updateZoomLayers() {
    const zoom = map.getZoom();
    const pill = document.getElementById('gmapsModePill');
    const legend = document.getElementById('gmapsLegend');

    if (zoom >= ZOOM_THRESHOLD) {
      // Vista detallada / Callejera: Ocultar mapa coroplético y mostrar pines individuales y clusters de negocios
      if (choroplethGeoJsonLayer && map.hasLayer(choroplethGeoJsonLayer)) {
        map.removeLayer(choroplethGeoJsonLayer);
      }
      hideHoverTooltip();
      if (!map.hasLayer(clusterGroup)) {
        map.addLayer(clusterGroup);
      }
      if (pill) {
        pill.innerHTML = `<span class="dot roadmap"></span><span>Vista Callejera / Negocios</span>`;
      }
      if (legend) legend.classList.add('hidden');
    } else {
      // Vista macro / regional: Mostrar polígonos coropléticos del US Census y OCULTAR totalmente los puntos azules/clusters
      if (choroplethGeoJsonLayer && !map.hasLayer(choroplethGeoJsonLayer)) {
        map.addLayer(choroplethGeoJsonLayer);
      }
      if (map.hasLayer(clusterGroup)) {
        map.removeLayer(clusterGroup);
      }
      if (pill) {
        pill.innerHTML = `<span class="dot choropleth"></span><span>Mapa de Calor por CP</span>`;
      }
      if (legend) legend.classList.remove('hidden');
    }
  }

  map.on('zoomend', updateZoomLayers);

  // Población de desplegables dinámicos
  const categorias = Array.from(new Set(rawData.map(d => d.categoria).filter(Boolean))).sort();
  categorias.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    filterCat.appendChild(opt);
  });

  const ciudades = Array.from(new Set(rawData.map(d => d.ciudad).filter(Boolean))).sort();
  ciudades.forEach(ciu => {
    const opt = document.createElement('option');
    opt.value = ciu;
    opt.textContent = ciu;
    filterCiu.appendChild(opt);
  });

  const markerMap = new Map();
  let activeId = null;
  let currentFiltered = [...rawData];

  function createMarker(item) {
    const icon = L.divIcon({
      html: `<div class="business-pin" id="pin-${item.id}"></div>`,
      className: 'custom-pin-wrap',
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });

    const marker = L.marker([item.lat, item.lon], { icon });

    marker.bindPopup(`
      <div style="font-family:'Inter',sans-serif;font-size:12.5px;line-height:1.45;min-width:210px;padding:2px;">
        <strong style="font-family:'Fraunces',serif;font-size:15px;color:#1C2430;display:block;margin-bottom:3px;">${item.nombre}</strong>
        <div style="color:#B4801F;font-size:11px;font-weight:700;text-transform:uppercase;margin-bottom:5px;">${item.tipo}</div>
        <div style="color:#3C4656;margin-bottom:6px;">${item.direccion}</div>
        <div style="font-size:11px;color:#1A73E8;font-weight:600;margin-bottom:8px;">${item.ciudad}, CT · CP ${item.cp ? String(item.cp).padStart(5,'0') : ''}</div>
        <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.nombre + ' ' + item.direccion)}" target="_blank" rel="noopener" style="display:inline-block;background:#1A73E8;color:#FFFFFF;padding:4px 10px;border-radius:4px;text-decoration:none;font-size:11px;font-weight:600;">Ver en Google Maps &rarr;</a>
      </div>
    `, { offset: [0, -6] });

    marker.on('click', () => {
      selectItem(item.id, false);
    });

    return marker;
  }

  function selectItem(id, panTo = true) {
    activeId = id;
    const item = rawData.find(d => d.id === id);
    if (!item) return;

    document.querySelectorAll('.business-pin.selected').forEach(el => el.classList.remove('selected'));
    const pinEl = document.getElementById(`pin-${item.id}`);
    if (pinEl) pinEl.classList.add('selected');

    document.querySelectorAll('.item.active').forEach(el => el.classList.remove('active'));
    const itemBtn = document.querySelector(`.item[data-id="${id}"]`);
    if (itemBtn) {
      itemBtn.classList.add('active');
      itemBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    renderDetail(item);

    if (window.innerWidth <= 1024) {
      openMobileDetail();
    }

    if (panTo) {
      if (!map.hasLayer(clusterGroup)) {
        map.addLayer(clusterGroup);
      }
      if (choroplethGeoJsonLayer && map.hasLayer(choroplethGeoJsonLayer)) {
        map.removeLayer(choroplethGeoJsonLayer);
      }
      map.flyTo([item.lat, item.lon], Math.max(map.getZoom(), 16), {
        animate: true,
        duration: 0.8
      });
      const marker = markerMap.get(id);
      if (marker) {
        setTimeout(() => {
          marker.openPopup();
        }, 850);
      }
    }
  }

  function renderDetail(item) {
    detailEl.className = 'detail';
    detailEl.innerHTML = `
      <div class="mobile-sheet-handle"></div>
      <button class="mobile-sheet-close" id="mobileSheetClose" aria-label="Cerrar">&times;</button>
      <div class="detail-header">
        <div>
          <span class="detail-type">${item.tipo}</span>
          <h2>${item.nombre}</h2>
        </div>
        <span class="stamp auditado">Auditado CT</span>
      </div>
      <div class="detail-grid">
        <div class="field">
          <div class="flabel">Categoría</div>
          <div class="fvalue">${item.categoria || 'Alimentos y Bebidas'}</div>
        </div>
        <div class="field">
          <div class="flabel">Subcategoría</div>
          <div class="fvalue">${item.subcategoria || 'Negocio Local'}</div>
        </div>
        <div class="field" style="grid-column:1/-1;">
          <div class="flabel">Dirección Verificada</div>
          <div class="fvalue">${item.direccion}</div>
        </div>
        <div class="field">
          <div class="flabel">Municipio / Ciudad</div>
          <div class="fvalue">${item.ciudad}, CT</div>
        </div>
        <div class="field">
          <div class="flabel">Condado / Región</div>
          <div class="fvalue">${item.region || 'Connecticut'}</div>
        </div>
        <div class="field">
          <div class="flabel">Código Postal</div>
          <div class="fvalue mono">${item.cp ? String(item.cp).padStart(5, '0') : 'N/A'}</div>
        </div>
        <div class="field">
          <div class="flabel">Coordenadas Exactas</div>
          <div class="fvalue mono">${item.lat.toFixed(5)}, ${item.lon.toFixed(5)}</div>
        </div>
      </div>
      <div class="notas">
        <strong>Calibración de Precisión:</strong> ${item.notas || 'Ubicación geolocalizada con precisión sobre el predio oficial.'}
      </div>
      <div style="margin-top:14px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
        <a class="locate-link" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.nombre + ' ' + item.direccion + ' CT')}" target="_blank" rel="noopener" style="background:#1a73e8;color:#ffffff;padding:6px 12px;border-radius:5px;text-decoration:none;display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;">
          🔍 Ver Ficha en Google Maps &rarr;
        </a>
        <a class="locate-link" href="https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lon}" target="_blank" rel="noopener" style="background:#374151;color:#ffffff;padding:6px 12px;border-radius:5px;text-decoration:none;display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;">
          📍 Cómo llegar (GPS Exacto) &rarr;
        </a>
      </div>
    `;

    const closeBtn = document.getElementById('mobileSheetClose');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeMobileDetail);
    }
  }

  function openMobileDetail() {
    detailEl.classList.add('mobile-open');
  }

  function closeMobileDetail() {
    detailEl.classList.remove('mobile-open');
  }

  function setupMobileNavigation() {
    const tabMap = document.getElementById('mobileTabMap');
    const tabList = document.getElementById('mobileTabList');
    const sidebar = document.querySelector('.sidebar');

    if (tabMap && tabList && sidebar) {
      tabMap.addEventListener('click', () => {
        tabMap.classList.add('active');
        tabList.classList.remove('active');
        sidebar.classList.add('mobile-hidden');
        forceMapResize();
      });

      tabList.addEventListener('click', () => {
        tabList.classList.add('active');
        tabMap.classList.remove('active');
        sidebar.classList.remove('mobile-hidden');
        closeMobileDetail();
      });
    }
  }

  function applyFilters() {
    const q = (searchInput.value || '').trim().toLowerCase();
    const selCat = filterCat.value;
    const selCiu = filterCiu.value;

    currentFiltered = rawData.filter(item => {
      if (selCat && item.categoria !== selCat) return false;
      if (selCiu && item.ciudad !== selCiu) return false;
      if (!q) return true;

      const blob = [
        item.nombre,
        item.tipo,
        item.categoria,
        item.subcategoria,
        item.direccion,
        item.calle,
        item.ciudad,
        item.region,
        item.cp ? String(item.cp).padStart(5, '0') : '',
        item.notas
      ].filter(Boolean).join(' ').toLowerCase();

      return blob.includes(q);
    });

    listCountEl.textContent = `${currentFiltered.length} de ${rawData.length} negocios`;

    if (currentFiltered.length === 0) {
      listEl.innerHTML = `<div class="empty-list" style="padding:20px;text-align:center;color:#5F6368;font-size:13px;">No se encontraron negocios en Connecticut con esos filtros.</div>`;
    } else {
      listEl.innerHTML = currentFiltered.map(item => `
        <button class="item ${item.id === activeId ? 'active' : ''}" data-id="${item.id}">
          <span class="iname">${item.nombre}</span>
          <span class="imeta">
            <span style="color:#1A73E8;font-weight:600;">${item.tipo}</span>
            <span class="idot"></span>
            <span>${item.ciudad} (CP ${item.cp ? String(item.cp).padStart(5,'0') : ''})</span>
          </span>
        </button>
      `).join('');
    }

    clusterGroup.clearLayers();
    markerMap.clear();

    currentFiltered.forEach(item => {
      const marker = createMarker(item);
      markerMap.set(item.id, marker);
      clusterGroup.addLayer(marker);
    });

    buildChoroplethLayers(currentFiltered);
    updateZoomLayers();

    if ((q || selCiu) && currentFiltered.length > 0) {
      const bounds = L.latLngBounds(currentFiltered.map(d => [d.lat, d.lon]));
      const fitZoom = Math.max(ZOOM_THRESHOLD, Math.min(map.getBoundsZoom(bounds), 15));
      map.setView(bounds.getCenter(), fitZoom);
    }
  }

  searchInput.addEventListener('input', applyFilters);
  filterCat.addEventListener('change', applyFilters);
  filterCiu.addEventListener('change', applyFilters);

  listEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.item');
    if (btn) {
      const id = btn.dataset.id;
      selectItem(id, true);
    }
  });

  // Carga asíncrona de los 280+ polígonos vectoriales oficiales ZCTA del US Census Bureau para Connecticut
  async function loadFullStatewideGeoJSON() {
    try {
      const resp = await fetch('https://raw.githubusercontent.com/OpenDataDE/State-zip-code-GeoJSON/master/ct_connecticut_zip_codes_geo.min.json');
      if (!resp.ok) return;
      const fullData = await resp.json();
      if (fullData && fullData.features && fullData.features.length > 0) {
        fullData.features.forEach(f => {
          const rawZ = f.properties?.ZCTA5CE10 || f.properties?.zip || f.id || (f.properties?.GEOID10 ? String(f.properties.GEOID10).slice(2) : '') || '';
          const z = String(rawZ).trim().padStart(5, '0');
          if (z && window.CT_ZIP_NAMES && window.CT_ZIP_NAMES[z]) {
            if (!f.properties.name) f.properties.name = window.CT_ZIP_NAMES[z].name;
            if (!f.properties.city) f.properties.city = window.CT_ZIP_NAMES[z].city;
            if (!f.properties.region) f.properties.region = window.CT_ZIP_NAMES[z].region;
          }
          if (!f.properties.zip) f.properties.zip = z;
        });
        window.ZIP_CODE_GEOJSON = fullData;
        if (typeof currentFiltered !== 'undefined' && currentFiltered) {
          buildChoroplethLayers(currentFiltered);
          updateZoomLayers();
        }
        console.log(`[Connecticut ZCTA] Se cargaron ${fullData.features.length} polígonos oficiales de alta precisión del US Census Bureau.`);
      }
    } catch (err) {
      console.info('[Connecticut ZCTA] Usando polígonos locales precargados de zipcodes_ct.js');
    }
  }

  setupMobileNavigation();
  applyFilters();
  updateZoomLayers();
  loadFullStatewideGeoJSON();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCTApp);
} else {
  initCTApp();
}
