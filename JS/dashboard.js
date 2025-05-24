const zones = {
  norte: {
    name: "Norte",
    coords: [-0.1, -78.45],
    pmValues: [10, 11, 10, 9, 8, 9, 12, 15, 18, 20, 22, 24, 25, 24, 22, 20, 18, 16, 15, 14, 12, 11, 10, 9]
  },
  centroNorte: {
    name: "Centro-Norte",
    coords: [-0.18, -78.48],
    pmValues: [20, 19, 18, 17, 16, 17, 22, 26, 30, 32, 34, 36, 38, 37, 35, 32, 30, 28, 26, 24, 22, 20, 19, 18]
  },
  centro: {
    name: "Centro",
    coords: [-0.23, -78.51],
    pmValues: [25, 24, 24, 23, 22, 22, 27, 33, 38, 42, 45, 48, 50, 49, 47, 44, 42, 39, 37, 35, 33, 30, 28, 26]
  },
  centroSur: {
    name: "Centro-Sur",
    coords: [-0.28, -78.53],
    pmValues: [35, 34, 34, 33, 31, 32, 37, 43, 48, 52, 56, 60, 62, 61, 59, 55, 52, 49, 47, 45, 43, 40, 38, 36]
  },
  sur: {
    name: "Sur",
    coords: [-0.34, -78.56],
    pmValues: [40, 39, 39, 38, 36, 37, 42, 48, 54, 59, 63, 67, 70, 69, 67, 63, 60, 57, 54, 52, 50, 47, 45, 43]
  }
};

const map = L.map('map').setView([-0.22, -78.5], 12);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

const zoneSelector = document.getElementById('zoneSelector');
const semaforo = {
  green: document.getElementById('light-green'),
  yellow: document.getElementById('light-yellow'),
  red: document.getElementById('light-red')
};
const recoList = document.getElementById('reco-list');

const chart = new Chart(document.getElementById('chart').getContext('2d'), {
  type: 'line',
  data: {
    labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
    datasets: [{
      label: 'PM2.5 (µg/m³)',
      data: [],
      borderColor: '#3498db',
      backgroundColor: 'rgba(52,152,219,0.1)',
      tension: 0.3,
      fill: true,
    }]
  },
  options: {
    scales: {
      y: {
        beginAtZero: true,
        suggestedMax: 60
      }
    }
  }
});

Object.entries(zones).forEach(([key, zone]) => {
  const lastPM = zone.pmValues[zone.pmValues.length - 1];
  const color = lastPM < 12 ? 'green' : lastPM <= 35 ? 'orange' : 'red';

  const circle = L.circle(zone.coords, {
    color,
    fillColor: color,
    fillOpacity: 0.5,
    radius: 800
  }).addTo(map);

  circle.bindTooltip(`${zone.name}: ${lastPM} µg/m³`);
  circle.on('click', () => updateZone(key));

  const opt = document.createElement('option');
  opt.value = key;
  opt.textContent = zone.name;
  zoneSelector.appendChild(opt);
});

zoneSelector.addEventListener('change', e => updateZone(e.target.value));

function updateZone(zoneKey) {
  const zone = zones[zoneKey];
  if (!zone) return;

  map.setView(zone.coords, 14);
  chart.data.datasets[0].data = zone.pmValues;
  chart.update();

  const last = zone.pmValues[zone.pmValues.length - 1];
  updateSemaforo(last);
  updateRecomendaciones(last);
}

function updateSemaforo(pm) {
  Object.values(semaforo).forEach(el => el.classList.remove('active'));

  if (pm < 12) semaforo.green.classList.add('active');
  else if (pm <= 35) semaforo.yellow.classList.add('active');
  else semaforo.red.classList.add('active');
}

function updateRecomendaciones(pm) {
  let recommendations = [], level = '';

  if (pm <= 12) {
    level = 'Buena';
    recommendations = [
      '✅ Ideal para todas las actividades al aire libre',
      '🏃‍♀️ Perfecto para ejercitarse',
      '🚴‍♂️ Excelente para ciclismo y caminatas'
    ];
  } else if (pm <= 35) {
    level = 'Moderada';
    recommendations = [
      '⚠️ Actividades al aire libre aceptables para la mayoría',
      '🤧 Personas sensibles pueden experimentar síntomas menores',
      '💨 Considera reducir ejercicio intenso prolongado'
    ];
  } else if (pm <= 55) {
    level = 'Dañina para grupos sensibles';
    recommendations = [
      '🚫 Personas sensibles deben limitar actividades al aire libre',
      '😷 Considera usar mascarilla N95 al salir',
      '🏠 Mantén ventanas cerradas',
      '🌱 Usa purificadores de aire en casa'
    ];
  } else if (pm <= 150) {
    level = 'Muy Dañina';
    recommendations = [
      '🔴 Evita todas las actividades al aire libre',
      '😷 Usa mascarilla N95 obligatoriamente',
      '🏠 Permanece en interiores',
      '🚫 Evita ejercicio al aire libre completamente',
      '💊 Personas con asma o problemas cardíacos consulten médico'
    ];
  } else {
    level = 'Peligrosa';
    recommendations = [
      '🆘 ALERTA SANITARIA - Evita salir',
      '🏥 Busca atención médica si tienes síntomas',
      '😷 Usa mascarilla incluso en interiores',
      '🚫 Cancela todas las actividades al aire libre',
      '📞 Considera evacuación temporal si es posible'
    ];
  }

  const levelInfo = `<div class="zone-info"><strong>Nivel de calidad:</strong> ${level} (${pm} µg/m³)</div>`;
  recoList.innerHTML = levelInfo + recommendations.map(r => `<li>${r}</li>`).join('');
}
