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

  async function cargarRiesgo() {
    if (riesgoCargado && riesgoLayer) return;

    try {
      const response = await fetch('https://raw.githubusercontent.com/estebanyxy3-beep/geovisor-ocana/refs/heads/main/Amenaza_Avenida_Torrencial_Urbano.json');

      if (!response.ok) {
        throw new Error('No se pudo cargar el archivo GeoJSON');
      }

      const riesgoData = await response.json();

      riesgoLayer = L.geoJSON(riesgoData, {
        style: function (feature) {
          const props = feature.properties || {};

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
        },
        onEachFeature: function (feature, layer) {
          const props = feature.properties || {};

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

          layer.bindPopup(popupHTML);
        }
      });

      riesgoCargado = true;
      console.log('Capa de riesgo cargada correctamente');
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
      `,
      pot: `
        <div class="legend-item"><span class="swatch" style="background:#facc15;"></span><span>Suelo urbano</span></div>
        <div class="legend-item"><span class="swatch" style="background:#86efac;"></span><span>Suelo rural</span></div>
        <div class="legend-item"><span class="swatch" style="background:#fdba74;"></span><span>Expansión urbana</span></div>
        <div class="legend-item"><span class="swatch" style="background:#166534;"></span><span>Protección</span></div>
      `,
      pomca: `
        <div class="legend-item"><span class="swatch" style="background:#166534;"></span><span>Preservación</span></div>
        <div class="legend-item"><span class="swatch" style="background:#22c55e;"></span><span>Restauración</span></div>
        <div class="legend-item"><span class="swatch" style="background:#86efac;"></span><span>Uso sostenible</span></div>
        <div class="legend-item"><span class="swatch" style="background:#a3e635;"></span><span>Uso múltiple</span></div>
      `,
      participacion: `
        <div class="legend-item"><span class="swatch" style="background:#2563eb;"></span><span>JAC</span></div>
        <div class="legend-item"><span class="swatch" style="background:#7c3aed;"></span><span>Mesa ambiental</span></div>
        <div class="legend-item"><span class="swatch" style="background:#0f766e;"></span><span>Entidad pública</span></div>
      `,
      vial: `
        <div class="legend-item"><span class="swatch" style="background:#ef4444;"></span><span>Punto crítico</span></div>
        <div class="legend-item"><span class="swatch" style="background:#fb7185;"></span><span>Densidad media</span></div>
      `,
      educativo: `
        <div class="legend-item"><span class="swatch" style="background:#14b8a6;"></span><span>Ficha didáctica</span></div>
        <div class="legend-item"><span class="swatch" style="background:#0ea5e9;"></span><span>Glosario</span></div>
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

    const moduleNames = {
      riesgo: 'Riesgo',
      pot: 'POT y ordenamiento',
      pomca: 'POMCA',
      participacion: 'Participación ciudadana',
      vial: 'Accidentalidad vial',
      educativo: 'Módulo educativo'
    };

    const niceName = moduleNames[moduleName] || moduleName;

    if (isActive) {
      zoneInfo.innerHTML = `Módulo <strong>${niceName}</strong> activado.`;
    } else {
      zoneInfo.innerHTML = `Módulo <strong>${niceName}</strong> desactivado.`;
    }
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

          showModuleMessage(moduleName, true);
        } else {
          if (riesgoLayer && map.hasLayer(riesgoLayer)) {
            map.removeLayer(riesgoLayer);
          }

          updateLegend();
          showModuleMessage(moduleName, false);
        }
        return;
      }

      if (e.target.checked) {
        updateLegend(moduleName);
        showModuleMessage(moduleName, true);
      } else {
        updateLegend();
        showModuleMessage(moduleName, false);
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
