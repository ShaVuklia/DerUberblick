// CONFIG
const LOCATION = {
  latitude: 52.37,        // Amsterdam
  longitude: 4.90,
  timezone: "Europe/Amsterdam"
};

const zones = {
  Texas: "America/Chicago",
  Colombia: "America/Bogota",
  Amsterdam: "Europe/Amsterdam",
  Vietnam: "Asia/Ho_Chi_Minh",
  Singapore: "Asia/Singapore"
};
  
const METEO_API_ENDPOINT = "https://api.open-meteo.com/v1/forecast";

// DOM REFERENCES
const dailyForecastDiv = document.getElementById("daily-forecast");
const hourlyForecastDiv = document.getElementById("hourly-forecast");
const timeZonesDiv = document.getElementById("timeZones");
const sunTimesDiv = document.getElementById("sunTimes");
const toggleButton = document.getElementById("toggleButton");

// MEDIA QUERIES
const prefersDarkQuery = window.matchMedia('(prefers-color-scheme: dark)');

// MAP SETUP
const map = L.map('map').setView([LOCATION.latitude, LOCATION.longitude], 13);

const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});

tiles.addTo(map);

// API HELPERS
function buildMeteoUrl({ daily, hourly }) {
  const params = new URLSearchParams({
    latitude: LOCATION.latitude,
    longitude: LOCATION.longitude,
    timezone: LOCATION.timezone,
  });

  if (daily) params.set("daily", daily);
  if (hourly) params.set("hourly", hourly);

  return `${METEO_API_ENDPOINT}?${params.toString()}`;
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

// UI HELPERS
/* TODO: Do we want a single function for updating the container alignments? */

// Function to update container alignment
// UI HELPERS
function setupWeatherContainers() {
  const containers = document.querySelectorAll(".weather");

  function updateWeatherAlignment(container) {
    if (container.scrollWidth > container.clientWidth) {
      container.classList.add("overflow");
      container.classList.remove("center");
    } else {
      container.classList.add("center");
      container.classList.remove("overflow");
    }
  }

  // Initial alignment
  containers.forEach(updateWeatherAlignment);

  // Observe changes in content
  containers.forEach(container => {
    const observer = new MutationObserver(() => updateWeatherAlignment(container));
    observer.observe(container, { childList: true, subtree: true });
  });

  // Update on window resize
  window.addEventListener("resize", () => containers.forEach(updateWeatherAlignment));
}

// Function to apply the mode
function applyMode(isDark) {
  document.body.classList.toggle('dark-mode', isDark);
  document.body.classList.toggle('light-mode', !isDark);
  toggleButton.textContent = isDark ? 'Hell' : 'Dunkel';
}

// FEATURE FUNCTIONS
async function getSunTimes() {
  const url = buildMeteoUrl({ daily: "sunrise,sunset" });

  try {
    const data = await fetchJson(url);

    const { _time, sunrise, sunset } = data.daily;
    const todayIndex = 0;

    // Convert ISO strings to Date objects
    const sunriseDate = new Date(sunrise[todayIndex]);
    const sunsetDate = new Date(sunset[todayIndex]);

    // Format hours and minutes with leading zeros
    const sunriseTime = sunriseDate.toLocaleTimeString("de-DE", {hour: "2-digit", minute: "2-digit"});
    const sunsetTime  = sunsetDate.toLocaleTimeString("de-DE", {hour: "2-digit", minute: "2-digit"});

    sunTimesDiv.innerHTML = `<span>Aufgang: ${sunriseTime}</span> <span>Untergang: ${sunsetTime}</span>`;
  } catch (error) {
    console.error("Error fetching sun times:", error);
    sunTimesDiv.textContent = "Unable to load sun times.";
  }
}

async function getDailyForecast() {
  const url = buildMeteoUrl({
    daily: "temperature_2m_max,temperature_2m_min,precipitation_probability_max,rain_sum,uv_index_max"
  });

  try {
    const data = await fetchJson(url);
    dailyForecastDiv.innerHTML = "";

    const { time, temperature_2m_min, temperature_2m_max, precipitation_probability_max, rain_sum, uv_index_max } = data.daily;
    
    let html = "";

    for (let i = 0; i < 5; i++) {
      const date = new Date(time[i]);
      const dayName = date.toLocaleDateString("en-EN", { weekday: "short", month: "short", day: "numeric" });
      const rainIcon = precipitation_probability_max[i] >= 35 ? "☔" : "🌂";

      html += `
        <div class="item">
          <strong>${dayName}</strong><br>
          Temp: ${Math.round(temperature_2m_max[i])}/${Math.round(temperature_2m_min[i])}°C<br>
          ${rainIcon}: ${precipitation_probability_max[i]}% (${rain_sum[i]} mm)<br>
          UV Index: ${uv_index_max[i]}
        </div>
      `;
    }

    dailyForecastDiv.innerHTML = html;
    
  } catch (err) {
    dailyForecastDiv.textContent = "Unable to load forecast.";
    console.error(err);
  }
}

async function getHourlyForecast() {
  const url = buildMeteoUrl({
    hourly: "temperature_2m,precipitation_probability,precipitation,windspeed_10m,winddirection_10m,uv_index"
  });

  try {
    const data = await fetchJson(url);
    hourlyForecastDiv.innerHTML = "";

    const { time, temperature_2m, precipitation_probability, precipitation, windspeed_10m, uv_index } = data.hourly;

    const now = new Date();
    now.setMinutes(0, 0, 0);
    const end = new Date();
    // Create next day with time at 01:00
    end.setDate(end.getDate() + 1);
    end.setHours(1, 0, 0, 0);
    
    let html = "";

    for (let i = 0; i < time.length; i++) {
      const date = new Date(time[i]);
      // Continue loop until 01:00 next day
      if (date >= now && date <= end) {
        const hour = date.getHours();
        const temp = Math.round(temperature_2m[i]);
        const rainProb = precipitation_probability[i];
        const rainAmount = precipitation[i];
        const windSpeed = Math.round(windspeed_10m[i]);
        const uv = uv_index[i];
        const rainIcon = rainProb >= 35 ? "☔" : "🌂";

        html += `
          <div class="item">
            <strong>${hour}:00</strong><br>
            Temp: ${temp}°C<br>
            ${rainIcon}: ${rainProb}% (${rainAmount} mm)<br>
            🍃: ${windSpeed} km/h<br>
            UV Index: ${uv}
          </div>
        `;
      }
    }

    hourlyForecastDiv.innerHTML = html;

  } catch (err) {
    hourlyForecastDiv.textContent = "Unable to load forecast.";
    console.error(err);
  }
}

function getTimeZones() {
  const now = new Date();

  let html = "";

  // Object.entries = array of the elements [key, values]
  for (const [place, zone] of Object.entries(zones)) {
    let timeZone = new Intl.DateTimeFormat("de-DE", {
      timeZone: zone,
      timeStyle: "short",
    }).format(now);

    html += `<span>${place}: ${timeZone}</span>`;
  }

  timeZonesDiv.innerHTML = html;
}

// EVENTS
// Toggle button behavior for manual override
toggleButton.addEventListener('click', () => {
  const isDark = document.body.classList.contains('dark-mode');
  applyMode(!isDark);
});

// Listen for system preference changes
prefersDarkQuery.addEventListener('change', (e) => {
  applyMode(e.matches);
});

/* force recalculation */
window.addEventListener('load', () => {
  map.invalidateSize();
});

// INIT
function init() {
  applyMode(prefersDarkQuery.matches);
  setupWeatherContainers();

  getSunTimes();
  getDailyForecast();
  getHourlyForecast();
  getTimeZones();
}

init();