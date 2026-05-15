// TO DO

// Add button for other days too
// Hourly forecast should be updated every 10 minutes I think...
// make title graph black
// Check weather forecast accuracy... mayeb 15-min data will be better?
// make y-axis dynamic (range not to small, not too big)

// Remove top-most grid line

// ? Add visible error messages if data can't be loaded

// Make daily weather forecast visual (temp, prec, uv index) [done]

// CONFIG
import { LOCATION } from './script.js';

const METEO_API_ENDPOINT = "https://api.open-meteo.com/v1/forecast";

// DOM REFERENCES
const dailyForecastDiv = document.getElementById("daily-forecast");
const hourlyForecastDiv = document.getElementById("hourly-forecast");
const sunTimesDiv = document.getElementById("sunTimes");

// API HELPERS
function buildMeteoUrl({ daily, hourly }) {
  // Build URL query parameters for API request
  const params = new URLSearchParams({
    latitude: LOCATION.latitude,
    longitude: LOCATION.longitude,
    timezone: LOCATION.timezone,
  });

  console.log(params);

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
// Function to update container alignment
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

    sunTimesDiv.innerHTML = `<span>☀️: ${sunriseTime}</span> <span>🌙: ${sunsetTime}</span>`;
  } catch (error) {
    console.error("Error fetching sun times:", error);
    sunTimesDiv.textContent = "Kein Sonnenzeiten verfügbar";
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

// GRAPH HOURLY FORECAST
function processHourlyData(hourlyData, hoursAhead = 12) {
  const labels = [];
  const temps = [];
  const rain = [];
  const uv = [];

  const { time, temperature_2m, precipitation, uv_index } = hourlyData;

  const now = new Date();
  now.setMinutes(0, 0, 0);

  const end = new Date();
  end.setHours(end.getHours() + hoursAhead);

  for (let i = 0; i < time.length; i++) {
    const date = new Date(time[i]);

    if (date >= now && date <= end) {
      labels.push(`${date.getHours()}:00`);
      temps.push(Math.round(temperature_2m[i]));
      rain.push(precipitation[i]);
      uv.push(uv_index[i]);
    }
  }

  return { labels, temps, rain, uv };
}

function createChartData(labels, temps, rain, uv) {
  return {
    labels,
    datasets: [
      {
        label: "Temperature (°C)",
        data: temps,
        borderColor: "#e74c3c",
        tension: 0.3
      },
      {
        label: "Precipitation (mm)",
        data: rain,
        borderColor: "rgba(52, 152, 219, 1)",
        backgroundColor: "rgba(52, 152, 219, 0.25)",
        fill: true,
        tension: 0.3,
        yAxisID: "y1"
      },
      {
        label: "UV Index",
        type: "bar",
        data: uv,
        backgroundColor: "#f1c40f",
        yAxisID: "y2"
      }
    ]
  };
}

function createForecastOptions(temps, rain) {
  return {
    responsive: true,
    maintainAspectRatio: true,

    plugins: {
      legend: {
        display: false
      },

      title: {
        display: true,
        text: "Stündliche Vorhersage (Nächste 12 Stunden)",
        color: "black",

        font: {
          size: 18
        }
      }
    },

    scales: {
      y: {
        min: Math.min(...temps) - 7,
        max: Math.max(...temps) + 7,

        title: {
          display: true,
          text: "Temperature"
        },

        grid: {
          display: true
        }
      },

      y1: {
        min: 0,
        max: Math.max(10, Math.max(...rain) * 1.2),

        position: "right",

        grid: {
          drawOnChartArea: false
        },

        title: {
          display: true,
          text: "Precipitation (mm)"
        }
      },

      y2: {
        min: 0,
        max: 11,
        display: false
      },

      x: {
        ticks: {
          font: {
            size: 14
          }
        },

        grid: {
          display: false
        }
      }
    }
  };
}

let hourlyChart;

async function getHourlyForecast() {
  const url = buildMeteoUrl({
    hourly:
      "temperature_2m,precipitation_probability,precipitation,windspeed_10m,winddirection_10m,uv_index"
  });

  try {
    const data = await fetchJson(url);

    hourlyForecastDiv.innerHTML = `
      <canvas id="hourlyChart"></canvas>
    `;

    const ctx = document
      .getElementById("hourlyChart")
      .getContext("2d");

    const { labels, temps, rain, uv } =
      processHourlyData(data.hourly);

    const forecastData =
      createChartData(labels, temps, rain, uv);

    const forecastOptions =
      createForecastOptions(temps, rain);

    if (hourlyChart) {
      hourlyChart.destroy();
    }

    hourlyChart = new Chart(ctx, {
      type: "line",
      data: forecastData,
      options: forecastOptions
    });

  } catch (err) {
    hourlyForecastDiv.textContent =
      "Prognose konnte nicht geladen werden.";

    console.error(err);
  }
}

function scheduleSunTimesUpdate() {
  const now = new Date();

  const nextMidnight = new Date(now);
  nextMidnight.setHours(24, 0, 0, 0); // next 00:00:00

  const msUntilMidnight = nextMidnight - now;

  setTimeout(() => {
    getSunTimes();

    // then repeat every 24 hours
    setInterval(getSunTimes, 24 * 60 * 60 * 1000);

  }, msUntilMidnight);
}

function scheduleHourlyForecastUpdate() {
  const now = new Date();

  // Time until next full hour
  const msUntilNextHour =
    (60 - now.getMinutes()) * 60 * 1000 -
    now.getSeconds() * 1000 -
    now.getMilliseconds();

  setTimeout(() => {
    // Update immediately at the new hour
    getHourlyForecast();

    // Then update every hour
    setInterval(getHourlyForecast, 60 * 60 * 1000);

  }, msUntilNextHour);
}

// INIT
function init() {
  getSunTimes();
  setupWeatherContainers();
  getDailyForecast();
  getHourlyForecast();

  scheduleHourlyForecastUpdate();
  scheduleSunTimesUpdate();
}

init();