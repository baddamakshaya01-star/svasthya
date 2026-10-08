const API_URL = 'https://svasthya-vil3.onrender.com/api/risk-forecast';

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
let heatLayer = null;
let allWardsData = [];
let currentDay = 0;
let dashboardInitialized = false;
let wardPageChartInstance = null;
let currentLanguage = 'en';

// Localization Dictionary
const translations = {
  en: {
    tapa_svasthya: "Tapa-Svasthya",
    sign_in: "Sign in to your account",
    any_health_issues: "Any Health Issues",
    enter_health_issues: "Enter any health issues",
    search: "Search...",
    precautions: "Precautions",
    safety: "Safety Measures",
    symptoms: "Symptoms",
    alerts: "Alerts",
    forecast_day_0: "Day 0",
    ward_analysis: "Ward Analysis:",
    '7_day_forecast': "7-Day Thermal Risk Forecast",
    last_updated: "Last Updated: Just now",
    stress_index: "HEAT STRESS INDEX",
    dashboard_subtitle: "Dashboard",
    nav_home: "Home",
    nav_stress: "Stress Analytics",
    nav_ward: "Ward Analysis",
    nav_history: "AI Chatbot History",
    nav_advices: "Health Advices",
    nav_settings: "Settings",
    current_user: "Current User",
    logout: "Logout",
    widget_weather: "Weather",
    widget_conditions: "Current Conditions",
    widget_forecast_map: "7-Day Regional Forecast",
    regional_map: "Regional Map",
    widget_humidity: "HUMIDITY",
    widget_wind: "WIND SPEED",
    widget_aqi: "Air Quality Index",
    aqi_good: "Good",
    aqi_desc: "Air quality is considered satisfactory, and air pollution poses little or no risk.",
    ward_analysis_title: "Ward Analysis (Detailed)",
    ward_analysis_desc: "Deep dive into specific wards across the city.",
    select_ward: "Select Ward:",
    city_average: "City Average",
    stress_index_title: "Heat Stress Index",
    stress_index_desc: "Unified biological stress metric based on Composite Risk Score.",
    chat_history_title: "AI Chatbot History",
    chat_history_desc: "Review your past conversations with the Tapa-Svasthya AI.",
    clear_history: "Clear History",
    precautions_content: "<li>Drink plenty of water even if you do not feel thirsty.</li><li>Wear loose, lightweight, light-colored clothing.</li><li>Limit outdoor activity, especially midday when the sun is hottest.</li><li>Check on family, friends, and neighbors who do not have air conditioning.</li>",
    safety_content: "<li>Never leave children or pets in a closed, parked vehicle.</li><li>If you must work outdoors, use a buddy system and take frequent breaks.</li><li>Seek medical care immediately if you have symptoms of heat illness.</li><li>Know where your nearest municipal cooling center is located.</li>",
    symptoms_content: "<li><b>Heat Exhaustion:</b> Heavy sweating, weakness, cold/pale/clammy skin, fast/weak pulse, nausea, fainting.</li><li><b>Heat Stroke (EMERGENCY):</b> High body temperature (103°F+), hot/red/dry skin, rapid/strong pulse, confusion, loss of consciousness.</li>",
    ai_assistant: "AI Assistant",
    welcome_tapa_svasthya: "Welcome to Tapa-Svasthya",
    nav_weather: "Weather",
    widget_7day: "7-Day Forecast",
    widget_thermal: "Thermal Indices",
    wbgt_label: "WBGT",
    hi_label: "Heat Index (HI)",
    utci_label: "UTCI"
  },
  hi: {
    tapa_svasthya: "तप-स्वास्थ्य",
    sign_in: "अपने खाते में साइन इन करें",
    any_health_issues: "कोई स्वास्थ्य समस्या",
    enter_health_issues: "कोई स्वास्थ्य समस्या दर्ज करें",
    search: "खोजें...",
    precautions: "सावधानियां",
    safety: "सुरक्षा उपाय",
    symptoms: "लक्षण",
    alerts: "अलर्ट",
    forecast_day_0: "दिन 0",
    ward_analysis: "वार्ड विश्लेषण:",
    '7_day_forecast': "7-दिन थर्मल जोखिम पूर्वानुमान",
    last_updated: "अंतिम अपडेट: अभी-अभी",
    stress_index: "हीट स्ट्रेस इंडेक्स",
    dashboard_subtitle: "डैशबोर्ड",
    nav_home: "होम",
    nav_stress: "तनाव विश्लेषण",
    nav_ward: "वार्ड विश्लेषण",
    nav_history: "AI चैटबॉट इतिहास",
    nav_advices: "स्वास्थ्य सलाह",
    nav_settings: "सेटिंग्स",
    current_user: "वर्तमान उपयोगकर्ता",
    logout: "लॉग आउट",
    widget_weather: "मौसम",
    widget_conditions: "वर्तमान स्थिति",
    widget_forecast_map: "7-दिन क्षेत्रीय पूर्वानुमान",
    regional_map: "क्षेत्रीय नक्शा",
    widget_humidity: "नमी",
    widget_wind: "हवा की गति",
    widget_aqi: "वायु गुणवत्ता सूचकांक",
    aqi_good: "अच्छा",
    aqi_desc: "वायु गुणवत्ता संतोषजनक मानी जाती है, और वायु प्रदूषण से कम या कोई जोखिम नहीं है।",
    ward_analysis_title: "वार्ड विश्लेषण (विस्तृत)",
    ward_analysis_desc: "शहर भर के विशिष्ट वार्डों में गहराई से जाएं।",
    select_ward: "वार्ड चुनें:",
    city_average: "शहर का औसत",
    stress_index_title: "हीट स्ट्रेस इंडेक्स",
    stress_index_desc: "समग्र जोखिम स्कोर पर आधारित एकीकृत जैविक तनाव मीट्रिक।",
    chat_history_title: "AI चैटबॉट इतिहास",
    chat_history_desc: "तप-स्वास्थ्य AI के साथ अपनी पिछली बातचीत की समीक्षा करें।",
    clear_history: "इतिहास मिटाएं",
    precautions_content: "<li>प्यास न लगने पर भी खूब पानी पिएं।</li><li>ढीले, हल्के और हल्के रंग के कपड़े पहनें।</li><li>बाहरी गतिविधियों को सीमित करें, खासकर दोपहर में।</li><li>परिवार और दोस्तों की जाँच करें।</li>",
    safety_content: "<li>बच्चों या पालतू जानवरों को कभी भी बंद वाहन में न छोड़ें।</li><li>यदि आपको बाहर काम करना है, तो बार-बार ब्रेक लें।</li><li>गर्मी की बीमारी के लक्षण होने पर तुरंत चिकित्सा देखभाल लें।</li>",
    symptoms_content: "<li><b>गर्मी की थकावट:</b> भारी पसीना, कमजोरी, पीली त्वचा, मतली, बेहोशी।</li><li><b>हीट स्ट्रोक (आपातकाल):</b> शरीर का उच्च तापमान, लाल/सूखी त्वचा, भ्रम, बेहोशी।</li>",
    ai_assistant: "AI सहायक",
    welcome_tapa_svasthya: "तप-स्वास्थ्य में आपका स्वागत है",
    nav_weather: "मौसम",
    widget_7day: "7-दिन पूर्वानुमान",
    widget_thermal: "थर्मल सूचकांक",
    wbgt_label: "WBGT",
    hi_label: "हीट इंडेक्स (HI)",
    utci_label: "UTCI"
  },
  te: {
    tapa_svasthya: "తప-స్వాస్థ్య",
    sign_in: "మీ ఖాతాలోకి సైన్ ఇన్ చేయండి",
    any_health_issues: "ఏదైనా ఆరోగ్య సమస్యలు",
    enter_health_issues: "ఏదైనా ఆరోగ్య సమస్యలను నమోదు చేయండి",
    search: "వెతకండి...",
    precautions: "జాగ్రత్తలు",
    safety: "భద్రత చర్యలు",
    symptoms: "లక్షణాలు",
    alerts: "హెచ్చరికలు",
    forecast_day_0: "రోజు 0",
    ward_analysis: "వార్డు విశ్లేషణ:",
    '7_day_forecast': "7-రోజుల థర్మల్ రిస్క్ సూచన",
    last_updated: "చివరి నవీకరణ: ఇప్పుడే",
    stress_index: "వేడి ఒత్తిడి సూచిక",
    dashboard_subtitle: "డాష్‌బోర్డ్",
    nav_home: "హోమ్",
    nav_stress: "ఒత్తిడి విశ్లేషణ",
    nav_ward: "వార్డు విశ్లేషణ",
    nav_history: "AI చాట్‌బాట్ చరిత్ర",
    nav_advices: "ఆరోగ్య సలహాలు",
    nav_settings: "సెట్టింగులు",
    current_user: "ప్రస్తుత వినియోగదారు",
    logout: "లాగ్ అవుట్",
    widget_weather: "వాతావరణం",
    widget_conditions: "ప్రస్తుత పరిస్థితులు",
    widget_forecast_map: "7-రోజుల ప్రాంతీయ సూచన",
    regional_map: "ప్రాంతీయ మ్యాప్",
    widget_humidity: "తేమ",
    widget_wind: "గాలి వేగం",
    widget_aqi: "గాలి నాణ్యత సూచిక",
    aqi_good: "మంచిది",
    aqi_desc: "గాలి నాణ్యత సంతృప్తికరంగా పరిగణించబడుతుంది మరియు వాయు కాలుష్యం వల్ల తక్కువ లేదా ఎలాంటి ప్రమాదం లేదు.",
    ward_analysis_title: "వార్డు విశ్లేషణ (వివరణాత్మక)",
    ward_analysis_desc: "నగరం అంతటా నిర్దిష్ట వార్డులను వివరంగా చూడండి.",
    select_ward: "వార్డును ఎంచుకోండి:",
    city_average: "నగర సగటు",
    stress_index_title: "వేడి ఒత్తిడి సూచిక",
    stress_index_desc: "కాంపోజిట్ రిస్క్ స్కోర్ ఆధారంగా ఏకీకృత జీవ ఒత్తిడి మెట్రిక్.",
    chat_history_title: "AI చాట్‌బాట్ చరిత్ర",
    chat_history_desc: "తప-స్వాస్థ్య AI తో మీ గత సంభాషణలను సమీక్షించండి.",
    clear_history: "చరిత్రను తుడిచివేయండి",
    precautions_content: "<li>దాహం లేకపోయినా పుష్కలంగా నీరు త్రాగాలి.</li><li>వదులుగా, లేత రంగు దుస్తులు ధరించండి.</li><li>ముఖ్యంగా మధ్యాహ్నం బయటి కార్యకలాపాలను పరిమితం చేయండి.</li><li>కుటుంబం మరియు స్నేహితులను తనిఖీ చేయండి.</li>",
    safety_content: "<li>పిల్లలను లేదా పెంపుడు జంతువులను మూసివేసిన వాహనంలో ఉంచవద్దు.</li><li>బయట పనిచేయాల్సి వస్తే విరామం తీసుకోండి.</li><li>వడదెబ్బ లక్షణాలు ఉంటే వెంటనే వైద్య సంరక్షణ పొందండి.</li>",
    symptoms_content: "<li><b>వేడి అలసట:</b> విపరీతమైన చెమట, బలహీనత, వికారం, మూర్ఛ.</li><li><b>వడదెబ్బ (అత్యవసరం):</b> అధిక శరీర ఉష్ణోగ్రత, గందరగోళం, స్పృహ కోల్పోవడం.</li>",
    ai_assistant: "AI సహాయకుడు",
    welcome_tapa_svasthya: "తప-స్వాస్థ్యకు స్వాగతం",
    nav_weather: "వాతావరణం",
    widget_7day: "7-రోజుల సూచన",
    widget_thermal: "థర్మల్ సూచికలు",
    wbgt_label: "WBGT",
    hi_label: "వేడి సూచిక (HI)",
    utci_label: "UTCI"
  }
};

// DOM Elements
const loginForm = document.getElementById('login-form');
const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const langSelect = document.getElementById('lang-select');
const lastUpdatedText = document.getElementById('last-updated');

// Home Widgets
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
const weatherPageTemp = document.getElementById('weather-page-temp');
const humidityVal = document.getElementById('humidity-val');
const humidityProgress = document.querySelector('.progress');
const stressVal = document.getElementById('stress-val');
const stressDesc = document.getElementById('stress-desc');
const stressGaugeFill = document.getElementById('stress-gauge-fill');
const homeStressVal = document.getElementById('home-stress-val');
const homeStressGaugeFill = document.getElementById('home-stress-gauge-fill');
const homeForecastList = document.getElementById('home-forecast-list');
const homeWbgtVal = document.getElementById('home-wbgt-val');
const homeWbgtProgress = document.getElementById('home-wbgt-progress');
const homeHiVal = document.getElementById('home-hi-val');
const homeHiProgress = document.getElementById('home-hi-progress');
const homeUtciVal = document.getElementById('home-utci-val');
const homeUtciProgress = document.getElementById('home-utci-progress');

// New Thermal App UI
const tsValNum = document.getElementById('ts-val-num');
const tsValText = document.getElementById('ts-val-text');
const tsGaugePath = document.getElementById('ts-gauge-path');
const tsTemp = document.getElementById('ts-temp');
const tsHum = document.getElementById('ts-hum');
const tsWind = document.getElementById('ts-wind');
const tsSolar = document.getElementById('ts-solar');
const tsWbgt = document.getElementById('ts-wbgt');
const tsUv = document.getElementById('ts-uv');

// Ward Page
const wardPageSelect = document.getElementById('ward-page-select');
const timeSlider = document.getElementById('forecast-page-slider');
const dayLabel = document.getElementById('forecast-page-day-label');

// Localization Logic
function updateLanguage() {
  const dict = translations[currentLanguage];

  // Text Content
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) {
      el.textContent = dict[key];
    }
  });

  // HTML Content
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.getAttribute('data-i18n-html');
    if (dict[key]) {
      el.innerHTML = dict[key];
    }
  });

  // Placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (dict[key]) {
      el.placeholder = dict[key];
    }
  });
}

const dashLangSelect = document.getElementById('dash-lang-select');

function handleLangChange(e) {
  currentLanguage = e.target.value;
  updateLanguage();
  if (currentDay === 0) {
    dayLabel.textContent = translations[currentLanguage].forecast_day_0;
  }

  // Sync selects
  if (langSelect) langSelect.value = currentLanguage;
  if (dashLangSelect) dashLangSelect.value = currentLanguage;
}

if (langSelect) langSelect.addEventListener('change', handleLangChange);
if (dashLangSelect) dashLangSelect.addEventListener('change', handleLangChange);

// View Transition & Auth Logic
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  loginView.style.display = 'none';
  dashboardView.style.display = 'flex';
  
  const username = document.getElementById('username').value.trim();
  const age = document.getElementById('age').value.trim();
  const occupation = document.getElementById('occupation').value.trim();
  const diseases = document.getElementById('diseases').value.trim();
  
  // Populate profile dropdown
  document.getElementById('display-username').textContent = username || '--';
  document.getElementById('display-age').textContent = age || '--';
  document.getElementById('display-occupation').textContent = occupation || '--';
  document.getElementById('display-diseases').textContent = diseases || 'None';
  
  generatePersonalizedAdvice(occupation, diseases);

  if (!dashboardInitialized) {
    initDashboard();
    dashboardInitialized = true;
  }
});

function initDashboard() {
  initSidebarRouting();
  initMap();
  fetchForecast();
  loadChatHistory();

  timeSlider.addEventListener('input', (e) => {
    currentDay = parseInt(e.target.value);
    if (currentDay === 0) {
      dayLabel.textContent = translations[currentLanguage].forecast_day_0;
    } else {
      dayLabel.textContent = `Day ${currentDay}`;
    }
    renderMapData();
    updateWidgets();
  });

  wardPageSelect.addEventListener('change', () => {
    renderChart();
  });

  initSearch();
}

// Search Logic
function initSearch() {
  searchInput.addEventListener('input', (e) => {
    const val = e.target.value.toLowerCase().trim();
    if (!val || allWardsData.length === 0) {
      searchResults.style.display = 'none';
      return;
    }

    // Filter wards
    const matches = allWardsData
      .map((ward, idx) => ({ ward: ward, index: idx }))
      .filter(w => w.ward.ward_name.toLowerCase().includes(val));

    if (matches.length > 0) {
      let html = '';
      matches.forEach(m => {
        const riskTier = m.ward.forecasts[0] ? m.ward.forecasts[0].risk_tier : 'Low';
        const color = riskColors[riskTier] ? riskColors[riskTier].color : '#10b981';
        html += `<div class="search-item" data-index="${m.index}" style="padding: 10px 15px; cursor: pointer; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 500; font-size: 14px; color: #1e293b;">${m.ward.ward_name}</span>
          <span style="font-size: 12px; color: ${color}; font-weight: 600;">${riskTier}</span>
        </div>`;
      });
      searchResults.innerHTML = html;
      searchResults.style.display = 'block';
    } else {
      searchResults.innerHTML = `<div style="padding: 10px 15px; font-size: 14px; color: #64748b;">Press Enter to search globally...</div>`;
      searchResults.style.display = 'block';
    }
  });
  
  // Global Search on Enter
  searchInput.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      const val = e.target.value.trim();
      if (!val) return;
      
      // Try to find if it's already a ward
      const matchIndex = allWardsData.findIndex(w => w.ward_name.toLowerCase() === val.toLowerCase());
      if (matchIndex !== -1) {
         // Predefined ward
         wardPageSelect.value = matchIndex;
         wardPageSelect.dispatchEvent(new Event('change'));
         document.querySelector('[data-view="view-ward"]').click();
         searchInput.value = '';
         searchResults.style.display = 'none';
         return;
      }
      
      // Global search
      try {
        searchInput.disabled = true;
        const originalPlaceholder = searchInput.placeholder;
        searchInput.placeholder = 'Fetching live weather...';
        
        const baseUrl = API_URL.replace('/api/risk-forecast', '');
        const response = await fetch(`${baseUrl}/api/search-location?q=${encodeURIComponent(val)}`);
        
        if (!response.ok) throw new Error('Location not found');
        
        const newWard = await response.json();
        
        // Add to allWardsData (at index 0 so it becomes the new proxy for the homepage)
        allWardsData.unshift(newWard);
        
        // Update homepage widgets with the new location
        updateWidgets();
        
        // Update Ward dropdown with the new location
        const opt = document.createElement('option');
        opt.value = 0; // It's at index 0 now
        opt.textContent = newWard.ward_name;
        wardPageSelect.insertBefore(opt, wardPageSelect.options[1]); // Insert after City Average
        
        // Adjust existing options indexes
        for(let i = 2; i < wardPageSelect.options.length; i++) {
            if(wardPageSelect.options[i].value !== 'all') {
                wardPageSelect.options[i].value = parseInt(wardPageSelect.options[i].value) + 1;
            }
        }
        
        // Update Map
        if (map) {
            map.flyTo([newWard.lat, newWard.lng], 12, { animate: true, duration: 1.5 });
            renderMapData(); // Replot all markers including the new one
        }
        
        // Switch to home view to see widgets update
        document.querySelector('[data-view="view-home"]').click();
        
        // Cleanup
        searchInput.value = '';
        searchResults.style.display = 'none';
        
      } catch (err) {
        alert("Location not found or weather data unavailable.");
      } finally {
        searchInput.disabled = false;
        searchInput.placeholder = 'Search wards or any city...';
        searchInput.focus();
      }
    }
  });

  // Handle Search Click
  searchResults.addEventListener('click', (e) => {
    const item = e.target.closest('.search-item');
    if (!item) return;

    const wardIndex = item.getAttribute('data-index');
    wardPageSelect.value = wardIndex;
    
    // Trigger the change event so the Ward view updates all widgets and charts
    wardPageSelect.dispatchEvent(new Event('change'));

    // Switch to Ward Analysis View
    document.querySelector('[data-view="view-ward"]').click();

    // Cleanup search
    searchInput.value = '';
    searchResults.style.display = 'none';
  });

  // Hide search on outside click
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
      searchResults.style.display = 'none';
    }
  });
}

// Routing Logic (Sidebar)
function initSidebarRouting() {
  const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
  const views = document.querySelectorAll('.dashboard-view-content');

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();

      const targetViewId = item.getAttribute('data-view');
      if (!targetViewId) return;

      // Update active nav state
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      // Hide all views, show target view
      views.forEach(v => {
        v.style.display = 'none';
        v.classList.remove('active-view');
      });
      const targetView = document.getElementById(targetViewId);
      targetView.style.display = 'block';
      targetView.classList.add('active-view');

      // Fix map rendering bug if home view is selected (since map is now on home)
      if (targetViewId === 'view-home') {
        setTimeout(() => {
          if (map) map.invalidateSize();
        }, 100);
      }
    });
  });
}

// Profile & Logout Logic
const profileToggle = document.getElementById('profile-toggle');
const profileDropdown = document.getElementById('profile-dropdown');
const logoutBtn = document.getElementById('logout-btn');

profileToggle.addEventListener('click', () => {
  profileDropdown.style.display = profileDropdown.style.display === 'none' ? 'block' : 'none';
});

document.addEventListener('click', (e) => {
  if (!profileToggle.contains(e.target) && !profileDropdown.contains(e.target)) {
    profileDropdown.style.display = 'none';
  }
});

logoutBtn.addEventListener('click', () => {
  document.getElementById('username').value = '';
  document.getElementById('age').value = '';
  document.getElementById('diseases').value = '';

  dashboardView.style.display = 'none';
  profileDropdown.style.display = 'none';
  loginView.style.display = 'flex';

  // reset to home view automatically for next login
  document.querySelector('[data-view="view-home"]').click();
});

// Topbar Modals (kept for Quick links in topbar)
const modalOverlay = document.getElementById('info-modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');
const quickLinks = document.querySelectorAll('.quick-link-btn');

function showModal(title, htmlContent) {
  modalTitle.textContent = title;
  modalBody.innerHTML = htmlContent;
  modalOverlay.style.display = 'flex';
}

modalClose.addEventListener('click', () => {
  modalOverlay.style.display = 'none';
});
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) modalOverlay.style.display = 'none';
});

const modalContents = {
  'precautions': `<p>Drink plenty of water. Wear loose clothing. Limit outdoor activity.</p>`,
  'safety': `<p>Never leave children in cars. Use a buddy system at work.</p>`,
  'symptoms': `<p>Heat Exhaustion: heavy sweating. Heat Stroke: high temp, confusion.</p>`,
  'alerts': `<p>No critical system-wide alerts at this time.</p>`
};

document.querySelectorAll('[data-modal]').forEach(btn => {
  btn.addEventListener('click', () => {
    const key = btn.getAttribute('data-modal');
    const span = btn.querySelector('span');
    const title = span ? span.textContent : (key.charAt(0).toUpperCase() + key.slice(1));
    showModal(title, modalContents[key]);
  });
});

function generatePersonalizedAdvice(occ, diseases) {
  const occLower = occ.toLowerCase();
  const disLower = diseases.toLowerCase();
  const adviceContent = document.getElementById('occupation-advice-content');
  const healthContent = document.getElementById('health-advice-content');

  let advice = "";
  let precautions = "";
  let safety = "";
  let symptoms = "";

  if (occLower.includes('construct') || occLower.includes('build') || occLower.includes('labor') || occLower.includes('mason')) {
    advice = "<strong>High Risk (Outdoor Labor):</strong> Take frequent breaks in shaded or cooled areas. Hydrate constantly (at least 1 cup every 20 minutes) even if you don't feel thirsty. Wear lightweight, light-colored, loose-fitting clothing.";
    precautions = "<li>Drink water every 15-20 minutes, even if you are not thirsty.</li><li>Wear breathable, light-colored, long-sleeved clothing to block the sun.</li><li>Schedule the heaviest physical labor for early morning or late evening.</li><li>Take breaks in air-conditioned or fully shaded areas.</li>";
    safety = "<li>Use the buddy system to monitor coworkers for signs of heat illness.</li><li>Have a strict work-rest schedule based on the WBGT (Wet Bulb Globe Temperature).</li><li>Provide shaded cooling stations with cold water or electrolyte drinks.</li><li>Familiarize all site workers with emergency heat stroke protocols.</li>";
    symptoms = "<li><b>Heat Exhaustion:</b> Dizziness, extreme sweating, muscle cramps, weakness.</li><li><b>Heat Stroke (EMERGENCY):</b> Hot, red, dry skin (no sweating), confusion, fainting. Call emergency services immediately.</li>";
  } else if (occLower.includes('farm') || occLower.includes('agri')) {
    advice = "<strong>High Risk (Agricultural):</strong> Schedule strenuous tasks for early morning or late evening. Wear a wide-brimmed hat and protective clothing. Stay hydrated and use the buddy system while out in the fields.";
    precautions = "<li>Always carry an insulated water jug into the fields.</li><li>Wear a wide-brimmed hat with a neck flap and UV-protective sunglasses.</li><li>Avoid working alone in remote fields during peak heat (11 AM to 4 PM).</li>";
    safety = "<li>Ensure tractors and farm equipment have functioning AC or shaded canopies.</li><li>Keep emergency communication devices charged in case of heat collapse.</li><li>Take breaks under trees or constructed shade tents.</li>";
    symptoms = "<li><b>Heat Cramps:</b> Painful muscle spasms during heavy farm work.</li><li><b>Heat Exhaustion:</b> Nausea, pale clammy skin, fast heartbeat.</li>";
  } else if (occLower.includes('office') || occLower.includes('software') || occLower.includes('desk') || occLower.includes('it')) {
    advice = "<strong>Low Risk (Indoor):</strong> Although your risk of direct heat exposure is low, ensure adequate indoor ventilation and hydration. Be cautious during your commute and avoid peak heat hours when stepping outside.";
    precautions = "<li>Keep a water bottle at your desk and sip regularly.</li><li>Ensure the office AC is well maintained and not blowing directly on you.</li><li>Avoid heavy, hot lunches that can make you sluggish in a warm office.</li>";
    safety = "<li>If the office AC fails, use desk fans and open windows if cooler outside.</li><li>Avoid strenuous outdoor activities during your lunch break.</li><li>Be cautious during your commute home if using public transport without AC.</li>";
    symptoms = "<li><b>Dehydration:</b> Headaches, dry mouth, fatigue at your desk.</li><li><b>Heat Syncope:</b> Fainting if standing up too quickly in a hot environment.</li>";
  } else if (occLower.includes('deliver') || occLower.includes('driver') || occLower.includes('courier')) {
    advice = "<strong>Moderate Risk (Transportation):</strong> Keep vehicle air conditioning running. Carry extra water on your routes and take cooling breaks when necessary. Wear sunglasses and sunscreen.";
    precautions = "<li>Keep your vehicle's air conditioning serviced.</li><li>Bring a large cooler with ice packs and water on your route.</li><li>Apply sunscreen on your driving arm (the 'trucker tan' arm).</li><li>Wear sunglasses to prevent UV damage and eye strain.</li>";
    safety = "<li>Never lock yourself in an unventilated vehicle without AC running.</li><li>Park in the shade whenever waiting for long periods.</li><li>If you feel dizzy while driving, pull over immediately to a safe location.</li>";
    symptoms = "<li><b>Heat Exhaustion:</b> Profuse sweating, fatigue, blurry vision while driving.</li><li><b>Sunburn:</b> Red, painful skin on arms exposed to the window.</li>";
  } else {
    advice = "<strong>General Advice:</strong> Based on your occupation, ensure you monitor the heat indices carefully. Stay hydrated, avoid prolonged sun exposure during peak hours, and seek shade whenever possible.";
    // Use fallback original text for general case
    precautions = "<li>Drink plenty of water even if you do not feel thirsty.</li><li>Wear loose, lightweight, light-colored clothing.</li><li>Limit outdoor activity, especially midday when the sun is hottest.</li><li>Check on family, friends, and neighbors who do not have air conditioning.</li>";
    safety = "<li>Never leave children or pets in a closed, parked vehicle.</li><li>If you must work outdoors, use a buddy system and take frequent breaks.</li><li>Seek medical care immediately if you have symptoms of heat illness.</li><li>Know where your nearest municipal cooling center is located.</li>";
    symptoms = "<li><b>Heat Exhaustion:</b> Heavy sweating, weakness, cold/pale/clammy skin, fast/weak pulse, nausea, fainting.</li><li><b>Heat Stroke (EMERGENCY):</b> High body temperature (103°F+), hot/red/dry skin, rapid/strong pulse, confusion, loss of consciousness.</li>";
  }

  let healthAdvice = "";
  if (disLower.includes('asthma') || disLower.includes('resp')) {
    healthAdvice = "<strong>Respiratory Condition (Asthma/COPD):</strong> High temperatures and ozone levels can trigger asthma attacks. Keep your inhaler with you at all times. Stay indoors in an air-conditioned environment during peak heat hours and monitor AQI (Air Quality Index).";
  } else if (disLower.includes('heart') || disLower.includes('cardio') || disLower.includes('bp') || disLower.includes('blood pressure') || disLower.includes('hypertension')) {
    healthAdvice = "<strong>Cardiovascular Condition:</strong> Heat places extra stress on your heart. Avoid strenuous activities, especially outdoors. If you are on fluid-restricting medications, consult your doctor about how much water you should drink.";
  } else if (disLower.includes('diabet')) {
    healthAdvice = "<strong>Diabetes:</strong> Heat can affect blood sugar levels and how insulin works. Check your blood sugar more frequently. Keep your medication and insulin away from direct sunlight and heat.";
  } else if (disLower.includes('kidney') || disLower.includes('renal')) {
    healthAdvice = "<strong>Kidney Condition:</strong> Dehydration is especially dangerous for you. Work with your healthcare provider to find the right balance of fluid intake, as you may be on fluid restrictions while still needing to avoid dehydration from heat.";
  } else if (diseases.trim() === "") {
    healthAdvice = "<strong>No specific health conditions reported.</strong> Continue to follow general heat safety guidelines.";
  } else {
    healthAdvice = "<strong>General Precaution:</strong> Please consult with your healthcare provider to understand how extreme heat might interact with your specific health conditions or medications.";
  }

  if (adviceContent) adviceContent.innerHTML = advice;
  if (healthContent) healthContent.innerHTML = healthAdvice;

  // Override the Health Advices tab content dynamically for all languages to match the occupation
  const langs = ['en', 'hi', 'te'];
  langs.forEach(l => {
    translations[l].precautions_content = precautions;
    translations[l].safety_content = safety;
    translations[l].symptoms_content = symptoms;
  });

  // Force DOM update in the Health Advices view
  updateLanguage();
}

// Map Initialization
function initMap() {
  map = L.map('forecast-page-map').setView([28.6139, 77.2090], 11);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map);
}

function generateAdvisory(tier) {
  switch (tier) {
    case 'Extreme': return 'CRITICAL: Suspend all outdoor labor immediately.';
    case 'Very High': return 'WARNING: Limit outdoor activities.';
    case 'High': return 'ADVISORY: Monitor vulnerable individuals.';
    case 'Moderate': return 'NOTICE: Normal precautions.';
    case 'Low': return 'SAFE: No significant heat stress.';
    default: return 'No advisory.';
  }
}

async function fetchForecast() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`Network response was not ok: ${res.status}`);
    allWardsData = await res.json();
  } catch (error) {
    console.warn('Primary API fetch failed, trying live Render endpoint:', error);
    try {
      const fallbackRes = await fetch('https://svasthya-vil3.onrender.com/api/risk-forecast');
      if (!fallbackRes.ok) throw new Error('Render fallback failed');
      allWardsData = await fallbackRes.json();
    } catch (fallbackErr) {
      console.error('All fetch attempts failed:', fallbackErr);
    }
  }

  if (allWardsData && allWardsData.length > 0) {
    // Update Ward Dropdown
    wardPageSelect.innerHTML = '<option value="all">City Average</option>';
    allWardsData.forEach((ward, index) => {
      const opt = document.createElement('option');
      opt.value = index;
      opt.textContent = ward.ward_name;
      wardPageSelect.appendChild(opt);
    });

    // Set Last Updated Time
    const now = new Date();
    lastUpdatedText.textContent = `Last Updated: ${now.toLocaleTimeString()}`;

    renderMapData();
    updateWidgets();
    renderChart();
    if (typeof updateAlerts === 'function') updateAlerts();
  }
}

function updateWidgets() {
  if (allWardsData.length === 0) return;
  const proxyWard = allWardsData[0];
  const forecast = proxyWard.forecasts[currentDay];
  if (!forecast) return;

  const tempF = (forecast.temperature_c * 9 / 5) + 32;
  if (weatherPageTemp) weatherPageTemp.textContent = `${Math.round(tempF)}°F`;

  humidityVal.textContent = `${Math.round(forecast.relative_humidity)}%`;
  humidityProgress.style.width = `${Math.round(forecast.relative_humidity)}%`;

  // Calculate Stress Index Logic
  let normalizedStress = Math.min(Math.max(forecast.composite_score / 250, 0), 1);
  let rotation = 45 + (normalizedStress * 180);

  // Update both Stress Analytics page gauge and Home page mini-gauge
  if (stressGaugeFill) stressGaugeFill.style.transform = `rotate(${rotation}deg)`;
  if (homeStressGaugeFill) homeStressGaugeFill.style.transform = `rotate(${rotation}deg)`;

  let stressText = "Low";
  let stressColor = '#10b981';
  let stressDescText = "Safe limits. Normal activities.";

  if (normalizedStress < 0.3) {
    if (stressGaugeFill) stressGaugeFill.style.borderColor = '#10b981';
    if (homeStressGaugeFill) homeStressGaugeFill.style.borderColor = '#10b981';
  } else if (normalizedStress < 0.6) {
    stressColor = '#f59e0b';
    stressText = "Moderate";
    stressDescText = "Caution. Stay hydrated.";
    if (stressGaugeFill) stressGaugeFill.style.borderColor = '#f59e0b';
    if (homeStressGaugeFill) homeStressGaugeFill.style.borderColor = '#f59e0b';
  } else if (normalizedStress < 0.8) {
    stressColor = '#ef4444';
    stressText = "High";
    stressDescText = "Danger. Avoid prolonged exposure.";
    if (stressGaugeFill) stressGaugeFill.style.borderColor = '#ef4444';
    if (homeStressGaugeFill) homeStressGaugeFill.style.borderColor = '#ef4444';
  } else {
    stressColor = '#7f1d1d';
    stressText = "Extreme";
    stressDescText = "CRITICAL. Extreme Heat Stroke Risk.";
    if (stressGaugeFill) stressGaugeFill.style.borderColor = '#7f1d1d';
    if (homeStressGaugeFill) homeStressGaugeFill.style.borderColor = '#7f1d1d';
  }

  if (stressVal) {
    stressVal.textContent = stressText;
    stressVal.style.color = stressColor;
  }
  if (stressDesc) stressDesc.textContent = stressDescText;

  if (homeStressVal) {
    homeStressVal.textContent = stressText;
    homeStressVal.style.color = stressColor;
  }

  // Update New Thermal App UI
  if (tsValNum) {
    // Score out of 100
    const score100 = Math.round(normalizedStress * 100);
    tsValNum.textContent = score100;

    if (score100 < 40) tsValText.textContent = "LOW RISK";
    else if (score100 < 70) tsValText.textContent = "MODERATE RISK";
    else if (score100 < 85) tsValText.textContent = "HIGH RISK";
    else tsValText.textContent = "EXTREME RISK";

    // SVG path total length is ~251.2
    // offset = 251.2 - (score/100) * 251.2
    if (tsGaugePath) {
      const offset = 251.2 - (normalizedStress * 251.2);
      tsGaugePath.style.strokeDashoffset = offset;
    }

    if (tsTemp) tsTemp.textContent = `${forecast.temperature_c.toFixed(1)}°C`;
    if (tsHum) tsHum.textContent = `${forecast.relative_humidity.toFixed(0)}%`;
    if (tsWind) tsWind.textContent = `${(10 + Math.random() * 5).toFixed(0)} km/h`; // Mock wind
    if (tsSolar) tsSolar.textContent = `${(600 + Math.random() * 300).toFixed(0)} W/m²`; // Mock solar
    if (tsWbgt) tsWbgt.textContent = `${forecast.wbgt_c.toFixed(1)}°C`;
    if (tsUv) tsUv.textContent = score100 > 70 ? "High" : "Moderate";
  }

  // Update 7-Day Forecast List
  if (homeForecastList) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date().getDay();
    let listHtml = '';

    proxyWard.forecasts.slice(0, 7).forEach((f, idx) => {
      const dayName = idx === 0 ? 'Today' : days[(today + idx) % 7];
      const maxT = Math.round((f.temperature_c * 9 / 5) + 32);
      const minT = Math.round(maxT - 10 - Math.random() * 5); // Mocking min temp

      // Determine icon
      let icon = '<i class="fa-solid fa-sun" style="color:#f59e0b;"></i>';
      if (f.relative_humidity > 60) icon = '<i class="fa-solid fa-cloud-showers-heavy" style="color:#64748b;"></i>';
      else if (f.relative_humidity > 45) icon = '<i class="fa-solid fa-cloud-sun" style="color:#4facfe;"></i>';

      listHtml += `
        <div style="display: flex; align-items: center; justify-content: space-between; font-size: 14px;">
          <div style="width: 50px; font-weight: 500;">${dayName}</div>
          <div style="width: 30px; text-align: center;">${icon}</div>
          <div style="flex: 1; margin: 0 15px; position: relative; height: 6px; background: #e2e8f0; border-radius: 3px;">
            <div style="position: absolute; left: 20%; right: 20%; top: 0; bottom: 0; background: #0284c7; border-radius: 3px;"></div>
          </div>
          <div style="width: 60px; text-align: right; color: #475569;">
            <span style="font-weight:600; color:var(--text-dark);">${maxT}°</span> / ${minT}°
          </div>
        </div>
      `;
    });
    homeForecastList.innerHTML = listHtml;
  }

  // Update Thermal Indices
  if (homeWbgtVal) {
    const wbgtF = Math.round((forecast.wbgt_c * 9 / 5) + 32);
    const hiF = Math.round((forecast.hi_c * 9 / 5) + 32);
    const utciF = Math.round((forecast.utci_c * 9 / 5) + 32);

    homeWbgtVal.textContent = `${wbgtF}°F`;
    homeWbgtProgress.style.width = `${Math.min((wbgtF / 120) * 100, 100)}%`;

    homeHiVal.textContent = `${hiF}°F`;
    homeHiProgress.style.width = `${Math.min((hiF / 120) * 100, 100)}%`;

    homeUtciVal.textContent = `${utciF}°F`;
    homeUtciProgress.style.width = `${Math.min((utciF / 120) * 100, 100)}%`;
  }

  // Update Radiation Factor View Table
  const radTable = document.getElementById('radiation-forecast-table');
  if (radTable) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date().getDay();
    let radHtml = '';
    
    proxyWard.forecasts.slice(0, 7).forEach((f, idx) => {
      const dayName = idx === 0 ? 'Today' : days[(today + idx) % 7];
      const riskColor = f.risk_tier === 'Extreme' ? '#7f1d1d' : 
                        f.risk_tier === 'Very High' ? '#ef4444' :
                        f.risk_tier === 'High' ? '#f59e0b' :
                        f.risk_tier === 'Moderate' ? '#eab308' : '#10b981';
      
      radHtml += `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 12px; font-weight: 500; color: var(--text-dark);">${dayName}</td>
          <td style="padding: 12px; color: var(--text-dark);">${f.temperature_c.toFixed(1)}</td>
          <td style="padding: 12px; color: var(--text-dark);">${f.composite_score.toFixed(1)}</td>
          <td style="padding: 12px; font-weight: 600; color: var(--text-dark);">${(f.predicted_hospitalization_risk * 100).toFixed(1)}%</td>
          <td style="padding: 12px; color: ${riskColor}; font-weight: 700;">${f.risk_tier}</td>
        </tr>
      `;
    });
    radTable.innerHTML = radHtml;
  }
  
  updateAlerts();
}

function updateAlerts() {
  if (allWardsData.length === 0) return;
  
  let highRiskWards = [];
  allWardsData.forEach(ward => {
    const f = ward.forecasts[currentDay];
    if (f.risk_tier === 'Extreme' || f.risk_tier === 'Very High') {
      highRiskWards.push({ name: ward.ward_name, risk: f.risk_tier, temp: f.temperature_c });
    }
  });
  
  let alertHtml = '';
  if (highRiskWards.length === 0) {
    alertHtml = `<div style="padding: 15px; text-align: center; color: #10b981;"><i class="fa-solid fa-circle-check" style="font-size: 24px; margin-bottom: 10px;"></i><br><b>No critical alerts.</b><br>All wards are currently below the critical heat stress threshold.</div>`;
  } else {
    alertHtml = `<div style="margin-bottom: 15px; color: #ef4444; font-weight: 600;"><i class="fa-solid fa-triangle-exclamation"></i> ${highRiskWards.length} Critical Alert(s) Generated!</div>`;
    alertHtml += `<ul style="padding-left: 0; list-style: none; margin: 0; gap: 10px; display: flex; flex-direction: column;">`;
    highRiskWards.forEach(w => {
      const color = w.risk === 'Extreme' ? '#7f1d1d' : '#ef4444';
      const bg = w.risk === 'Extreme' ? '#fecaca' : '#fee2e2';
      alertHtml += `<li style="background: ${bg}; padding: 12px; border-radius: 8px; border-left: 4px solid ${color};">
        <div style="font-weight: 600; color: ${color}; font-size: 14px;">${w.name} - ${w.risk} Risk</div>
        <div style="font-size: 13px; color: #475569; margin-top: 5px;">Temperature is expected to hit <b>${w.temp.toFixed(1)}°C</b>. Immediate precautions advised for vulnerable populations!</div>
      </li>`;
    });
    alertHtml += `</ul>`;
  }
  
  modalContents['alerts'] = alertHtml;
  
  // Add red dot to topbar bell icon
  const topbarBellBtn = document.querySelector('.topbar-actions [data-modal="alerts"]');
  if (topbarBellBtn) {
    if (highRiskWards.length > 0) {
      topbarBellBtn.innerHTML = `<i class="fa-regular fa-bell"></i><span style="position: absolute; top: 0px; right: 2px; width: 8px; height: 8px; background: red; border-radius: 50%; box-shadow: 0 0 0 2px white;"></span>`;
    } else {
      topbarBellBtn.innerHTML = `<i class="fa-regular fa-bell"></i>`;
    }
  }
}

function renderMapData() {
  wardMarkers.forEach(m => map.removeLayer(m));
  wardMarkers = [];
  if (heatLayer) map.removeLayer(heatLayer);

  const heatData = [];

  allWardsData.forEach(ward => {
    const forecast = ward.forecasts[currentDay];
    if (!forecast) return;

    // Adjust intensity based on risk model (0.0 to 1.0)
    // Multiplier creates a more vibrant hotspot glow
    heatData.push([ward.lat, ward.lng, forecast.predicted_hospitalization_risk * 1.5]);

    const colors = riskColors[forecast.risk_tier] || riskColors['Low'];

    // Invisible circle marker to retain click/hover popups over the heatmap
    const marker = L.circleMarker([ward.lat, ward.lng], {
      radius: 25,
      fillColor: 'transparent',
      color: 'transparent',
      weight: 0,
      opacity: 0,
      fillOpacity: 0
    }).addTo(map);

    const popupHtml = `
      <div style="font-family:'Inter',sans-serif; color:#2d3748;">
        <h3 style="margin:0 0 10px 0; font-size:16px;">${ward.ward_name}</h3>
        <div style="background:${colors.bg}; color:${colors.color}; padding:4px 8px; border-radius:4px; display:inline-block; font-size:12px; font-weight:600; margin-bottom:10px;">
          ${forecast.risk_tier} Risk (${(forecast.predicted_hospitalization_risk * 100).toFixed(1)}%)
        </div>
        <div style="font-size:13px; display:grid; grid-template-columns:1fr 1fr; gap:5px; margin-bottom:10px;">
          <div><b>Temp:</b> ${forecast.temperature_c.toFixed(1)}°C</div>
          <div><b>RH:</b> ${forecast.relative_humidity.toFixed(1)}%</div>
        </div>
      </div>
    `;
    marker.bindPopup(popupHtml, { maxWidth: 300 });
    wardMarkers.push(marker);
  });

  // Render Leaflet Heatmap Layer
  if (heatData.length > 0) {
    heatLayer = L.heatLayer(heatData, {
      radius: 45,
      blur: 30,
      maxZoom: 12,
      gradient: {
        0.1: '#a7f3d0', // very light green
        0.3: '#fef08a', // light yellow
        0.5: '#facc15', // yellow
        0.7: '#f97316', // orange
        0.9: '#ef4444', // red
        1.0: '#991b1b'  // dark red
      }
    }).addTo(map);
  }
}

// Graphical Representation (Chart.js)
function renderChart() {
  if (allWardsData.length === 0) return;

  let targetWard;
  if (wardPageSelect.value === 'all') {
    targetWard = allWardsData[0]; // Proxy
  } else {
    targetWard = allWardsData[parseInt(wardPageSelect.value)];
  }

  const labels = ['Day 0 (Today)', 'Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6'];
  const riskData = targetWard.forecasts.map(f => (f.predicted_hospitalization_risk * 100).toFixed(1));
  const tempData = targetWard.forecasts.map(f => f.temperature_c.toFixed(1));

  const ctx = document.getElementById('wardPageChart').getContext('2d');

  if (wardPageChartInstance) wardPageChartInstance.destroy();

  wardPageChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Hospitalization Risk (%)',
          data: riskData,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          yAxisID: 'y',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Temperature (°C)',
          data: tempData,
          borderColor: '#0ea5e9',
          backgroundColor: 'transparent',
          yAxisID: 'y1',
          tension: 0.4,
          borderDash: [5, 5]
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Risk %' } },
        y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Temp °C' } }
      }
    }
  });
}

// Chatbot Logic with LocalStorage History (Now integrated into Page View)
const chatbotToggle = document.getElementById('chatbot-toggle');
const chatbotWindow = document.getElementById('chatbot-window');
const chatbotClose = document.getElementById('chatbot-close');
const chatInputField = document.getElementById('chat-input-field');
const chatSendBtn = document.getElementById('chat-send-btn');

// Messages container for the floating window
const chatbotMessages = document.getElementById('chatbot-messages');
// Messages container for the dedicated page view
const pageChatHistory = document.getElementById('page-chat-history');
const clearChatBtn = document.getElementById('clear-chat-btn');

// Sync floating and page history displays
function renderChatUI() {
  const history = localStorage.getItem('tapa_svasthya_chat_history');
  if (history) {
    chatbotMessages.innerHTML = history;
    pageChatHistory.innerHTML = history;
  } else {
    const initial = '<div class="message ai-message">Hello! I am the Tapa-Svasthya AI assistant. How can I help you analyze the heat risk data today?</div>';
    chatbotMessages.innerHTML = initial;
    pageChatHistory.innerHTML = initial;
  }
}

function loadChatHistory() {
  renderChatUI();
}

function saveChatHistory(html) {
  localStorage.setItem('tapa_svasthya_chat_history', html);
  renderChatUI();
}

chatbotToggle.addEventListener('click', () => {
  chatbotWindow.style.display = 'flex';
  chatbotToggle.style.display = 'none';
  chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
});

chatbotClose.addEventListener('click', () => {
  chatbotWindow.style.display = 'none';
  chatbotToggle.style.display = 'flex';
});

function handleChatSend() {
  const text = chatInputField.value.trim();
  if (!text) return;

  let currentHtml = chatbotMessages.innerHTML;
  currentHtml += `<div class="message user-message">${text}</div>`;
  saveChatHistory(currentHtml);

  chatInputField.value = '';
  chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
  pageChatHistory.scrollTop = pageChatHistory.scrollHeight;

  setTimeout(() => {
    let html = localStorage.getItem('tapa_svasthya_chat_history');
    html += `<div class="message ai-message">Based on the current 7-day predictive models, you should monitor the Heat Index and UTCI carefully. Is there a specific ward you want me to analyze?</div>`;
    saveChatHistory(html);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    pageChatHistory.scrollTop = pageChatHistory.scrollHeight;
  }, 1000);
}

chatSendBtn.addEventListener('click', handleChatSend);
chatInputField.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') handleChatSend();
});

clearChatBtn.addEventListener('click', () => {
  localStorage.removeItem('tapa_svasthya_chat_history');
  renderChatUI();
});

// Radiation Impact Simulator Logic
const radSlider = document.getElementById('rad-slider');
const radSliderVal = document.getElementById('rad-slider-val');
const simDeathRate = document.getElementById('sim-death-rate');
const simRiskLabel = document.getElementById('sim-risk-label');

if (radSlider) {
  const updateSimulator = () => {
    const radValue = parseInt(radSlider.value);
    radSliderVal.textContent = radValue;
    
    // Heuristic: baseline mortality risk increases with radiation
    const normalizedRad = (radValue - 200) / 1000; // 0 to 1
    const simulatedDeathRate = 1.5 + (normalizedRad * 28.5); // 1.5% to 30%
    
    simDeathRate.textContent = `${simulatedDeathRate.toFixed(1)}%`;
    
    if (simulatedDeathRate < 5) {
      simRiskLabel.textContent = "LOW RISK";
      simRiskLabel.style.color = "#10b981";
      simDeathRate.style.color = "#10b981";
    } else if (simulatedDeathRate < 12) {
      simRiskLabel.textContent = "MODERATE RISK";
      simRiskLabel.style.color = "#f59e0b";
      simDeathRate.style.color = "#f59e0b";
    } else if (simulatedDeathRate < 22) {
      simRiskLabel.textContent = "HIGH RISK";
      simRiskLabel.style.color = "#ef4444";
      simDeathRate.style.color = "#ef4444";
    } else {
      simRiskLabel.textContent = "EXTREME RISK";
      simRiskLabel.style.color = "#7f1d1d";
      simDeathRate.style.color = "#7f1d1d";
    }
  };
  
  radSlider.addEventListener('input', updateSimulator);
  // Initial call
  setTimeout(updateSimulator, 500);
}

// Run translation once on load
updateLanguage();

// Pre-fetch live forecast from Render immediately
fetchForecast();



