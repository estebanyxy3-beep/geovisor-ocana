document.addEventListener("DOMContentLoaded", function () {
  const ocanaCoords = [8.236372, -73.353228];

  const sidebar = document.getElementById("sidebar");
  const navToggle = document.getElementById("navToggle");
  const sidebarOverlay = document.getElementById("sidebarOverlay");
  const views = document.querySelectorAll(".view");
  const navButtons = document.querySelectorAll(".nav-item");
  const viewButtons = document.querySelectorAll("[data-view-target]");
  const searchInput = document.getElementById("homeSearchInput");
  const searchBtn = document.getElementById("homeSearchBtn");
  const searchStatus = document.getElementById("searchStatus");
  const legendContent = document.getElementById("legendContent");
  const riskInfoContent = document.getElementById("riskInfoContent");

  function syncChatbotContext(data) {
    if (window.updateChatbotContext) {
      window.updateChatbotContext(data);
    }
  }

  function setActiveNav(viewName) {
    navButtons.forEach((btn) => btn.classList.remove("active"));
    const activeButton = document.querySelector(`.nav-item[data-view="${viewName}"]`);
    if (activeButton) activeButton.classList.add("active");
  }

  function closeSidebar() {
    if (sidebar) sidebar.classList.add("collapsed");
    if (sidebarOverlay) {
      sidebarOverlay.classList.remove("visible");
      sidebarOverlay.classList.remove("active");
    }
  }

  function openSidebar() {
    if (sidebar) sidebar.classList.remove("collapsed");
    if (sidebarOverlay) {
      sidebarOverlay.classList.add("visible");
      sidebarOverlay.classList.add("active");
    }
  }

  function showView(viewName) {
    views.forEach((view) => view.classList.remove("active"));

    const targetView = document.getElementById(`view-${viewName}`);
    if (targetView) {
      targetView.classList.add("active");
    } else {
      const fallback = document.getElementById("view-inicio");
      if (fallback) fallback.classList.add("active");
      viewName = "inicio";
    }

    setActiveNav(viewName);
    closeSidebar();

    const moduleNames = {
      inicio: "Inicio",
      riesgo: "Mapas de Riesgo",
      mecanismos: "Mecanismos de Participación",
      pot: "POT",
      pomca: "POMCA",
      accidentabilidad: "Accidentabilidad"
    };

    syncChatbotContext({ activeModule: moduleNames[viewName] || "Inicio" });

    window.scrollTo({ top: 0, behavior: "smooth" });

    if (viewName === "riesgo" && window.__geovisorMap) {
      setTimeout(() => {
        window.__geovisorMap.invalidateSize(true);
      }, 300);
    }

    if (viewName === "accidentabilidad" && accidentMap) {
      setTimeout(() => accidentMap.invalidateSize(true), 300);
    }
  }

  function normalizeText(text) {
    return String(text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function runHomeSearch() {
    if (!searchInput) return;

    const raw = searchInput.value.trim();
    if (!raw) {
      if (searchStatus) searchStatus.textContent = "Escribe un término para buscar.";
      return;
    }

    const q = normalizeText(raw);
    let targetView = null;

    if (
      q.includes("inicio") ||
      q.includes("vaoi") ||
      q.includes("vision ambiental") ||
      q.includes("ocana interactiva")
    ) {
      targetView = "inicio";
    } else if (
      q.includes("riesgo") ||
      q.includes("amenaza") ||
      q.includes("avenida torrencial") ||
      q.includes("inundacion") ||
      q.includes("movimiento en masa") ||
      q.includes("exposicion")
    ) {
      targetView = "riesgo";
    } else if (
      q.includes("participacion") ||
      q.includes("ciudadana") ||
      q.includes("comunidad") ||
      q.includes("mecanismos")
    ) {
      targetView = "mecanismos";
    } else if (
      q.includes("pot") ||
      q.includes("ordenamiento territorial") ||
      q.includes("normativa")
    ) {
      targetView = "pot";
    } else if (
      q.includes("pomca") ||
      q.includes("cuenca") ||
      q.includes("algodonal")
    ) {
      targetView = "pomca";
    } else if (
      q.includes("accidentabilidad") ||
      q.includes("accidente") ||
      q.includes("transito") ||
      q.includes("movilidad") ||
      q.includes("vial") ||
      q.includes("siniestro")
    ) {
      targetView = "accidentabilidad";
    }

    if (targetView) {
      showView(targetView);

      if (searchStatus) {
        const names = {
          inicio: "Inicio",
          riesgo: "Mapas de Riesgo",
          mecanismos: "Mecanismos de Participación",
          pot: "POT",
          pomca: "POMCA",
          accidentabilidad: "Accidentabilidad"
        };
        searchStatus.textContent = `Resultado encontrado: ${names[targetView]}.`;
      }
    } else {
      if (searchStatus) searchStatus.textContent = "No encontré ese término.";
    }
  }

  navButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const viewName = this.dataset.view;
      if (viewName) showView(viewName);
    });
  });

  viewButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const viewName = this.dataset.viewTarget;
      if (viewName) showView(viewName);
    });
  });

  if (navToggle && sidebar) {
    navToggle.addEventListener("click", function () {
      const isCollapsed = sidebar.classList.contains("collapsed");
      if (isCollapsed) {
        openSidebar();
      } else {
        closeSidebar();
      }
    });
  }

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener("click", closeSidebar);
  }

  if (searchBtn) {
    searchBtn.addEventListener("click", runHomeSearch);
  }

  if (searchInput) {
    searchInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") runHomeSearch();
    });
  }

  let map = null;
  let osm = null;
  let satellite = null;
  let currentRiskLayer = null;
  let accidentMap = null;

  const riskLayersConfig = {
    amenaza_at: {
      label: "Amenaza por avenida torrencial",
      url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/Amenaza_Avenida_Torrencial_Urbano.json",
      kind: "amenaza",
      info: `<p><strong>Amenaza:</strong> zonificación territorial del fenómeno de avenida torrencial.</p>`
    },
    exposicion_at: {
      label: "Construcción expuesta por avenida torrencial",
      url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/exposicion/Construccion_Expuesta_avenid1.json",
      kind: "exposicion",
      info: `<p><strong>Exposición:</strong> construcciones expuestas frente a avenida torrencial.</p>`
    },
    riesgo_at: {
      label: "Construcción en riesgo por avenida torrencial",
      url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/riesgo/Construccion_Riesgo_avenida_.json",
      kind: "riesgo",
      info: `<p><strong>Riesgo:</strong> construcciones en riesgo por avenida torrencial.</p>`
    },
    amenaza_inundacion: {
      label: "Amenaza por inundación",
      url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/amenaza/Zonificacion_Amenaza_InundacUrban.json",
      kind: "amenaza",
      info: `<p><strong>Amenaza:</strong> zonificación de amenaza por inundación.</p>`
    },
    exposicion_inundacion: {
      label: "Construcción expuesta por inundación",
      url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/exposicion/Construccion_Expuesta_inunda1.json",
      kind: "exposicion",
      info: `<p><strong>Exposición:</strong> construcciones expuestas por inundación.</p>`
    },
    riesgo_inundacion: {
      label: "Construcción en riesgo por inundación",
      url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/riesgo/Construccion_Riesgo_inundaci.json",
      kind: "riesgo",
      info: `<p><strong>Riesgo:</strong> construcciones en riesgo por inundación.</p>`
    },
    amenaza_mm: {
      label: "Amenaza por movimiento en masa",
      url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/amenaza/Zonificacion_Amenaza_Movimie_Mas.json",
      kind: "amenaza",
      info: `<p><strong>Amenaza:</strong> zonificación de amenaza por movimiento en masa.</p>`
    },
    exposicion_mm: {
      label: "Construcción expuesta por movimiento en masa",
      url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/exposicion/Construccion_Expuesta_Movimi1.json",
      kind: "exposicion",
      info: `<p><strong>Exposición:</strong> construcciones expuestas por movimiento en masa.</p>`
    },
    riesgo_mm: {
      label: "Construcción en riesgo por movimiento en masa",
      url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/riesgo/Construccion_Riesgo_Movimien.json",
      kind: "riesgo",
      info: `<p><strong>Riesgo:</strong> construcciones en riesgo por movimiento en masa.</p>`
    }
  };

  function detectSeverity(props = {}) {
    const knownFields = [
      "nivel", "NIVEL",
      "amenaza", "AMENAZA",
      "riesgo", "RIESGO",
      "categoria", "CATEGORIA",
      "clase", "CLASE",
      "clasifica", "CLASIFICA",
      "clasificacion", "CLASIFICACION",
      "tipo", "TIPO",
      "grado", "GRADO",
      "grado_3", "Grado_3", "GRADO_3",
      "gridcode", "GRIDCODE",
      "id", "ID",
      "Nivel_Amen", "NIVEL_AMEN",
      "Nivel_Ries", "NIVEL_RIES",
      "Nivel_Expo", "NIVEL_EXPO",
      "nivel_amen", "nivel_ries",
      "Niv_Amena", "NIV_AMENA",
      "Niv_Riesgo", "NIV_RIESGO",
      "Cat_Amena", "CAT_AMENA",
      "Cat_Riesgo", "CAT_RIESGO",
      "Zona", "ZONA", "zona",
      "Clasif", "CLASIF", "clasif",
      "Descrip", "DESCRIP", "descrip",
      "descripcion", "DESCRIPCION",
      "name", "NAME",
      "value", "VALUE",
      "Val", "VAL"
    ];

    for (const field of knownFields) {
      const value = props[field];
      if (value === undefined || value === null || value === "") continue;

      if (typeof value === "number") {
        if (value >= 3) return "alto";
        if (value === 2) return "medio";
        if (value === 1) return "bajo";
      }

      const text = normalizeText(String(value));
      if (text.includes("alta") || text.includes("alto") || text === "3" || text.includes("high")) return "alto";
      if (text.includes("media") || text.includes("medio") || text === "2" || text.includes("medium") || text.includes("mod")) return "medio";
      if (text.includes("baja") || text.includes("bajo") || text === "1" || text.includes("low")) return "bajo";
    }

    for (const [, value] of Object.entries(props)) {
      if (value === undefined || value === null || value === "") continue;

      if (typeof value === "number") {
        if (value === 3) return "alto";
        if (value === 2) return "medio";
        if (value === 1) return "bajo";
      }

      const text = normalizeText(String(value));
      if (text === "alta" || text === "alto" || text === "3") return "alto";
      if (text === "media" || text === "medio" || text === "2") return "medio";
      if (text === "baja" || text === "bajo" || text === "1") return "bajo";
    }

    return "";
  }

  function getFeatureStyle(props = {}, config = {}) {
    const severity = detectSeverity(props);

    if (config.kind === "amenaza") {
      if (severity === "alto") return { color: "#991b1b", weight: 2, fillColor: "#d73027", fillOpacity: 0.55 };
      if (severity === "medio") return { color: "#a16207", weight: 2, fillColor: "#facc15", fillOpacity: 0.55 };
      if (severity === "bajo") return { color: "#166534", weight: 2, fillColor: "#22c55e", fillOpacity: 0.55 };
      return { color: "#a16207", weight: 2, fillColor: "#facc15", fillOpacity: 0.45 };
    }

    if (config.kind === "riesgo") {
      if (severity === "alto") return { color: "#7f1d1d", weight: 2, fillColor: "#dc2626", fillOpacity: 0.60 };
      if (severity === "medio") return { color: "#9a3412", weight: 2, fillColor: "#f97316", fillOpacity: 0.60 };
      if (severity === "bajo") return { color: "#166534", weight: 2, fillColor: "#22c55e", fillOpacity: 0.60 };
      return { color: "#9a3412", weight: 2, fillColor: "#f97316", fillOpacity: 0.50 };
    }

    if (config.kind === "exposicion") {
      return { color: "#b45309", weight: 2, fillColor: "#f59e0b", fillOpacity: 0.58 };
    }

    return { color: "#64748b", weight: 2, fillColor: "#94a3b8", fillOpacity: 0.45 };
  }

  function setBaseLayer(layerName) {
    if (!map || !osm || !satellite) return;
    if (map.hasLayer(osm)) map.removeLayer(osm);
    if (map.hasLayer(satellite)) map.removeLayer(satellite);
    if (layerName === "satellite") {
      satellite.addTo(map);
    } else {
      osm.addTo(map);
    }
  }

  function getLegendItemsFromLayer(features, config) {
    if (config.kind === "exposicion") {
      return [{ color: "#f59e0b", label: "Construcción expuesta" }];
    }

    if (!features || !features.length) return [];

    const found = { alto: false, medio: false, bajo: false };

    features.forEach((feature) => {
      const severity = detectSeverity((feature && feature.properties) || {});
      if (severity === "alto") found.alto = true;
      if (severity === "medio") found.medio = true;
      if (severity === "bajo") found.bajo = true;
    });

    const items = [];

    if (config.kind === "amenaza") {
      if (found.alto) items.push({ color: "#d73027", label: "Amenaza alta" });
      if (found.medio) items.push({ color: "#facc15", label: "Amenaza media" });
      if (found.bajo) items.push({ color: "#22c55e", label: "Amenaza baja" });
    }

    if (config.kind === "riesgo") {
      if (found.alto) items.push({ color: "#dc2626", label: "Riesgo alto" });
      if (found.medio) items.push({ color: "#f97316", label: "Riesgo medio" });
      if (found.bajo) items.push({ color: "#22c55e", label: "Riesgo bajo" });
    }

    if (!items.length) {
      const baseColor = config.kind === "riesgo" ? "#dc2626" : "#d73027";
      const baseLabel = config.kind === "riesgo" ? "Construcción en riesgo" : "Zona de amenaza";
      items.push({ color: baseColor, label: baseLabel });
    }

    return items;
  }

  function updateLegend(config = null, features = []) {
    if (!legendContent) return;

    if (!config) {
      legendContent.innerHTML = `
        <div class="legend-item">
          <span class="swatch" style="background:#2f8f5b;"></span>
          <span>Selecciona una capa</span>
        </div>`;
      return;
    }

    const items = getLegendItemsFromLayer(features, config);

    legendContent.innerHTML = items.map((item) => `
      <div class="legend-item">
        <span class="swatch" style="background:${item.color};"></span>
        <span>${item.label}</span>
      </div>`).join("");
  }

  function updateRiskInfo(html = "") {
    if (!riskInfoContent) return;
    riskInfoContent.innerHTML = html || "<p>Selecciona una capa para ver su contenido.</p>";
  }

  function buildPopupHtml(feature, config) {
    const props = feature.properties || {};
    let html = `<strong>${config.label}</strong>`;
    Object.entries(props).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        html += `<br><strong>${key}:</strong> ${value}`;
      }
    });
    return html;
  }

  async function loadRiskLayer(layerKey) {
    if (!map) return;

    const config = riskLayersConfig[layerKey];
    if (!config) return;

    syncChatbotContext({
      activeLayer: config.label,
      activeModule: "Mapas de Riesgo",
      selectedFeature: null
    });

    if (currentRiskLayer && map.hasLayer(currentRiskLayer)) {
      map.removeLayer(currentRiskLayer);
      currentRiskLayer = null;
    }

    updateRiskInfo(`<h4>${config.label}</h4>${config.info}<p style="color:#8a6b00;font-size:0.85rem;margin-top:8px;">⏳ Cargando capa…</p>`);

    try {
      const response = await fetch(config.url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const geojson = await response.json();
      const features = Array.isArray(geojson.features) ? geojson.features : [];

      updateLegend(config, features);
      updateRiskInfo(`<h4>${config.label}</h4>${config.info}`);

      currentRiskLayer = L.geoJSON(geojson, {
        style: function (feature) {
          return getFeatureStyle(feature.properties || {}, config);
        },
        pointToLayer: function (feature, latlng) {
          const style = getFeatureStyle(feature.properties || {}, config);
          return L.circleMarker(latlng, {
            radius: 6,
            color: style.color,
            weight: 1,
            fillColor: style.fillColor,
            fillOpacity: style.fillOpacity
          });
        },
        onEachFeature: function (feature, layer) {
          layer.bindPopup(buildPopupHtml(feature, config));
          layer.on("click", function () {
            syncChatbotContext({
              activeLayer: config.label,
              activeModule: "Mapas de Riesgo",
              selectedFeature: feature
            });
          });
        }
      });

      currentRiskLayer.addTo(map);
      map.invalidateSize(true);

      if (currentRiskLayer.getBounds && currentRiskLayer.getBounds().isValid()) {
        map.fitBounds(currentRiskLayer.getBounds(), { padding: [40, 40] });
      }
    } catch (error) {
      console.error("Error cargando capa:", error);
      updateLegend(null);
      updateRiskInfo(`
        <h4>${config.label}</h4>
        <p style="color:#991b1b;">⚠️ No se pudo cargar la capa.</p>
        <p style="font-size:0.82rem;color:#64748b;"><strong>URL:</strong><br>${config.url}</p>
        <p style="font-size:0.82rem;color:#64748b;">Verifica que el archivo existe en GitHub con ese nombre exacto.</p>
      `);
    }
  }

  function clearActiveRiskLayer() {
    document.querySelectorAll('input[name="riesgoLayer"]').forEach((radio) => {
      radio.checked = false;
    });

    if (currentRiskLayer && map && map.hasLayer(currentRiskLayer)) {
      map.removeLayer(currentRiskLayer);
      currentRiskLayer = null;
    }

    updateLegend(null);
    updateRiskInfo("<p>Selecciona una capa para ver su contenido.</p>");

    if (map) map.setView(ocanaCoords, 15);

    syncChatbotContext({
      activeLayer: null,
      activeModule: "Mapas de Riesgo",
      selectedFeature: null
    });
  }

  try {
    const mapElement = document.getElementById("map");

    if (mapElement && window.L) {
      map = L.map("map", { preferCanvas: true }).setView(ocanaCoords, 15);
      window.__geovisorMap = map;

      osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors"
      });

      satellite = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 19,
          attribution: "Tiles &copy; Esri"
        }
      );

      osm.addTo(map);

      document.querySelectorAll('input[name="baseLayer"]').forEach((radio) => {
        radio.addEventListener("change", (e) => setBaseLayer(e.target.value));
      });

      document.querySelectorAll('input[name="riesgoLayer"]').forEach((radio) => {
        radio.addEventListener("change", (e) => loadRiskLayer(e.target.value));
      });

      const clearButton = document.getElementById("clearRiskLayer");
      if (clearButton) clearButton.addEventListener("click", clearActiveRiskLayer);

      setTimeout(() => map.invalidateSize(true), 400);
    }

    const accidentMapElement = document.getElementById("accidentMap");
    if (accidentMapElement && window.L) {
      accidentMap = L.map("accidentMap", { preferCanvas: true, zoomControl: true }).setView(ocanaCoords, 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors"
      }).addTo(accidentMap);

      const accidentPoints = [
        { coords: [8.236372, -73.353228], label: "Centro de Ocaña" },
        { coords: [8.2489, -73.3574], label: "Corredor vial norte" },
        { coords: [8.2261, -73.3447], label: "Corredor vial sur" }
      ];

      accidentPoints.forEach((point) => {
        L.circleMarker(point.coords, {
          radius: 7,
          color: "#b45309",
          weight: 2,
          fillColor: "#f59e0b",
          fillOpacity: 0.85
        }).addTo(accidentMap).bindPopup(`<strong>${point.label}</strong>`);
      });

      setTimeout(() => accidentMap.invalidateSize(true), 450);
    }
  } catch (error) {
    console.error("Error inicializando el mapa:", error);
  }

  updateLegend(null);
  updateRiskInfo("<p>Selecciona una capa para ver su contenido.</p>");
  syncChatbotContext({ activeModule: "Inicio" });
  closeSidebar();
});
