// Configuration
const API_URL = 'http://localhost:8000/api/risk-forecast';

// Risk Color Mapping
const riskColors = {
  'Low': { color: '#10b981', bg: 'rgba(16, 185, 129, 0.2)', border: 'rgba(16, 185, 129, 0.5)' },
  'Moderate': { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.2)', border: 'rgba(245, 158, 11, 0.5)' },
  'High': { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.2)', border: 'rgba(239, 68, 68, 0.5)' },
  'Very High': { color: '#b91c1c', bg: 'rgba(185, 28, 28, 0.2)', border: 'rgba(185, 28, 28, 0.5)' },
  'Extreme': { color: '#7f1d1d', bg: 'rgba(127, 29, 29, 0.2)', border: 'rgba(127, 29, 29, 0.5)' }
};

let map;
let wardMarkers = [];
let allWardsData = [];
let currentDay = 0;

// DOM Elements
const timeSlider = document.getElementById('time-slider');
const dayLabel = document.getElementById('day-label');
const alertsContainer = document.getElementById('alerts-container');

// Init Map
function initMap() {
  // Center roughly on New Delhi coords we used in backend
  map = L.map('map').setView([28.6139, 77.2090], 11);

  // Use a dark map tile layer to fit the theme
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(map);
}

// Generate Advisory Text
function generateAdvisory(tier) {
  switch (tier) {
    case 'Extreme':
      return 'CRITICAL: Suspend all outdoor labor immediately (12 PM - 4 PM). Mandatory opening of municipal cooling centers. High risk of heat stroke.';
    case 'Very High':
      return 'WARNING: Limit outdoor activities. Vulnerable populations must stay indoors. Hydration stations deployed.';
    case 'High':
      return 'ADVISORY: Monitor vulnerable individuals. Outdoor workers require mandated 15-minute rest and water breaks per hour.';
    case 'Moderate':
      return 'NOTICE: Normal precautions. Stay hydrated during peak sun hours.';
    case 'Low':
      return 'SAFE: No significant heat stress anticipated.';
    default:
      return 'No advisory.';
  }
}

// Fetch Data
async function fetchForecast() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error('Network response was not ok');
    allWardsData = await res.json();
    renderMapData();
    evaluateAlerts();
  } catch (error) {
    console.error('Error fetching data:', error);
    // fallback if map container exists
    alertsContainer.innerHTML = `<div class="alert-desc" style="color:red">Failed to load data. Is the backend running?</div>`;
  }
}

function renderMapData() {
  // Clear existing markers
  wardMarkers.forEach(m => map.removeLayer(m));
  wardMarkers = [];

  allWardsData.forEach(ward => {
    const forecast = ward.forecasts[currentDay];
    if (!forecast) return;

    const colors = riskColors[forecast.risk_tier] || riskColors['Low'];
    
    // Create Circle Marker
    const marker = L.circleMarker([ward.lat, ward.lng], {
      radius: 15 + (forecast.predicted_hospitalization_risk * 20),
      fillColor: colors.color,
      color: colors.border,
      weight: 2,
      opacity: 1,
      fillOpacity: 0.6
    }).addTo(map);
    
    // Popup Content
    const popupHtml = `
      <div class="ward-popup">
        <h3>${ward.ward_name}</h3>
        <div class="risk-badge" style="background:${colors.bg}; color:${colors.color}; border:1px solid ${colors.border}">
          ${forecast.risk_tier} (Risk: ${(forecast.predicted_hospitalization_risk * 100).toFixed(1)}%)
        </div>
        
        <div class="ward-popup-stats">
          <div><b>Temp:</b> ${forecast.temperature_c.toFixed(1)}°C</div>
          <div><b>RH:</b> ${forecast.relative_humidity.toFixed(1)}%</div>
          <div><b>WBGT:</b> ${forecast.wbgt_c.toFixed(1)}°C</div>
          <div><b>Heat Index:</b> ${forecast.hi_c.toFixed(1)}°C</div>
          <div><b>UTCI:</b> ${forecast.utci_c.toFixed(1)}°C</div>
          <div><b>MRI Score:</b> ${forecast.composite_score.toFixed(1)}</div>
          <div><b>Elderly:</b> ${ward.elderly_pct.toFixed(1)}%</div>
          <div><b>Outdoor Labor:</b> ${(ward.outdoor_pct * 100).toFixed(1)}%</div>
        </div>
        
        <div class="ward-popup-advisory">
          ${generateAdvisory(forecast.risk_tier)}
        </div>
      </div>
    `;
    
    marker.bindPopup(popupHtml, { maxWidth: 350 });
    wardMarkers.push(marker);
  });
}

// Alerting Engine
function evaluateAlerts() {
  alertsContainer.innerHTML = '';
  let alertCount = 0;
  
  allWardsData.forEach(ward => {
    const forecast = ward.forecasts[currentDay];
    if (!forecast) return;

    if (forecast.predicted_hospitalization_risk >= 0.6) {
      alertCount++;
      const isExtreme = forecast.predicted_hospitalization_risk >= 0.8;
      
      const alert = document.createElement('div');
      alert.className = `alert-card ${isExtreme ? 'extreme' : ''}`;
      
      alert.innerHTML = `
        <div class="alert-time">Day ${currentDay} Forecast</div>
        <div class="alert-title">${isExtreme ? 'CRITICAL:' : 'WARNING:'} ${ward.ward_name}</div>
        <div class="alert-desc">Hospitalization risk projected at ${(forecast.predicted_hospitalization_risk * 100).toFixed(1)}%. ${generateAdvisory(forecast.risk_tier)}</div>
      `;
      alertsContainer.appendChild(alert);
    }
  });
  
  if (alertCount === 0) {
    alertsContainer.innerHTML = '<div class="alert-desc" style="text-align: center; margin-top: 2rem;">No active high-risk alerts for this day.</div>';
  }
}

// Event Listeners
timeSlider.addEventListener('input', (e) => {
  currentDay = parseInt(e.target.value);
  dayLabel.textContent = currentDay === 0 ? 'Day 0 (Today)' : `Day ${currentDay}`;
  renderMapData();
  evaluateAlerts();
});

// Init
initMap();
fetchForecast();

// Optional: refresh every 60 seconds (only if viewing current day)
setInterval(() => {
    if (currentDay === 0) {
        fetchForecast();
    }
}, 60000);
