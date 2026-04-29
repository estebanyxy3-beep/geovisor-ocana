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
  const riskLayerTree = document.getElementById("riskLayerTree");
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
    } else if (
      q.includes("pot") ||
      q.includes("ordenamiento territorial")
    ) {
      targetView = "pot";
    } else if (
      q.includes("pomca") ||
      q.includes("cuenca")
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
      if (searchStatus) {
        searchStatus.textContent = "No encontré ese término.";
      }
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
      if (e.key === "Enter") {
        runHomeSearch();
      }
    });
  }

  /* =========================
     CATALOGO DE SUBCAPAS
  ========================= */

  const LAYER_CATALOG = [
    {
      phenomenon: "Avenida torrencial",
      sections: [
        {
          title: "Amenaza",
          items: [
            {
              id: "amenaza_at_zonificacion",
              title: "Zonificación de amenaza",
              description: "Clasificación espacial de la amenaza por avenida torrencial.",
              kind: "amenaza",
              subtype: "zonificacion",
              phenomenon: "Avenida torrencial",
              url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/amenaza/Zonificacion_Amenaza_Avenida.json"
            }
          ]
        },
        {
          title: "Exposición",
          items: [
            {
              id: "exp_at_construccion",
              title: "Construcción expuesta",
              description: "Construcciones expuestas por avenida torrencial.",
              kind: "exposicion",
              subtype: "construccion",
              phenomenon: "Avenida torrencial",
              url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/exposicion/Construccion_Expuesta_avenid1.json"
            },
            {
              id: "exp_at_predio",
              title: "Predio expuesto",
              description: "Predios expuestos por avenida torrencial.",
              kind: "exposicion",
              subtype: "predio",
              phenomenon: "Avenida torrencial",
              url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/exposicion/Predio_Expuesto_avenida_torr.json"
            },
            {
              id: "exp_at_via",
              title: "Vía expuesta",
              description: "Vías expuestas por avenida torrencial.",
              kind: "exposicion",
              subtype: "via",
              phenomenon: "Avenida torrencial",
              url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/exposicion/Via_Expuesta_avenida_torrenc.json"
            }
          ]
        },
        {
          title: "Riesgo",
          items: [
            {
              id: "riesgo_at_construccion",
              title: "Construcción en riesgo",
              description: "Construcciones en riesgo por avenida torrencial.",
              kind: "riesgo",
              subtype: "construccion",
              phenomenon: "Avenida torrencial",
              url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/riesgo/Construccion_Riesgo_avenida_json"
            },
            {
              id: "riesgo_at_predio",
              title: "Predio en riesgo",
              description: "Predios en riesgo por avenida torrencial.",
              kind: "riesgo",
              subtype: "predio",
              phenomenon: "Avenida torrencial",
              url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/riesgo/Predio_Riesgo_avenida_torren.json"
            },
            {
              id: "riesgo_at_via",
              title: "Vía en riesgo",
              description: "Vías en riesgo por avenida torrencial.",
              kind: "riesgo",
              subtype: "via",
              phenomenon: "Avenida torrencial",
              url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/riesgo/Via_Riesgo_avenida_torrencia.json"
            }
          ]
        }
      ]
    },

    {
      phenomenon: "Inundación",
      sections: [
        {
          title: "Amenaza",
          items: [
            {
              id: "amenaza_inundacion_urbana",
              title: "Zonificación de amenaza urbana",
              description: "Zonificación de amenaza por inundación urbana.",
              kind: "amenaza",
              subtype: "zonificacion",
              phenomenon: "Inundación",
              url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/amenaza/Zonificacion_Amenaza_InundacUrban.json"
            },
            {
              id: "amenaza_inundacion_ermita",
              title: "Zonificación de amenaza sector Ermita",
              description: "Zonificación de amenaza por inundación en el sector Ermita.",
              kind: "amenaza",
              subtype: "zonificacion",
              phenomenon: "Inundación",
              url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/amenaza/Zonificacion_Amenaza_Inundac_Ermi.json"
            }
          ]
        },
        {
          title: "Exposición",
          items: [
            {
              id: "exp_inundacion_construccion",
              title: "Construcción expuesta",
              description: "Construcciones expuestas por inundación.",
              kind: "exposicion",
              subtype: "construccion",
              phenomenon: "Inundación",
              url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/exposicion/Construccion_Expuesta_inunda1.json"
            }
          ]
        },
        {
          title: "Riesgo",
          items: [
            {
              id: "riesgo_inundacion_construccion",
              title: "Construcción en riesgo",
              description: "Construcciones en riesgo por inundación.",
              kind: "riesgo",
              subtype: "construccion",
              phenomenon: "Inundación",
              url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/riesgo/Construccion_Riesgo_inundaci.json"
            },
            {
              id: "riesgo_inundacion_predio",
              title: "Predio en riesgo",
              description: "Predios en riesgo por inundación.",
              kind: "riesgo",
              subtype: "predio",
              phenomenon: "Inundación",
              url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/riesgo/Predio_Riesgo_inundacion_Pro.json"
            },
            {
              id: "riesgo_inundacion_via",
              title: "Vía en riesgo",
              description: "Vías en riesgo por inundación.",
              kind: "riesgo",
              subtype: "via",
              phenomenon: "Inundación",
              url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/riesgo/Via_Riesgo_inundacion_Projec.json"
            }
          ]
        }
      ]
    },

    {
      phenomenon: "Movimiento en masa",
      sections: [
        {
          title: "Amenaza",
          items: [
            {
              id: "amenaza_mm_general",
              title: "Zonificación general",
              description: "Zonificación general de amenaza por movimiento en masa.",
              kind: "amenaza",
              subtype: "zonificacion",
              phenomenon: "Movimiento en masa",
              url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/amenaza/Zonificacion_Amenaza_Movimie_Mas.json"
            },
            {
              id: "amenaza_mm_pueblo",
              title: "Sector MM Pueb",
              description: "Zonificación de amenaza para sector MM Pueb.",
              kind: "amenaza",
              subtype: "zonificacion",
              phenomenon: "Movimiento en masa",
              url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/amenaza/Zonificacion_Amenaza_MM_Pueb.json"
            },
            {
              id: "amenaza_mm_otar",
              title: "Sector MM Otar",
              description: "Zonificación de amenaza para sector MM Otar.",
              kind: "amenaza",
              subtype: "zonificacion",
              phenomenon: "Movimiento en masa",
              url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/amenaza/Zonificacion_Amenaza_MM_Otar.json"
            },
            {
              id: "amenaza_mm_erm",
              title: "Sector MM La Erm",
              description: "Zonificación de amenaza para sector MM La Erm.",
              kind: "amenaza",
              subtype: "zonificacion",
              phenomenon: "Movimiento en masa",
              url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/amenaza/Zonificacion_Amenaza_MM_La_Erm.json"
            },
            {
              id: "amenaza_mm_buen",
              title: "Sector MM Buen",
              description: "Zonificación de amenaza para sector MM Buen.",
              kind: "amenaza",
              subtype: "zonificacion",
              phenomenon: "Movimiento en masa",
              url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/amenaza/Zonificacion_Amenaza_MM_Buen1.json"
            },
            {
              id: "amenaza_mm_agua",
              title: "Sector MM Agua",
              description: "Zonificación de amenaza para sector MM Agua.",
              kind: "amenaza",
              subtype: "zonificacion",
              phenomenon: "Movimiento en masa",
              url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/amenaza/Zonificacion_Amenaza_MM_Agua1.json"
            }
          ]
        },
        {
          title: "Exposición",
          items: [
            {
              id: "exp_mm_construccion",
              title: "Construcción expuesta",
              description: "Construcciones expuestas por movimiento en masa.",
              kind: "exposicion",
              subtype: "construccion",
              phenomenon: "Movimiento en masa",
              url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/exposicion/Construccion_Expuesta_Movimi1.json"
            },
            {
              id: "exp_mm_predio",
              title: "Predio expuesto",
              description: "Predios expuestos por movimiento en masa.",
              kind: "exposicion",
              subtype: "predio",
              phenomenon: "Movimiento en masa",
              url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/exposicion/Predio_Expuesto_Movimiento_e.json"
            },
            {
              id: "exp_mm_via",
              title: "Vía expuesta",
              description: "Vías expuestas por movimiento en masa.",
              kind: "exposicion",
              subtype: "via",
              phenomenon: "Movimiento en masa",
              url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/exposicion/Via_Expuesta_Movimiento_en_M.json"
            }
          ]
        },
        {
          title: "Riesgo",
          items: [
            {
              id: "riesgo_mm_construccion",
              title: "Construcción en riesgo",
              description: "Construcciones en riesgo por movimiento en masa.",
              kind: "riesgo",
              subtype: "construccion",
              phenomenon: "Movimiento en masa",
              url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/riesgo/Construccion_Riesgo_Movimien.json"
            },
            {
              id: "riesgo_mm_predio",
              title: "Predio en riesgo",
              description: "Predios en riesgo por movimiento en masa.",
              kind: "riesgo",
              subtype: "predio",
              phenomenon: "Movimiento en masa",
              url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/riesgo/Predio_Riesgo_Movimiento_en_.json"
            },
            {
              id: "riesgo_mm_via",
              title: "Vía en riesgo",
              description: "Vías en riesgo por movimiento en masa.",
              kind: "riesgo",
              subtype: "via",
              phenomenon: "Movimiento en masa",
              url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/riesgo/Via_Riesgo_Movimiento_en_Mas.json"
            }
          ]
        }
      ]
    }
  ];

  const FLAT_LAYERS = LAYER_CATALOG.flatMap(group =>
    group.sections.flatMap(section => section.items)
  );

  function renderRiskLayerTree() {
    if (!riskLayerTree) return;

    riskLayerTree.innerHTML = LAYER_CATALOG.map((group, groupIndex) => {
      return `
        <details class="risk-group" ${groupIndex === 0 ? "open" : ""}>
          <summary>${group.phenomenon}</summary>
          <div class="risk-group-content">
            ${group.sections.map((section) => `
              <div class="layer-section">
                <h4 class="layer-section-title">${section.title}</h4>
                ${section.items.map((item) => `
                  <label class="layer-option">
                    <input type="radio" name="riskLayer" value="${item.id}" />
                    <span class="layer-option-text">
                      <strong>${item.title}</strong>
                      <small>${item.description}</small>
                    </span>
                  </label>
                `).join("")}
              </div>
            `).join("")}
          </div>
        </details>
      `;
    }).join("");
  }

  renderRiskLayerTree();

  /* =========================
     MAPA
  ========================= */

  let map = null;
  let osm = null;
  let satellite = null;
  let currentRiskLayer = null;

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

  function findLayerItemById(id) {
    return FLAT_LAYERS.find((item) => item.id === id);
  }

  function detectSeverity(props = {}) {
    const fields = [
      "nivel", "NIVEL",
      "amenaza", "AMENAZA",
      "riesgo", "RIESGO",
      "categoria", "CATEGORIA",
      "clase", "CLASE",
      "clasifica", "CLASIFICA",
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

        if (
          text.includes("alta") ||
          text.includes("alto") ||
          text === "3"
        ) return "alto";

        if (
          text.includes("media") ||
          text.includes("medio") ||
          text === "2"
        ) return "medio";

        if (
          text.includes("baja") ||
          text.includes("bajo") ||
          text === "1"
        ) return "bajo";
      }
    }

    return "";
  }

  function getExposureColor(subtype) {
    if (subtype === "construccion") {
      return {
        fillColor: "#f59e0b",
        color: "#b45309"
      };
    }

    if (subtype === "predio") {
      return {
        fillColor: "#8b5cf6",
        color: "#6d28d9"
      };
    }

    if (subtype === "via") {
      return {
        fillColor: "#3b82f6",
        color: "#1d4ed8"
      };
    }

    return {
      fillColor: "#64748b",
      color: "#475569"
    };
  }

  function getFeatureStyle(props = {}, item) {
    const severity = detectSeverity(props);

    if (item.kind === "amenaza") {
      if (severity === "alto") {
        return {
          color: "#991b1b",
          weight: 1.5,
          fillColor: "#d73027",
          fillOpacity: 0.55
        };
      }
      if (severity === "medio") {
        return {
          color: "#a16207",
          weight: 1.5,
          fillColor: "#facc15",
          fillOpacity: 0.55
        };
      }
      if (severity === "bajo") {
        return {
          color: "#166534",
          weight: 1.5,
          fillColor: "#22c55e",
          fillOpacity: 0.55
        };
      }

      return {
        color: "#a16207",
        weight: 1.5,
        fillColor: "#facc15",
        fillOpacity: 0.5
      };
    }

    if (item.kind === "riesgo") {
      if (severity === "alto") {
        return {
          color: "#7f1d1d",
          weight: 1.5,
          fillColor: "#dc2626",
          fillOpacity: 0.6
        };
      }
      if (severity === "medio") {
        return {
          color: "#9a3412",
          weight: 1.5,
          fillColor: "#f97316",
          fillOpacity: 0.6
        };
      }
      if (severity === "bajo") {
        return {
          color: "#166534",
          weight: 1.5,
          fillColor: "#22c55e",
          fillOpacity: 0.6
        };
      }

      return {
        color: "#9a3412",
        weight: 1.5,
        fillColor: "#f97316",
        fillOpacity: 0.55
      };
    }

    if (item.kind === "exposicion") {
      const base = getExposureColor(item.subtype);
      return {
        color: base.color,
        weight: 1.5,
        fillColor: base.fillColor,
        fillOpacity: 0.58
      };
    }

    return {
      color: "#475569",
      weight: 1.5,
      fillColor: "#94a3b8",
      fillOpacity: 0.5
    };
  }

  function buildLegendHTML(item) {
    if (!item) {
      return `<p>Selecciona una subcapa para ver su leyenda.</p>`;
    }

    if (item.kind === "amenaza") {
      return `
        <div class="legend-block">
          <h4 class="legend-title">${item.title}</h4>
          <p class="legend-subtitle">${item.phenomenon}</p>

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
        </div>
      `;
    }

    if (item.kind === "riesgo") {
      return `
        <div class="legend-block">
          <h4 class="legend-title">${item.title}</h4>
          <p class="legend-subtitle">${item.phenomenon}</p>

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
        </div>
      `;
    }

    if (item.kind === "exposicion") {
      const exposure = getExposureColor(item.subtype);

      let label = "Elemento expuesto";
      if (item.subtype === "construccion") label = "Construcción expuesta";
      if (item.subtype === "predio") label = "Predio expuesto";
      if (item.subtype === "via") label = "Vía expuesta";

      return `
        <div class="legend-block">
          <h4 class="legend-title">${item.title}</h4>
          <p class="legend-subtitle">${item.phenomenon}</p>

          <div class="legend-item">
            <span class="swatch" style="background:${exposure.fillColor};"></span>
            <span>${label}</span>
          </div>
        </div>
      `;
    }

    return `<p>Selecciona una subcapa para ver su leyenda.</p>`;
  }

  function buildInfoHTML(item) {
    if (!item) {
      return `<p>Selecciona una subcapa para ver su descripción y colores.</p>`;
    }

    if (item.kind === "amenaza") {
      return `
        <h4 class="info-title">${item.title}</h4>
        <p class="info-text">
          Esta subcapa representa la <strong>zonificación de amenaza</strong> para el fenómeno
          <strong>${item.phenomenon}</strong>.
        </p>
        <ul class="info-list">
          <li><strong>Rojo:</strong> amenaza alta.</li>
          <li><strong>Amarillo:</strong> amenaza media.</li>
          <li><strong>Verde:</strong> amenaza baja.</li>
        </ul>
      `;
    }

    if (item.kind === "riesgo") {
      return `
        <h4 class="info-title">${item.title}</h4>
        <p class="info-text">
          Esta subcapa representa elementos en <strong>condición de riesgo</strong> para
          <strong>${item.phenomenon}</strong>.
        </p>
        <ul class="info-list">
          <li><strong>Rojo:</strong> riesgo alto.</li>
          <li><strong>Naranja:</strong> riesgo medio.</li>
          <li><strong>Verde:</strong> riesgo bajo.</li>
        </ul>
      `;
    }

    if (item.kind === "exposicion") {
      let elementLabel = "elementos expuestos";
      if (item.subtype === "construccion") elementLabel = "construcciones expuestas";
      if (item.subtype === "predio") elementLabel = "predios expuestos";
      if (item.subtype === "via") elementLabel = "vías expuestas";

      return `
        <h4 class="info-title">${item.title}</h4>
        <p class="info-text">
          Esta subcapa identifica <strong>${elementLabel}</strong> frente al fenómeno
          <strong>${item.phenomenon}</strong>.
        </p>
        <ul class="info-list">
          <li>El color representa el tipo de elemento expuesto seleccionado.</li>
          <li>Construcción, predio y vía se diferencian por subcapa.</li>
        </ul>
      `;
    }

    return `<p>Selecciona una subcapa para ver su descripción.</p>`;
  }

  function updateLegend(item = null) {
    if (!legendContent) return;
    legendContent.innerHTML = buildLegendHTML(item);
  }

  function updateRiskInfo(item = null) {
    if (!riskInfoContent) return;
    riskInfoContent.innerHTML = buildInfoHTML(item);
  }

  function buildPopupHtml(feature, item) {
    const props = feature.properties || {};
    let html = `<strong>${item.title}</strong><br><small>${item.phenomenon}</small>`;

    Object.entries(props).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        html += `<br><strong>${key}:</strong> ${value}`;
      }
    });

    return html;
  }

  async function loadRiskLayer(layerId) {
    const item = findLayerItemById(layerId);
    if (!item || !map) return;

    if (currentRiskLayer && map.hasLayer(currentRiskLayer)) {
      map.removeLayer(currentRiskLayer);
      currentRiskLayer = null;
    }

    updateLegend(item);
    updateRiskInfo(item);

    syncChatbotContext({
      activeModule: "Mapas de Riesgo",
      activeLayer: item.title,
      selectedFeature: null
    });

    try {
      const response = await fetch(item.url);
      if (!response.ok) {
        throw new Error("No se pudo cargar el archivo GeoJSON.");
      }

      const geojson = await response.json();

      currentRiskLayer = L.geoJSON(geojson, {
        style: function (feature) {
          return getFeatureStyle(feature.properties || {}, item);
        },
        pointToLayer: function (feature, latlng) {
          const style = getFeatureStyle(feature.properties || {}, item);
          return L.circleMarker(latlng, {
            radius: 6,
            color: style.color,
            weight: 1,
            fillColor: style.fillColor,
            fillOpacity: style.fillOpacity
          });
        },
        onEachFeature: function (feature, layer) {
          layer.bindPopup(buildPopupHtml(feature, item));

          layer.on("click", function () {
            syncChatbotContext({
              activeModule: "Mapas de Riesgo",
              activeLayer: item.title,
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
      if (riskInfoContent) {
        riskInfoContent.innerHTML = `
          <h4 class="info-title">${item.title}</h4>
          <p class="info-text">No se pudo cargar la subcapa. Revisa el nombre del archivo o la ruta.</p>
        `;
      }
    }
  }

  function clearActiveRiskLayer() {
    document.querySelectorAll('input[name="riskLayer"]').forEach((radio) => {
      radio.checked = false;
    });

    if (currentRiskLayer && map && map.hasLayer(currentRiskLayer)) {
      map.removeLayer(currentRiskLayer);
      currentRiskLayer = null;
    }

    updateLegend(null);
    updateRiskInfo(null);

    if (map) {
      map.setView(ocanaCoords, 15);
    }

    syncChatbotContext({
      activeModule: "Mapas de Riesgo",
      activeLayer: null,
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

      document.querySelectorAll('input[name="riskLayer"]').forEach((radio) => {
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
  updateRiskInfo(null);

  syncChatbotContext({
    activeModule: "Inicio"
  });
});
