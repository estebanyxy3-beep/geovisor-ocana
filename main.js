document.addEventListener("DOMContentLoaded", function () {
  const ocanaCoords = [8.236372, -73.353228];

  const sidebar = document.getElementById("sidebar");
  const navToggle = document.getElementById("navToggle");
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

  function updateSidebarMode(viewName) {
    if (viewName === "inicio") {
      document.body.classList.remove("sidebar-compact");
      document.body.classList.add("sidebar-home");
    } else {
      document.body.classList.remove("sidebar-home");
      document.body.classList.add("sidebar-compact");
    }
  }

  function setActiveNav(viewName) {
    navButtons.forEach((btn) => btn.classList.remove("active"));
    const activeButton = document.querySelector(`.nav-item[data-view="${viewName}"]`);
    if (activeButton) activeButton.classList.add("active");
  }

  function showView(viewName) {
    views.forEach((view) => view.classList.remove("active"));

    const targetView = document.getElementById(`view-${viewName}`);
    if (targetView) targetView.classList.add("active");

    setActiveNav(viewName);
    updateSidebarMode(viewName);

    if (window.innerWidth <= 900 && sidebar) {
      sidebar.classList.remove("open");
    }

    const moduleNames = {
      inicio: "Inicio",
      riesgo: "Mapas de Riesgo",
      participacion: "Participación",
      pot: "POT",
      pomca: "POMCA",
      accidentabilidad: "Accidentabilidad"
    };

    syncChatbotContext({
      activeModule: moduleNames[viewName] || "Inicio"
    });

    window.scrollTo({ top: 0, behavior: "smooth" });

    if (viewName === "riesgo" && window.__geovisorMap) {
      setTimeout(() => {
        window.__geovisorMap.invalidateSize(true);
      }, 250);
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
      q.includes("comunidad")
    ) {
      targetView = "participacion";
    } else if (q.includes("pot") || q.includes("ordenamiento territorial")) {
      targetView = "pot";
    } else if (q.includes("pomca") || q.includes("cuenca")) {
      targetView = "pomca";
    } else if (
      q.includes("accidentabilidad") ||
      q.includes("accidente") ||
      q.includes("transito") ||
      q.includes("movilidad") ||
      q.includes("vial")
    ) {
      targetView = "accidentabilidad";
    }

    if (targetView) {
      showView(targetView);
      if (searchStatus) {
        const names = {
          inicio: "Inicio",
          riesgo: "Mapas de Riesgo",
          participacion: "Mecanismo de Participación",
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
      sidebar.classList.toggle("open");
    });
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

  const riskLayersConfig = {
    amenaza_at: {
      label: "Amenaza por avenida torrencial",
      url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/Amenaza_Avenida_Torrencial_Urbano.json",
      kind: "amenaza",
      info: `
        <p><strong>Amenaza:</strong> zonificación territorial del fenómeno de avenida torrencial.</p>
        <p>Colores: rojo = alta, amarillo = media, verde = baja.</p>
      `
    },
    exposicion_at: {
      label: "Construcción expuesta por avenida torrencial",
      url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/exposicion/Construccion_Expuesta_avenid1.json",
      kind: "exposicion",
      subtype: "construccion",
      info: `
        <p><strong>Exposición:</strong> construcciones expuestas frente a avenida torrencial.</p>
      `
    },
    riesgo_at: {
      label: "Construcción en riesgo por avenida torrencial",
      url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/riesgo/Construccion_Riesgo_avenida_json",
      kind: "riesgo",
      subtype: "construccion",
      info: `
        <p><strong>Riesgo:</strong> construcciones en riesgo por avenida torrencial.</p>
        <p>Colores: rojo = alto, naranja = medio, verde = bajo.</p>
      `
    },

    amenaza_inundacion: {
      label: "Amenaza por inundación",
      url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/amenaza/Zonificacion_Amenaza_InundacUrban.json",
      kind: "amenaza",
      info: `
        <p><strong>Amenaza:</strong> zonificación de amenaza por inundación.</p>
        <p>Colores: rojo = alta, amarillo = media, verde = baja.</p>
      `
    },
    exposicion_inundacion: {
      label: "Construcción expuesta por inundación",
      url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/exposicion/Construccion_Expuesta_inunda1.json",
      kind: "exposicion",
      subtype: "construccion",
      info: `
        <p><strong>Exposición:</strong> construcciones expuestas por inundación.</p>
      `
    },
    riesgo_inundacion: {
      label: "Construcción en riesgo por inundación",
      url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/riesgo/Construccion_Riesgo_inundaci.json",
      kind: "riesgo",
      subtype: "construccion",
      info: `
        <p><strong>Riesgo:</strong> construcciones en riesgo por inundación.</p>
        <p>Colores: rojo = alto, naranja = medio, verde = bajo.</p>
      `
    },

    amenaza_mm: {
      label: "Amenaza por movimiento en masa",
      url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/amenaza/Zonificacion_Amenaza_Movimie_Mas.json",
      kind: "amenaza",
      info: `
        <p><strong>Amenaza:</strong> zonificación de amenaza por movimiento en masa.</p>
        <p>Colores: rojo = alta, amarillo = media, verde = baja.</p>
      `
    },
    exposicion_mm: {
      label: "Construcción expuesta por movimiento en masa",
      url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/exposicion/Construccion_Expuesta_Movimi1.json",
      kind: "exposicion",
      subtype: "construccion",
      info: `
        <p><strong>Exposición:</strong> construcciones expuestas por movimiento en masa.</p>
      `
    },
    riesgo_mm: {
      label: "Construcción en riesgo por movimiento en masa",
      url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/riesgo/Construccion_Riesgo_Movimien.json",
      kind: "riesgo",
      subtype: "construccion",
      info: `
        <p><strong>Riesgo:</strong> construcciones en riesgo por movimiento en masa.</p>
        <p>Colores: rojo = alto, naranja = medio, verde = bajo.</p>
      `
    }
  };

  function updateLegend(config = null) {
    if (!legendContent) return;

    if (!config) {
      legendContent.innerHTML = `
        <div class="legend-item">
          <span class="swatch" style="background:#2f8f5b;"></span>
          <span>Selecciona una capa</span>
        </div>
      `;
      return;
    }

    if (config.kind === "amenaza") {
      legendContent.innerHTML = `
        <div class="legend-item">
          <span class="swatch" style="background:#d73027;"></span>
          <span>Amenaza alta</span>
        </div>
        <div class="legend-item">
          <span class="swatch" style="background:#facc15;"></span>
          <span>Amenaza media</span>
        </div>
        <div class="legend-item">
          <span class="swatch" style="background:#22c55e;"></span>
          <span>Amenaza baja</span>
        </div>
      `;
      return;
    }

    if (config.kind === "riesgo") {
      legendContent.innerHTML = `
        <div class="legend-item">
          <span class="swatch" style="background:#dc2626;"></span>
          <span>Riesgo alto</span>
        </div>
        <div class="legend-item">
          <span class="swatch" style="background:#f97316;"></span>
          <span>Riesgo medio</span>
        </div>
        <div class="legend-item">
          <span class="swatch" style="background:#22c55e;"></span>
          <span>Riesgo bajo</span>
        </div>
      `;
      return;
    }

    if (config.kind === "exposicion") {
      legendContent.innerHTML = `
        <div class="legend-item">
          <span class="swatch" style="background:#f59e0b;"></span>
          <span>Construcción expuesta</span>
        </div>
      `;
      return;
    }
  }

  function updateRiskInfo(html = "") {
    if (!riskInfoContent) return;
    riskInfoContent.innerHTML = html || "<p>Selecciona una capa para ver su contenido.</p>";
  }

  function detectSeverity(props = {}) {
    const fields = [
      "nivel", "NIVEL",
      "amenaza", "AMENAZA",
      "riesgo", "RIESGO",
      "categoria", "CATEGORIA",
      "clase", "CLASE",
      "clasifica", "CLASIFICA",
      "tipo", "TIPO",
      "gridcode", "GRIDCODE",
      "id", "ID"
    ];

    for (const field of fields) {
      const value = props[field];
      if (value !== undefined && value !== null && value !== "") {
        if (typeof value === "number") {
          if (value === 3) return "alto";
          if (value === 2) return "medio";
          if (value === 1) return "bajo";
        }

        const text = normalizeText(value);

        if (text.includes("alta") || text.includes("alto") || text === "3") return "alto";
        if (text.includes("media") || text.includes("medio") || text === "2") return "medio";
        if (text.includes("baja") || text.includes("bajo") || text === "1") return "bajo";
      }
    }

    return "";
  }

  function getFeatureStyle(props = {}, config = {}) {
    const severity = detectSeverity(props);

    if (config.kind === "amenaza") {
      if (severity === "alto") {
        return { color: "#991b1b", weight: 2, fillColor: "#d73027", fillOpacity: 0.55 };
      }
      if (severity === "medio") {
        return { color: "#a16207", weight: 2, fillColor: "#facc15", fillOpacity: 0.55 };
      }
      if (severity === "bajo") {
        return { color: "#166534", weight: 2, fillColor: "#22c55e", fillOpacity: 0.55 };
      }
      return { color: "#a16207", weight: 2, fillColor: "#facc15", fillOpacity: 0.50 };
    }

    if (config.kind === "riesgo") {
      if (severity === "alto") {
        return { color: "#7f1d1d", weight: 2, fillColor: "#dc2626", fillOpacity: 0.60 };
      }
      if (severity === "medio") {
        return { color: "#9a3412", weight: 2, fillColor: "#f97316", fillOpacity: 0.60 };
      }
      if (severity === "bajo") {
        return { color: "#166534", weight: 2, fillColor: "#22c55e", fillOpacity: 0.60 };
      }
      return { color: "#9a3412", weight: 2, fillColor: "#f97316", fillOpacity: 0.55 };
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

    updateLegend(config);
    updateRiskInfo(`<h4>${config.label}</h4>${config.info}`);

    try {
      const response = await fetch(config.url);

      if (!response.ok) {
        throw new Error(`No se pudo cargar la capa: ${response.status}`);
      }

      const geojson = await response.json();

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

      if (currentRiskLayer.getBounds && currentRiskLayer.getBounds().isValid()) {
        map.fitBounds(currentRiskLayer.getBounds(), { padding: [20, 20] });
      }
    } catch (error) {
      console.error("Error cargando capa:", error);
      updateRiskInfo(`
        <h4>${config.label}</h4>
        <p>No se pudo cargar la capa.</p>
        <p><strong>Ruta usada:</strong><br>${config.url}</p>
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

    if (map) {
      map.setView(ocanaCoords, 15);
    }

    syncChatbotContext({
      activeLayer: null,
      activeModule: "Mapas de Riesgo",
      selectedFeature: null
    });
  }

  try {
    const mapElement = document.getElementById("map");

    if (mapElement && window.L) {
      map = L.map("map", {
        preferCanvas: true
      }).setView(ocanaCoords, 15);

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
        radio.addEventListener("change", (e) => {
          setBaseLayer(e.target.value);
        });
      });

      document.querySelectorAll('input[name="riesgoLayer"]').forEach((radio) => {
        radio.addEventListener("change", (e) => {
          loadRiskLayer(e.target.value);
        });
      });

      const clearButton = document.getElementById("clearRiskLayer");
      if (clearButton) {
        clearButton.addEventListener("click", clearActiveRiskLayer);
      }

      setTimeout(() => {
        map.invalidateSize(true);
      }, 400);
    }
  } catch (error) {
    console.error("Error inicializando el mapa:", error);
  }

  updateLegend(null);
  updateRiskInfo("<p>Selecciona una capa para ver su contenido.</p>");
  updateSidebarMode("inicio");

  syncChatbotContext({
    activeModule: "Inicio"
  });
});
