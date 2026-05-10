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
  let currentPotLayer = null;
  let currentPomcaLayer = null;
  let accidentMap = null;
  let potMap = null;
  let pomcaMap = null;

  const riskLayersConfig = {
    amenaza_at: {
      label: "Amenaza por avenida torrencial",
      url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/amenaza/Amenaza_Avenida_Torrencial_Urbano.json",
      kind: "amenaza",
      info: `<p><strong>¿Qué muestra esta capa?</strong></p><p>Identifica las zonas donde podría presentarse una avenida torrencial, es decir, una creciente rápida con agua, lodo, piedras o material arrastrado por lluvias intensas.</p><p><strong>¿Para qué sirve?</strong> Ayuda a reconocer sectores donde se deben tomar medidas de prevención, evitar ocupaciones inseguras y fortalecer la preparación comunitaria.</p>`
    },
    exposicion_at: {
      label: "Construcción expuesta por avenida torrencial",
      url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/exposicion/Construccion_Expuesta_avenid1.json",
      kind: "exposicion",
      info: `<p><strong>¿Qué muestra esta capa?</strong></p><p>Muestra construcciones ubicadas en zonas donde podrían verse afectadas por el fenómeno seleccionado.</p><p><strong>¿Cómo leerla?</strong> No significa que el daño sea seguro, sino que esas construcciones están expuestas y requieren mayor atención preventiva.</p>`
    },
    riesgo_at: {
      label: "Construcción en riesgo por avenida torrencial",
      url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/riesgo/Construccion_Riesgo_avenida_.json",
      kind: "riesgo",
      info: `<p><strong>¿Qué muestra esta capa?</strong></p><p>Relaciona la amenaza con los elementos expuestos para identificar construcciones con mayor posibilidad de afectación.</p><p><strong>¿Para qué sirve?</strong> Apoya decisiones sobre prevención, priorización de acciones y gestión responsable del territorio.</p>`
    },
    amenaza_inundacion: {
      label: "Amenaza por inundación",
      url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/amenaza/Zonificacion_Amenaza_InundacUrban.json",
      kind: "amenaza",
      info: `<p><strong>¿Qué muestra esta capa?</strong></p><p>Identifica las zonas donde podría presentarse una avenida torrencial, es decir, una creciente rápida con agua, lodo, piedras o material arrastrado por lluvias intensas.</p><p><strong>¿Para qué sirve?</strong> Ayuda a reconocer sectores donde se deben tomar medidas de prevención, evitar ocupaciones inseguras y fortalecer la preparación comunitaria.</p>`
    },
    exposicion_inundacion: {
      label: "Construcción expuesta por inundación",
      url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/exposicion/Construccion_Expuesta_inunda1.json",
      kind: "exposicion",
     info: `<h4>Construcción expuesta por inundación</h4><p><strong>¿Qué muestra?</strong> Construcciones ubicadas en zonas donde podría llegar el agua.</p><p><strong>¿Cómo leerla?</strong> Exposición alta, media o baja indica el nivel de compromiso frente al fenómeno.</p><p><strong>¿Para qué sirve?</strong> Permite priorizar revisión, prevención y preparación comunitaria.</p>` 
    },
    riesgo_inundacion: {
      label: "Construcción en riesgo por inundación",
      url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/riesgo/Construccion_Riesgo_inundaci.json",
      kind: "riesgo",
      info: `<h4>Construcción en riesgo por inundación</h4><p><strong>¿Qué muestra?</strong> Construcciones con posibilidad de afectación al combinar amenaza y exposición.</p><p><strong>¿Cómo leerla?</strong> Riesgo alto requiere mayor atención preventiva; riesgo medio y bajo también necesitan seguimiento.</p><p><strong>¿Para qué sirve?</strong> Orienta acciones de reducción del riesgo y planificación del territorio.</p>`
      info: `<p><strong>¿Qué muestra esta capa?</strong></p><p>Relaciona la amenaza con los elementos expuestos para identificar construcciones con mayor posibilidad de afectación.</p><p><strong>¿Para qué sirve?</strong> Apoya decisiones sobre prevención, priorización de acciones y gestión responsable del territorio.</p>`
    },
    amenaza_mm: {
      label: "Amenaza por movimiento en masa",
      url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/amenaza/Zonificacion_Amenaza_Movimie_Mas.json",
      kind: "amenaza",
      info: `<h4>Amenaza por movimiento en masa</h4><p><strong>¿Qué muestra?</strong> Zonas donde pueden presentarse deslizamientos, caída de material o inestabilidad de laderas.</p><p><strong>¿Cómo leerla?</strong> Alto, medio y bajo indican mayor o menor posibilidad de ocurrencia.</p><p><strong>¿Para qué sirve?</strong> Ayuda a reconocer laderas y sectores donde se deben tomar precauciones.</p>`
      
    },
    exposicion_mm: {
      label: "Construcción expuesta por movimiento en masa",
      url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/exposicion/Construccion_Expuesta_Movimi1.json",
      kind: "exposicion",
      info: `<h4>Construcción expuesta por movimiento en masa</h4><p><strong>¿Qué muestra?</strong> Construcciones ubicadas cerca de zonas inestables o con posibilidad de deslizamiento.</p><p><strong>¿Cómo leerla?</strong> Exposición alta, media o baja indica nivel de compromiso frente al fenómeno.</p><p><strong>¿Para qué sirve?</strong> Ayuda a identificar edificaciones que requieren observación o revisión.</p>`
          },
    riesgo_mm: {
      label: "Construcción en riesgo por movimiento en masa",
      url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/riesgo/Construccion_Riesgo_Movimien.json",
      kind: "riesgo",
      info: `<h4>Construcción en riesgo por movimiento en masa</h4><p><strong>¿Qué muestra?</strong> Construcciones donde la amenaza y la exposición se combinan.</p><p><strong>¿Cómo leerla?</strong> Riesgo alto debe priorizarse para prevención y seguimiento; riesgo medio y bajo también requieren gestión.</p><p><strong>¿Para qué sirve?</strong> Orienta acciones comunitarias e institucionales.</p>`
      },
    falla_geologica: {
      label: "Fallas geológicas de Ocaña",
      url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/fallas_geologicas/Fallasgeologicas.json",
      kind: "linea",
      info: `<h4>Fallas geológicas de Ocaña</h4><p><strong>¿Qué muestra?</strong> Trazado de fallas geológicas identificadas en Ocaña.</p><p><strong>¿Cómo leerla?</strong> Son líneas de referencia geológica, no una alerta inmediata por sí solas.</p><p><strong>¿Para qué sirve?</strong> Aporta contexto técnico para entender el territorio y orientar estudios.</p>`
        },
    amenaza_mm_la_ermita: {
      label: "Movimiento en masa - La Ermita",
      url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/amenaza/Zonificacion_Amenaza_MM_La_Erm.json",
      kind: "amenaza",
      info: `<h4>Movimiento en masa - La Ermita</h4><p><strong>¿Qué muestra?</strong> Zona específica del sector seleccionado con amenaza por movimiento en masa.</p><p><strong>¿Cómo leerla?</strong> Los colores indican niveles de amenaza.</p><p><strong>¿Para qué sirve?</strong> Permite a la comunidad del sector reconocer zonas de mayor cuidado.</p>`
       },
    amenaza_mm_aguas_claras: {
      label: "Movimiento en masa - Aguas Claras",
      url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/amenaza/Zonificacion_Amenaza_MM_Agua1.json",
      kind: "amenaza",
      info: `<h4>Movimiento en masa - Aguas Claras</h4><p><strong>¿Qué muestra?</strong> Zona específica del sector seleccionado con amenaza por movimiento en masa.</p><p><strong>¿Cómo leerla?</strong> Los colores indican niveles de amenaza.</p><p><strong>¿Para qué sirve?</strong> Permite a la comunidad del sector reconocer zonas de mayor cuidado.</p>`
       },
    amenaza_mm_pueblo_nuevo: {
      label: "Movimiento en masa - Pueblo Nuevo",
      url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/amenaza/Zonificacion_Amenaza_MM_Pueb.json",
      kind: "amenaza",
      info: `<p><strong>¿Qué muestra esta capa?</strong></p><p>Esta capa muestra las zonas del sector Pueblo Nuevo donde pueden presentarse movimientos en masa, como deslizamientos o caída de material en laderas.</p><p><strong>¿Para qué sirve?</strong> Ayuda a reconocer áreas donde se deben tomar precauciones, evitar construcciones inseguras y reportar señales de inestabilidad del terreno.</p>`
    },
    amenaza_mm_otare: {
      label: "Movimiento en masa - Otaré",
      url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/amenaza/Zonificacion_Amenaza_MM_Otar.json",
      kind: "amenaza",
      info: `<p><strong>¿Qué muestra esta capa?</strong></p><p>Esta capa muestra las zonas del sector Otaré donde pueden presentarse movimientos en masa, como deslizamientos o caída de material en laderas.</p><p><strong>¿Para qué sirve?</strong> Ayuda a reconocer áreas donde se deben tomar precauciones, evitar construcciones inseguras y reportar señales de inestabilidad del terreno.</p>`
    },
    amenaza_mm_buena_vista: {
      label: "Movimiento en masa - Buena Vista",
      url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/amenaza/Zonificacion_Amenaza_MM_Buen1.json",
      kind: "amenaza",
      info: `<p><strong>¿Qué muestra esta capa?</strong></p><p>Esta capa muestra las zonas del sector Buena Vista donde pueden presentarse movimientos en masa, como deslizamientos o caída de material en laderas.</p><p><strong>¿Para qué sirve?</strong> Ayuda a reconocer áreas donde se deben tomar precauciones, evitar construcciones inseguras y reportar señales de inestabilidad del terreno.</p>`
    }
  };

  const potLayersConfig = {
    pot_comunas: { label: "Comunas de Ocaña", url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/pot/usos_suelo/Comunas_.json", kind: "pot" },
    pot_usos: { label: "Usos del suelo", url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/pot/usos_suelo/Usos_Suelo.json", kind: "pot" }
  };
  const pomcaLayersConfig = {
    pomca_protegidas: { label: "Áreas protegidas", url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/pomca/Areas_Protegidas.json", kind: "pomca" },
    pomca_forestales: { label: "Áreas forestales protectoras", url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/pomca/%C3%81reas_Forestales_Protectoras.json", kind: "pomca" },
    pomca_ecosistemicas: { label: "Áreas de especial importancia ecosistémica", url: "https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/main/data/pomca/Areas_Especial_Importancia_E.json", kind: "pomca" }
  };

  function getClassificationField(features, preferredFields = []) {
    if (!features || !features.length) return null;
    const defaultFields = ["uso", "Uso", "USO", "uso_suelo", "Uso_Suelo", "USO_SUELO", "categoria", "Categoria", "CATEGORIA", "clase", "Clase", "CLASE", "comuna", "Comuna", "COMUNA", "nombre", "Nombre", "NOMBRE", "tipo", "Tipo", "TIPO", "amenaza", "Amenaza", "AMENAZA", "riesgo", "Riesgo", "RIESGO", "nivel", "Nivel", "NIVEL"];
    const fields = [...preferredFields, ...defaultFields];
    for (const field of fields) {
      if (features.some((feature) => feature?.properties?.[field] !== undefined && feature?.properties?.[field] !== null && String(feature.properties[field]).trim() !== "")) return field;
    }
    return null;
  }
  function getUniqueValues(features, field) {
    const values = new Set();
    features.forEach((feature) => {
      const value = feature?.properties?.[field];
      if (value !== undefined && value !== null && String(value).trim() !== "") values.add(String(value).trim());
    });
    return Array.from(values).sort();
  }
  function buildColorMap(values, palette) {
    const colorMap = {};
    values.forEach((value, index) => { colorMap[value] = palette[index % palette.length]; });
    return colorMap;
  }

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

  function getFeatureStyle(props = {}, config = {}, classificationField = null, colorMap = {}) {
    const classValue = classificationField ? String(props[classificationField] || "").trim() : "";
    const severity = detectSeverity(props);
    if (config.kind === "pot" || config.kind === "pomca") {
      const color = colorMap[classValue] || "#64748b";
      return { color: "#334155", weight: 1.5, fillColor: color, fillOpacity: 0.6 };
    }
    if (config.kind === "linea") return { color: "#4b5563", weight: 3 };

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
      if (severity === "alto") {
        return { color: "#92400e", weight: 2, fillColor: "#d97706", fillOpacity: 0.62 };
      }
      if (severity === "medio") {
        return { color: "#b45309", weight: 2, fillColor: "#f59e0b", fillOpacity: 0.58 };
      }
      if (severity === "bajo") {
        return { color: "#ca8a04", weight: 2, fillColor: "#fde68a", fillOpacity: 0.55 };
      }
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

    if (config.kind === "exposicion") {
      if (found.alto) items.push({ color: "#d97706", label: "Exposición alta" });
      if (found.medio) items.push({ color: "#f59e0b", label: "Exposición media" });
      if (found.bajo) items.push({ color: "#fde68a", label: "Exposición baja" });
    }

    if (!items.length) {
      const fallback = {
        amenaza: { color: "#d73027", label: "Amenaza" },
        riesgo: { color: "#dc2626", label: "Riesgo" },
        exposicion: { color: "#f59e0b", label: "Exposición" },
        linea: { color: "#4b5563", label: config.label || "Falla geológica" }
      };
      const item = fallback[config.kind] || {
        color: "#64748b",
        label: config.label || "Capa seleccionada"
      };
      items.push(item);
    }

    return items;
  }

  function updateLegend(config = null, features = [], legendNode = legendContent, classificationField = null, colorMap = {}) {
    if (!legendNode) return;

    if (!config) {
      legendNode.innerHTML = `
        <div class="legend-item">
          <span class="swatch" style="background:#2f8f5b;"></span>
          <span>Selecciona una capa</span>
        </div>`;
      return;
    }

    const items = (config.kind === "pot" || config.kind === "pomca")
      ? Object.entries(colorMap).map(([label, color]) => ({ label, color }))
      : getLegendItemsFromLayer(features, config);

    legendNode.innerHTML = items.map((item) => `
      <div class="legend-item">
        <span class="swatch" style="background:${item.color};"></span>
        <span>${item.label}</span>
      </div>`).join("");
  }

  function updateRiskInfo(html = "") {
    if (!riskInfoContent) return;
    riskInfoContent.innerHTML = html || "<p>Selecciona una capa para ver su contenido.</p>";
  }

  function buildPopupHtml(feature, config, classificationField = null) {
    const props = feature.properties || {};
    let html = `<strong>${config.label}</strong>`;
    if (classificationField && props[classificationField] !== undefined) html += `<br><strong>Clasificación:</strong> ${props[classificationField]}`;
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

      const classificationField = getClassificationField(features);
      const values = getUniqueValues(features, classificationField);
      const palette = config.kind === "amenaza" || config.kind === "riesgo" ? ["#dc2626", "#f59e0b", "#22c55e"] : ["#f59e0b", "#fbbf24", "#f97316"];
      const colorMap = buildColorMap(values, palette);
      updateLegend(config, features, legendContent, classificationField, colorMap);
      updateRiskInfo(`<h4>${config.label}</h4>${config.info}`);

      currentRiskLayer = L.geoJSON(geojson, {
        style: function (feature) {
          return getFeatureStyle(feature.properties || {}, config, classificationField, colorMap);
        },
        pointToLayer: function (feature, latlng) {
          const style = getFeatureStyle(feature.properties || {}, config, classificationField, colorMap);
          return L.circleMarker(latlng, {
            radius: 6,
            color: style.color,
            weight: 1,
            fillColor: style.fillColor,
            fillOpacity: style.fillOpacity
          });
        },
        onEachFeature: function (feature, layer) {
          layer.bindPopup(buildPopupHtml(feature, config, classificationField));
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

  async function loadGenericLayer(mapRef, key, configMap, layerRefName, legendNode, infoNode) {
    const config = configMap[key];
    if (!mapRef || !config) return;
    if (window[layerRefName] && mapRef.hasLayer(window[layerRefName])) mapRef.removeLayer(window[layerRefName]);
    const response = await fetch(config.url);
    const geojson = await response.json();
    const features = geojson.features || [];
    const field = getClassificationField(features, config.kind === "pot" ? ["comuna", "uso", "uso_suelo"] : ["categoria", "nombre", "tipo"]);
    const values = getUniqueValues(features, field);
    const palette = config.kind === "pot" ? ["#2563eb","#16a34a","#f59e0b","#9333ea","#ef4444","#0891b2","#84cc16"] : ["#166534","#15803d","#0f766e","#65a30d","#22c55e","#14b8a6","#84cc16"];
    const colorMap = buildColorMap(values, palette);
    updateLegend(config, features, legendNode, field, colorMap);
    if (infoNode) infoNode.innerHTML = `<h4>${config.label}</h4><p><strong>Campo clasificación:</strong> ${field || "No detectado"}</p>`;
    window[layerRefName] = L.geoJSON(geojson, {
      style: (feature) => getFeatureStyle(feature.properties || {}, config, field, colorMap),
      pointToLayer: (feature, latlng) => {
        const st = getFeatureStyle(feature.properties || {}, config, field, colorMap);
        return L.circleMarker(latlng, { radius: 6, color: st.color, fillColor: st.fillColor, fillOpacity: 0.8, weight: 1 });
      },
      onEachFeature: (feature, layer) => layer.bindPopup(buildPopupHtml(feature, config, field))
    }).addTo(mapRef);
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
      document.querySelectorAll("#view-riesgo .risk-group").forEach((group) => {
        group.addEventListener("toggle", function () {
          if (this.open) {
            document.querySelectorAll("#view-riesgo .risk-group").forEach((otherGroup) => {
              if (otherGroup !== this) {
                otherGroup.open = false;
              }
            });
          }
        });
      });

      const clearButton = document.getElementById("clearRiskLayer");
      if (clearButton) clearButton.addEventListener("click", clearActiveRiskLayer);

      setTimeout(() => map.invalidateSize(true), 400);
    }

    const potMapElement = document.getElementById("potMap");
    if (potMapElement && window.L) {
      potMap = L.map("potMap", { preferCanvas: true }).setView(ocanaCoords, 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "&copy; OpenStreetMap contributors" }).addTo(potMap);
      document.querySelectorAll('input[name="potLayer"]').forEach((radio) => {
        radio.addEventListener("change", (e) => loadGenericLayer(potMap, e.target.value, potLayersConfig, "currentPotLayer", document.getElementById("potLegendContent"), document.getElementById("potInfoContent")));
      });
      const clearPot = document.getElementById("clearPotLayer");
      if (clearPot) clearPot.addEventListener("click", () => {
        if (currentPotLayer && potMap.hasLayer(currentPotLayer)) potMap.removeLayer(currentPotLayer);
      });
    }

    const pomcaMapElement = document.getElementById("pomcaMap");
    if (pomcaMapElement && window.L) {
      pomcaMap = L.map("pomcaMap", { preferCanvas: true }).setView(ocanaCoords, 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "&copy; OpenStreetMap contributors" }).addTo(pomcaMap);
      document.querySelectorAll('input[name="pomcaLayer"]').forEach((radio) => {
        radio.addEventListener("change", (e) => loadGenericLayer(pomcaMap, e.target.value, pomcaLayersConfig, "currentPomcaLayer", document.getElementById("pomcaLegendContent"), document.getElementById("pomcaInfoContent")));
      });
      const clearPomca = document.getElementById("clearPomcaLayer");
      if (clearPomca) clearPomca.addEventListener("click", () => {
        if (currentPomcaLayer && pomcaMap.hasLayer(currentPomcaLayer)) pomcaMap.removeLayer(currentPomcaLayer);
      });
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
