window.addEventListener('load', function () {
  const ocanaCoords = [8.236372, -73.353228];

  const navButtons = document.querySelectorAll('.nav-item');
  const views = document.querySelectorAll('.view');
  const sidebar = document.getElementById('sidebar');
  const navToggle = document.getElementById('navToggle');

  const map = L.map('map', {
    preferCanvas: true
  }).setView(ocanaCoords, 15);

  const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  });

  const satellite = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri'
    }
  );

  osm.addTo(map);

  L.marker(ocanaCoords)
    .addTo(map)
    .bindPopup('<b>GeoVisor Ocaña</b><br>Punto base del proyecto.');

  function syncChatbotContext(data) {
    if (window.updateChatbotContext) {
      window.updateChatbotContext(data);
    }
  }

  function showView(viewName) {
    views.forEach((view) => {
      view.classList.remove('active');
    });

    navButtons.forEach((btn) => {
      btn.classList.remove('active');
    });

    const targetView = document.getElementById(`view-${viewName}`);
    const activeButton = document.querySelector(`.nav-item[data-view="${viewName}"]`);

    if (targetView) targetView.classList.add('active');
    if (activeButton) activeButton.classList.add('active');

    if (window.innerWidth <= 900) {
      sidebar.classList.remove('open');
    }

    const moduleNames = {
      inicio: 'Inicio',
      riesgo: 'Riesgo',
      pot: 'POT',
      pomca: 'POMCA',
      participacion: 'Participación'
    };

    syncChatbotContext({
      activeModule: moduleNames[viewName] || 'Inicio'
    });

    if (viewName === 'riesgo') {
      setTimeout(() => {
        map.invalidateSize(true);
      }, 400);
    }
  }

  navButtons.forEach((button) => {
    button.addEventListener('click', function () {
      showView(this.dataset.view);
    });
  });

  navToggle.addEventListener('click', function () {
    sidebar.classList.toggle('open');
  });

  let currentRiskLayer = null;

  const riskLayersConfig = {
    amenaza_at: {
      label: 'Amenaza por avenida torrencial',
      url: 'https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/refs/heads/main/Amenaza_Avenida_Torrencial_Urbano.json',
      info: `
        <p><strong>Amenaza:</strong> posibilidad de ocurrencia de un fenómeno físico potencialmente dañino.</p>
        <p>Esta capa representa zonas asociadas a amenaza por avenida torrencial.</p>
        <p><strong>Normativa base:</strong> Ley 1523 de 2012.</p>
      `,
      legend: `
        <div class="legend-item"><span class="swatch" style="background:#ff0000;"></span><span>Amenaza alta</span></div>
        <div class="legend-item"><span class="swatch" style="background:#ffff00;"></span><span>Amenaza media</span></div>
        <div class="legend-item"><span class="swatch" style="background:#00aa00;"></span><span>Amenaza baja</span></div>
      `
    },
    exposicion_at: {
      label: 'Exposición por avenida torrencial',
      url: '',
      info: `
        <p><strong>Exposición:</strong> presencia de personas, viviendas, vías, predios o infraestructura en zonas que pueden verse afectadas por una amenaza.</p>
        <p>Aquí podrás cargar las capas de construcciones, predios o vías expuestas por avenida torrencial.</p>
        <p><strong>Normativa base:</strong> Ley 1523 de 2012.</p>
      `,
      legend: `
        <div class="legend-item"><span class="swatch" style="background:#f59e0b;"></span><span>Elemento expuesto</span></div>
      `
    },
    riesgo_at: {
      label: 'Riesgo por avenida torrencial',
      url: '',
      info: `
        <p><strong>Riesgo:</strong> resultado de la interacción entre amenaza, exposición y vulnerabilidad.</p>
        <p>Esta capa mostrará los elementos o áreas en riesgo por avenida torrencial.</p>
        <p><strong>Normativa base:</strong> Ley 1523 de 2012.</p>
      `,
      legend: `
        <div class="legend-item"><span class="swatch" style="background:#dc2626;"></span><span>Riesgo alto</span></div>
        <div class="legend-item"><span class="swatch" style="background:#f59e0b;"></span><span>Riesgo medio</span></div>
        <div class="legend-item"><span class="swatch" style="background:#22c55e;"></span><span>Riesgo bajo</span></div>
      `
    },
    amenaza_inundacion: {
      label: 'Amenaza por inundación',
      url: '',
      info: `
        <p>Esta sección permitirá visualizar la amenaza por inundación.</p>
        <p>Aquí integrarás la capa correspondiente una vez subas el GeoJSON.</p>
      `,
      legend: `
        <div class="legend-item"><span class="swatch" style="background:#3b82f6;"></span><span>Zona de amenaza</span></div>
      `
    },
    exposicion_inundacion: {
      label: 'Exposición por inundación',
      url: '',
      info: `
        <p>Mostrará construcciones, predios u otros elementos ubicados en zonas expuestas a inundación.</p>
      `,
      legend: `
        <div class="legend-item"><span class="swatch" style="background:#60a5fa;"></span><span>Elemento expuesto</span></div>
      `
    },
    riesgo_inundacion: {
      label: 'Riesgo por inundación',
      url: '',
      info: `
        <p>Mostrará el análisis de riesgo asociado a inundación.</p>
      `,
      legend: `
        <div class="legend-item"><span class="swatch" style="background:#1d4ed8;"></span><span>Riesgo por inundación</span></div>
      `
    },
    amenaza_mm: {
      label: 'Amenaza por movimiento en masa',
      url: '',
      info: `
        <p>Esta capa mostrará la amenaza por movimiento en masa.</p>
      `,
      legend: `
        <div class="legend-item"><span class="swatch" style="background:#8b5cf6;"></span><span>Zona de amenaza</span></div>
      `
    },
    exposicion_mm: {
      label: 'Exposición por movimiento en masa',
      url: '',
      info: `
        <p>Mostrará elementos expuestos frente a procesos de movimiento en masa.</p>
      `,
      legend: `
        <div class="legend-item"><span class="swatch" style="background:#a78bfa;"></span><span>Elemento expuesto</span></div>
      `
    },
    riesgo_mm: {
      label: 'Riesgo por movimiento en masa',
      url: '',
      info: `
        <p>Mostrará las áreas o elementos en riesgo por movimiento en masa.</p>
      `,
      legend: `
        <div class="legend-item"><span class="swatch" style="background:#7c3aed;"></span><span>Riesgo por movimiento en masa</span></div>
      `
    }
  };

  function setBaseLayer(layerName) {
    if (map.hasLayer(osm)) map.removeLayer(osm);
    if (map.hasLayer(satellite)) map.removeLayer(satellite);

    if (layerName === 'satellite') {
      satellite.addTo(map);
    } else {
      osm.addTo(map);
    }
  }

  function updateLegend(html = null) {
    const legendContent = document.getElementById('legendContent');

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

  function updateRiskInfo(html = '') {
    const riskInfoContent = document.getElementById('riskInfoContent');
    riskInfoContent.innerHTML = html || '<p>Selecciona una capa para ver su contenido.</p>';
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
      ''
    ).toString().trim().toLowerCase();

    let fillColor = '#d9d9d9';
    let borderColor = '#666666';

    if (nivel.includes('alta')) {
      fillColor = '#ff0000';
      borderColor = '#990000';
    } else if (nivel.includes('media')) {
      fillColor = '#ffff00';
      borderColor = '#999900';
    } else if (nivel.includes('baja')) {
      fillColor = '#00aa00';
      borderColor = '#006400';
    }

    return {
      color: borderColor,
      weight: 2,
      fillColor: fillColor,
      fillOpacity: 0.45
    };
  }

  async function loadRiskLayer(layerKey) {
    const config = riskLayersConfig[layerKey];
    if (!config) return;

    syncChatbotContext({
      activeLayer: config.label,
      activeModule: 'Riesgo',
      selectedFeature: null
    });

    if (currentRiskLayer && map.hasLayer(currentRiskLayer)) {
      map.removeLayer(currentRiskLayer);
      currentRiskLayer = null;
    }

    updateLegend(config.legend);
    updateRiskInfo(`
      <h4>${config.label}</h4>
      ${config.info}
    `);

    if (!config.url) {
      return;
    }

    try {
      const response = await fetch(config.url);

      if (!response.ok) {
        throw new Error('No se pudo cargar el archivo GeoJSON');
      }

      const data = await response.json();

      currentRiskLayer = L.geoJSON(data, {
        style: function (feature) {
          return getFeatureStyle(feature.properties || {});
        },
        onEachFeature: function (feature, layer) {
          const props = feature.properties || {};
          const title =
            props.titulo ||
            props.nombre ||
            props.NOMBRE ||
            config.label;

          let popupHTML = `<strong>${title}</strong>`;

          Object.keys(props).forEach((key) => {
            const value = props[key];
            if (value !== null && value !== undefined && value !== '') {
              popupHTML += `<br><strong>${key}:</strong> ${value}`;
            }
          });

          layer.bindPopup(popupHTML);

          layer.on('click', function () {
            syncChatbotContext({
              activeLayer: config.label,
              activeModule: 'Riesgo',
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
      console.error('Error cargando capa:', error);
      updateRiskInfo(`
        <h4>${config.label}</h4>
        ${config.info}
        <p><strong>Error:</strong> no se pudo cargar el archivo GeoJSON.</p>
      `);
    }
  }

  document.querySelectorAll('input[name="baseLayer"]').forEach((radio) => {
    radio.addEventListener('change', (e) => {
      setBaseLayer(e.target.value);
    });
  });

  document.querySelectorAll('input[name="riesgoLayer"]').forEach((radio) => {
    radio.addEventListener('change', (e) => {
      loadRiskLayer(e.target.value);
    });
  });

  document.getElementById('clearRiskLayer').addEventListener('click', function () {
    document.querySelectorAll('input[name="riesgoLayer"]').forEach((radio) => {
      radio.checked = false;
    });

    if (currentRiskLayer && map.hasLayer(currentRiskLayer)) {
      map.removeLayer(currentRiskLayer);
      currentRiskLayer = null;
    }

    syncChatbotContext({
      activeLayer: null,
      activeModule: 'Riesgo',
      selectedFeature: null
    });

    updateLegend();
    updateRiskInfo('<p>Selecciona una capa para ver su significado, interpretación y referencia normativa.</p>');
    map.setView(ocanaCoords, 15);
  });

  document.querySelectorAll('[data-view-target]').forEach((button) => {
    button.addEventListener('click', function () {
      const target = this.dataset.viewTarget;
      if (target) showView(target);
    });
  });

  const openChatbotBtnHero = document.getElementById('openChatbotBtnHero');
  const openChatbotBtn = document.getElementById('openChatbotBtn');

  if (openChatbotBtnHero && openChatbotBtn) {
    openChatbotBtnHero.addEventListener('click', function () {
      openChatbotBtn.click();
    });
  }

  syncChatbotContext({
    activeModule: 'Inicio'
  });

  setTimeout(() => {
    map.invalidateSize(true);
  }, 500);
});
