window.addEventListener('load', function () {
  const ocanaCoords = [8.236372, -73.353228];

  const map = L.map('map').setView(ocanaCoords, 15);

  const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  });

  const satellite = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{x}/{y}',
    {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri'
    }
  );

  osm.addTo(map);

  L.marker(ocanaCoords)
    .addTo(map)
    .bindPopup('<b>GeoVisor Ocaña</b><br>Punto base del proyecto.')
    .openPopup();

  let riesgoLayer = null;
  let riesgoCargado = false;

  function obtenerValorAmenaza(props) {
    const posiblesCampos = [
      'nivel', 'NIVEL',
      'amenaza', 'AMENAZA',
      'clase', 'CLASE',
      'CLASIFICA', 'clasifica',
      'tipo', 'TIPO',
      'zona', 'ZONA',
      'riesgo', 'RIESGO',
      'gridcode', 'GRIDCODE',
      'id', 'ID'
    ];

    for (const campo of posiblesCampos) {
      if (props[campo] !== undefined && props[campo] !== null && props[campo] !== '') {
        return props[campo];
      }
    }

    return '';
  }

  function obtenerEstiloRiesgo(feature) {
    const props = feature.properties || {};
    const valorOriginal = obtenerValorAmenaza(props);
    const valorTexto = String(valorOriginal).trim().toLowerCase();

    let fillColor = '#d9d9d9';
    let borderColor = '#666666';

    if (valorTexto.includes('alta') || valorTexto === '3' || valorTexto === 'alto') {
      fillColor = '#ff0000';
      borderColor = '#990000';
    } else if (valorTexto.includes('media') || valorTexto === '2' || valorTexto === 'medio') {
      fillColor = '#ffff00';
      borderColor = '#999900';
    } else if (valorTexto.includes('baja') || valorTexto === '1' || valorTexto === 'bajo') {
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

  function construirPopup(props) {
    const titulo =
      props.titulo ||
      props.nombre ||
      props.NOMBRE ||
      'Amenaza Avenida Torrencial Urbana';

    let popupHTML = `<strong>${titulo}</strong>`;

    Object.keys(props).forEach((key) => {
      const value = props[key];
      if (value !== null && value !== undefined && value !== '') {
        popupHTML += `<br><strong>${key}:</strong> ${value}`;
      }
    });

    return popupHTML;
  }

  async function cargarRiesgo() {
    if (riesgoCargado && riesgoLayer) return;

    try {
      const response = await fetch('https://cdn.jsdelivr.net/gh/estebanyxy3-beep/geovisor-ocana@main/Amenaza_Avenida_Torrencial_Urbano.json');

      if (!response.ok) {
        throw new Error('No se pudo cargar el archivo GeoJSON');
      }

      const riesgoData = await response.json();

      riesgoLayer = L.geoJSON(riesgoData, {
        style: obtenerEstiloRiesgo,
        onEachFeature: function (feature, layer) {
          const props = feature.properties || {};
          layer.bindPopup(construirPopup(props));
        }
      });

      riesgoCargado = true;
    } catch (error) {
      console.error('Error cargando la capa de riesgo:', error);
      alert('No se pudo cargar la capa de riesgo. Revisa la URL del archivo.');
    }
  }

  function setBaseLayer(layerName) {
    if (map.hasLayer(osm)) map.removeLayer(osm);
    if (map.hasLayer(satellite)) map.removeLayer(satellite);

    if (layerName === 'satellite') {
      satellite.addTo(map);
    } else {
      osm.addTo(map);
    }
  }

  function updateLegend(activeModule = null) {
    const legendContent = document.getElementById('legendContent');

    const legends = {
      riesgo: `
        <div class="legend-item"><span class="swatch" style="background:#ff0000;"></span><span>Amenaza alta</span></div>
        <div class="legend-item"><span class="swatch" style="background:#ffff00;"></span><span>Amenaza media</span></div>
        <div class="legend-item"><span class="swatch" style="background:#00aa00;"></span><span>Amenaza baja</span></div>
      `
    };

    if (activeModule && legends[activeModule]) {
      legendContent.innerHTML = legends[activeModule];
    } else {
      legendContent.innerHTML = `
        <div class="legend-item"><span class="swatch" style="background:#2f8f5b;"></span><span>Mapa base de Ocaña activo</span></div>
        <div class="legend-item"><span class="swatch" style="background:#f59e0b;"></span><span>Activa un módulo para ver su leyenda</span></div>
      `;
    }
  }

  function showModuleMessage(moduleName, isActive) {
    const zoneInfo = document.getElementById('zoneInfo');
    zoneInfo.innerHTML = isActive
      ? `Módulo <strong>${moduleName}</strong> activado.`
      : `Módulo <strong>${moduleName}</strong> desactivado.`;
  }

  document.querySelectorAll('input[name="baseLayer"]').forEach((radio) => {
    radio.addEventListener('change', (e) => {
      setBaseLayer(e.target.value);
    });
  });

  document.querySelectorAll('.module-toggle').forEach((toggle) => {
    toggle.addEventListener('change', async (e) => {
      const moduleName = e.target.dataset.module;

      if (moduleName === 'riesgo') {
        if (e.target.checked) {
          await cargarRiesgo();

          if (riesgoLayer) {
            map.addLayer(riesgoLayer);
            updateLegend('riesgo');

            if (riesgoLayer.getBounds && riesgoLayer.getBounds().isValid()) {
              map.fitBounds(riesgoLayer.getBounds());
            }
          }

          showModuleMessage('Riesgo', true);
        } else {
          if (riesgoLayer && map.hasLayer(riesgoLayer)) {
            map.removeLayer(riesgoLayer);
          }
          updateLegend();
          showModuleMessage('Riesgo', false);
        }
      }
    });
  });

  map.on('click', function (e) {
    const { lat, lng } = e.latlng;

    document.getElementById('zoneInfo').innerHTML = `
      Coordenadas seleccionadas:<br>
      <strong>${lat.toFixed(6)}, ${lng.toFixed(6)}</strong>
    `;

    L.popup()
      .setLatLng(e.latlng)
      .setContent(`Coordenadas:<br><strong>${lat.toFixed(6)}, ${lng.toFixed(6)}</strong>`)
      .openOn(map);
  });

  setTimeout(() => {
    map.invalidateSize();
  }, 300);
});
