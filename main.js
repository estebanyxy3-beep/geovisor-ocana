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

  function showView(viewName) {
    views.forEach((view) => view.classList.remove("active"));

    const targetView = document.getElementById(`view-${viewName}`);
    if (targetView) {
      targetView.classList.add("active");
    }

    setActiveNav(viewName);

    if (window.innerWidth <= 900 && sidebar) {
      sidebar.classList.remove("open");
    }

    const moduleNames = {
      inicio: "Inicio",
      riesgo: "Mapas de Riesgo",
      pot: "POT",
      pomca: "POMCA",
      participacion: "Participación",
      accidentabilidad: "Accidentabilidad"
    };

    syncChatbotContext({
      activeModule: moduleNames[viewName] || "Inicio"
    });

    window.scrollTo({ top: 0, behavior: "smooth" });

    if (viewName === "riesgo" && window.__geovisorMap) {
      setTimeout(() => {
        window.__geovisorMap.invalidateSize(true);
      }, 300);
    }
  }

  function runHomeSearch() {
    if (!searchInput) return;

    const raw = searchInput.value.trim().toLowerCase();
    if (!raw) {
      if (searchStatus) searchStatus.textContent = "Escribe un término para buscar.";
      return;
    }

    const q = raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

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
      q.includes("movimiento en masa")
    ) {
      targetView = "riesgo";
    } else if (
      q.includes("participacion") ||
      q.includes("ciudadana") ||
      q.includes("comunidad")
    ) {
      targetView = "participacion";
    } else if (
      q.includes("pot") ||
      q.includes("ordenamiento territorial")
    ) {
      targetView = "pot";
    } else if (
      q.includes("pomca") ||
      q.includes("cuenca") ||
      q.includes("ambiental")
    ) {
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
        searchStatus.textContent = `Resultado encontrado: ${targetView}.`;
      }
    } else {
      if (searchStatus) {
        searchStatus.textContent = "No encontré ese término.";
      }
    }
  }

  navButtons.forEach((button) => {
    button.addEventListener("click", function (e) {
      e.preventDefault();
      const viewName = this.dataset.view;
      if (viewName) showView(viewName);
    });

    button.addEventListener("touchend", function (e) {
      e.preventDefault();
      const viewName = this.dataset.view;
      if (viewName) showView(viewName);
    }, { passive: false });
  });

  viewButtons.forEach((button) => {
    button.addEventListener("click", function (e) {
      e.preventDefault();
      const viewName = this.dataset.viewTarget;
      if (viewName) showView(viewName);
    });

    button.addEventListener("touchend", function (e) {
      e.preventDefault();
      const viewName = this.dataset.viewTarget;
      if (viewName) showView(viewName);
    }, { passive: false });
  });

  if (navToggle && sidebar) {
    navToggle.addEventListener("click", function () {
      sidebar.classList.toggle("open");
    });

    navToggle.addEventListener("touchend", function (e) {
      e.preventDefault();
      sidebar.classList.toggle("open");
    }, { passive: false });
  }

  if (searchBtn) {
    searchBtn.addEventListener("click", runHomeSearch);
    searchBtn.addEventListener("touchend", function (e) {
      e.preventDefault();
      runHomeSearch();
    }, { passive: false });
  }

  if (searchInput) {
    searchInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        runHomeSearch();
      }
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
      info: `
        <p><strong>Amenaza:</strong> posibilidad de ocurrencia de un fenómeno físico potencialmente dañino.</p>
        <p>Esta capa representa zonas asociadas a amenaza por avenida torrencial.</p>
      `,
      legend: `
        <div class="legend-item"><span class="swatch" style="background:#ff0000;"></span><span>Amenaza alta</span></div>
        <div class="legend-item"><span class="swatch" style="background:#ffff00;"></span><span>Amenaza media</span></div>
        <div class="legend-item"><span class="swatch" style="background:#00aa00;"></span><span>Amenaza baja</span></div>
      `
    },
    exposicion_at: {
      label: "Exposición por avenida torrencial",
      url: "",
      info: `<p>Elementos expuestos frente a avenida torrencial.</p>`,
      legend: `<div class="legend-item"><span class="swatch" style="background:#f59e0b;"></span><span>Elemento expuesto</span></div>`
    },
    riesgo_at: {
      label: "Riesgo por avenida torrencial",
      url: "",
      info: `<p>Riesgo por avenida torrencial.</p>`,
      legend: `
        <div class="legend-item"><span class="swatch" style="background:#dc2626;"></span><span>Riesgo alto</span></div>
        <div class="legend-item"><span class="swatch" style="background:#f59e0b;"></span><span>Riesgo medio</span></div>
        <div class="legend-item"><span class="swatch" style="background:#22c55e;"></span><span>Riesgo bajo</span></div>
      `
    },
    amenaza_inundacion: {
      label: "Amenaza por inundación",
      url: "",
      info: `<p>Esta sección permitirá visualizar la amenaza por inundación.</p>`,
      legend: `<div class="legend-item"><span class="swatch" style="background:#3b82f6;"></span><span>Zona de amenaza</span></div>`
    },
    exposicion_inundacion: {
      label: "Exposición por inundación",
      url: "",
      info: `<p>Elementos expuestos a inundación.</p>`,
      legend: `<div class="legend-item"><span class="swatch" style="background:#60a5fa;"></span><span>Elemento expuesto</span></div>`
    },
    riesgo_inundacion: {
      label: "Riesgo por inundación",
      url: "",
      info: `<p>Análisis de riesgo por inundación.</p>`,
      legend: `<div class="legend-item"><span class="swatch" style="background:#1d4ed8;"></span><span>Riesgo por inundación</span></div>`
    },
    amenaza_mm: {
      label: "Amenaza por movimiento en masa",
      url: "",
      info: `<p>Amenaza por movimiento en masa.</p>`,
      legend: `<div class="legend-item"><span class="swatch" style="background:#8b5cf6;"></span><span>Zona de amenaza</span></div>`
    },
    exposicion_mm: {
      label: "Exposición por movimiento en masa",
      url: "",
      info: `<p>Elementos expuestos por movimiento en masa.</p>`,
      legend: `<div class="legend-item"><span class="swatch" style="background:#a78bfa;"></span><span>Elemento expuesto</span></div>`
    },
    riesgo_mm: {
      label: "Riesgo por movimiento en masa",
      url: "",
      info: `<p>Áreas o elementos en riesgo por movimiento en masa.</p>`,
      legend: `<div class="legend-item"><span class="swatch" style="background:#7c3aed;"></span><span>Riesgo por movimiento en masa</span></div>`
    }
  };

  function updateLegend(html = null) {
    const legendContent = document.getElementById("legendContent");
    if (!legendContent) return;

    if (html) {
      legendContent.innerHTML = html;
      return;
    }

    legendContent.innerHTML = `
      <div class="legend-item">
        <span class="swatch" style="background:#2f8f5b;"></span>
        <span>Selecciona una capa de riesgo</span>
      </div>
    `;
  }

  function updateRiskInfo(html = "") {
    const riskInfoContent = document.getElementById("riskInfoContent");
    if (!riskInfoContent) return;
    riskInfoContent.innerHTML = html || "<p>Selecciona una capa para ver su contenido.</p>";
  }

  function getFeatureStyle(props = {}) {
    const nivel = (
      props.nivel ||
      props.NIVEL ||
      props.amenaza ||
      props.AMENAZA ||
      props.clase ||
      props.CLASIFICA ||
      props.tipo ||
      props.TIPO ||
      ""
    ).toString().trim().toLowerCase();

    let fillColor = "#d9d9d9";
    let borderColor = "#666666";

    if (nivel.includes("alta")) {
      fillColor = "#ff0000";
      borderColor = "#990000";
    } else if (nivel.includes("media")) {
      fillColor = "#ffff00";
      borderColor = "#999900";
    } else if (nivel.includes("baja")) {
      fillColor = "#00aa00";
      borderColor = "#006400";
    }

    return {
      color: borderColor,
      weight: 2,
      fillColor: fillColor,
      fillOpacity: 0.45
    };
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

    updateLegend(config.legend);
    updateRiskInfo(`<h4>${config.label}</h4>${config.info}`);

    if (!config.url) return;

    try {
      const response = await fetch(config.url);
      if (!response.ok) throw new Error("No se pudo cargar el archivo GeoJSON");

      const data = await response.json();

      currentRiskLayer = L.geoJSON(data, {
        style: function (feature) {
          return getFeatureStyle(feature.properties || {});
        },
        onEachFeature: function (feature, layer) {
          const props = feature.properties || {};
          const title = props.titulo || props.nombre || props.NOMBRE || config.label;

          let popupHTML = `<strong>${title}</strong>`;
          Object.keys(props).forEach((key) => {
            const value = props[key];
            if (value !== null && value !== undefined && value !== "") {
              popupHTML += `<br><strong>${key}:</strong> ${value}`;
            }
          });

          layer.bindPopup(popupHTML);

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
        map.fitBounds(currentRiskLayer.getBounds());
      }
    } catch (error) {
      console.error("Error cargando capa:", error);
      updateRiskInfo(`<h4>${config.label}</h4>${config.info}<p><strong>Error:</strong> no se pudo cargar el archivo GeoJSON.</p>`);
    }
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

      L.marker(ocanaCoords)
        .addTo(map)
        .bindPopup("<b>VAOI</b><br>Visión Ambiental, Ocaña Interactiva.");

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

      const clearRiskLayerBtn = document.getElementById("clearRiskLayer");
      if (clearRiskLayerBtn) {
        clearRiskLayerBtn.addEventListener("click", function () {
          document.querySelectorAll('input[name="riesgoLayer"]').forEach((radio) => {
            radio.checked = false;
          });

          if (currentRiskLayer && map.hasLayer(currentRiskLayer)) {
            map.removeLayer(currentRiskLayer);
            currentRiskLayer = null;
          }

          syncChatbotContext({
            activeLayer: null,
            activeModule: "Mapas de Riesgo",
            selectedFeature: null
          });

          updateLegend();
          updateRiskInfo("<p>Selecciona una capa para ver su significado, interpretación y referencia normativa.</p>");
          map.setView(ocanaCoords, 15);
        });
      }

      setTimeout(() => {
        map.invalidateSize(true);
      }, 500);
    }
  } catch (error) {
    console.error("Error inicializando mapa:", error);
  }

  syncChatbotContext({
    activeModule: "Inicio"
  });
});
