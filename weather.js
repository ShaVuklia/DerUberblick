// TO DO

// Add button for other days too
// Hourly forecast should be updated every 10 minutes I think...
// make title graph black
// change opacity on hover for UV
// stand zon toevoegen

// ? Add visible error messages if data can't be loaded

// Make daily weather forecast visual (temp, prec, uv index) [done]
// change colour of UV bar depending on height [done]
// make y-axis dynamic (range not to small, not too big) [done]
// Check weather forecast accuracy... mayeb 15-min data will be better? [done]


// CONFIG
import { LOCATION } from './script.js';

let forecastData = null;

let selectedForecastDay = null;
// null = initial compact 12h view
// 0 = today expanded to midnight
// 1 = tomorrow
// 2 = day 3
// 3 = day 4
// 4 = day 5

const METEO_API_ENDPOINT = "https://api.open-meteo.com/v1/forecast";

// DOM REFERENCES
const dailyForecastDiv = document.getElementById("daily-forecast");
const hourlyForecastDiv = document.getElementById("hourly-forecast");
const sunTimesDiv = document.getElementById("sunTimes");

// API HELPERS
function buildForecastUrl({
  latitude,
  longitude,
  timezone = "auto",

  // Fallback values
  daily = [],
  hourly = [],
  minutely15 = []

} = {}) {

  const params = new URLSearchParams({
    latitude,
    longitude,
    timezone
  });

  // DAILY VARIABLES
  if (daily.length > 0) {
    params.set(
      "daily",
      daily.join(",")
    );
  }

  // HOURLY VARIABLES
  if (hourly.length > 0) {
    params.set(
      "hourly",
      hourly.join(",")
    );
  }

  // 15-MINUTE VARIABLES
  if (minutely15.length > 0) {
    params.set(
      "minutely_15",
      minutely15.join(",")
    );
  }

  return `${METEO_API_ENDPOINT}?${params.toString()}`;
}

const FORECAST_CONFIG = {
  latitude: LOCATION.latitude,
  longitude: LOCATION.longitude,
  timezone: LOCATION.timezone,

  daily: [
    "sunrise",
    "sunset",
    "temperature_2m_max",
    "temperature_2m_min",
    "precipitation_probability_max",
    "rain_sum",
    "uv_index_max"
  ],

  hourly: [
    "temperature_2m",
    "precipitation",
    "uv_index"
  ],

  minutely15: [
    "temperature_2m",
    "precipitation"
  ]
};

async function fetchForecastData(options = {}) {

  const url = buildForecastUrl(options);

  console.log("Fetching:", url);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Forecast request failed: ${response.status}`
    );
  }

  forecastData = await response.json();

  return forecastData;
}

function renderSunTimes() {

  const {
    sunrise,
    sunset
  } = forecastData.daily;

  const todayIndex = 0;

  const sunriseDate =
    new Date(sunrise[todayIndex]);

  const sunsetDate =
    new Date(sunset[todayIndex]);

  const sunriseTime =
    sunriseDate.toLocaleTimeString(
      "de-DE",
      {
        hour: "2-digit",
        minute: "2-digit"
      }
    );

  const sunsetTime =
    sunsetDate.toLocaleTimeString(
      "de-DE",
      {
        hour: "2-digit",
        minute: "2-digit"
      }
    );

  sunTimesDiv.innerHTML = `
    <span>☀️: ${sunriseTime}</span>
    <span>🌙: ${sunsetTime}</span>
  `;
}

function getCurrent15MinuteIndex() {

  const now = new Date();

  return (
    now.getHours() * 4 +
    Math.floor(now.getMinutes() / 15)
  );
}

function processInitialHoursData() {

  const labels = [];
  const temps = [];
  const rain = [];
  const uv = [];
  const dates = [];

  const minutely = forecastData.minutely_15;
  const hourly = forecastData.hourly;

  const now = new Date();

  const end = new Date(now);
  end.setHours(end.getHours() + 8);

  // ROUND DOWN TO CURRENT 15-MIN BLOCK
  now.setMinutes(
    Math.floor(now.getMinutes() / 15) * 15,
    0,
    0
  );

  const {
    time,
    temperature_2m,
    precipitation
  } = minutely;

  for (let i = 0; i < time.length; i++) {

    const date = new Date(time[i]);

    if (date >= now && date <= end) {
      dates.push(date);

      labels.push(
        date.toLocaleTimeString("de-DE", {
          hour: "2-digit",
          minute: "2-digit"
        })
      );

      temps.push(
        Math.round(temperature_2m[i])
      );

      rain.push(
        precipitation[i]
      );
    }
  }

  for (const date of dates) {

    uv.push(
      hourly.uv_index[date.getHours()]
    );
  }

  return {
    labels,
    temps,
    rain,
    uv,
    title: "Nächste 12 Stunden"
  };
}

function processTodayExpandedData() {

  const labels = [];
  const temps = [];
  const rain = [];
  const uv = [];
  const dates = [];

  const minutely =
    forecastData.minutely_15;

  const hourly =
    forecastData.hourly;

  const now = new Date();

  // ROUND TO CURRENT 15-MIN BLOCK
  now.setMinutes(
    Math.floor(now.getMinutes() / 15) * 15,
    0,
    0
  );

  const midnight =
    new Date(now);

  midnight.setHours(
    24,
    0,
    0,
    0
  );

  const {
    time,
    temperature_2m,
    precipitation
  } = minutely;

  for (let i = 0; i < time.length; i++) {

    const date =
      new Date(time[i]);

    if (date >= now && date <= midnight) {
      dates.push(date);

      labels.push(
        date.toLocaleTimeString(
          "de-DE",
          {
            hour: "2-digit",
            minute: "2-digit"
          }
        )
      );

      temps.push(
        Math.round(
          temperature_2m[i]
        )
      );

      rain.push(
        precipitation[i]
      );
    }
  }

  for (const date of dates) {
    uv.push(hourly.uv_index[date.getHours()]);
  }

  return {
    labels,
    temps,
    rain,
    uv,
    title: "Heute bis Mitternacht"
  };
}

// Returns chart data for a future day (dayOffset = 1 for tomorrow, etc.)
function processFutureDayData(dayOffset) {

  const labels = [];
  const temps = [];
  const rain = [];
  const uv = [];

  const hourly = forecastData.hourly;

  const {
    time,
    temperature_2m,
    precipitation,
    uv_index
  } = hourly;

  const targetDate =
    new Date();

  targetDate.setDate(
    targetDate.getDate() + dayOffset
  );

  for (let i = 0; i < time.length; i++) {

    const date =
      new Date(time[i]);

    if (date.toDateString() === targetDate.toDateString()) {
      labels.push(date.toLocaleTimeString("de-DE", {hour: "2-digit", minute: "2-digit"}));
      temps.push(Math.round(temperature_2m[i]));
      rain.push(precipitation[i]);
      uv.push(uv_index[i]);
    }
  
  }

  return {
    labels,
    temps,
    rain,
    uv,
    title:
      targetDate.toLocaleDateString(
        "de-DE",
        {
          weekday: "long",
          day: "numeric",
          month: "long"
        }
      )
  };
}

function renderDailyForecast() {

  dailyForecastDiv.innerHTML = "";

  const {
    time,
    temperature_2m_min,
    temperature_2m_max,
    precipitation_probability_max,
    rain_sum,
    uv_index_max
  } = forecastData.daily;

  let html = "";

  for (let i = 0; i < 5; i++) {

    const date = new Date(time[i]);

    const dayName = date.toLocaleDateString("en-EN", {
      weekday: "short",
      month: "short",
      day: "numeric"
    });

    const rainIcon = precipitation_probability_max[i] >= 35 ? "☔" : "🌂";

    const isActive = selectedForecastDay === i;

    html += `
      <div class="item forecast-day ${isActive ? "active" : ""}" data-day="${i}">
        <strong>${dayName}</strong><br>

        Temp:
        ${Math.round(temperature_2m_max[i])}
        /
        ${Math.round(temperature_2m_min[i])}°C
        <br>

        ${rainIcon}:
        ${precipitation_probability_max[i]}%
        (${rain_sum[i]} mm)
        <br>

        UV Index:
        ${uv_index_max[i]}
      </div>
    `;
  }

  dailyForecastDiv.innerHTML = html;

  setupForecastDayButtons();
}

function setupForecastDayButtons() {

  const buttons = document.querySelectorAll(".forecast-day");

  buttons.forEach(button => {

    button.addEventListener("click", () => {

      const day = Number(button.dataset.day);

      if (selectedForecastDay === day) {
        selectedForecastDay = null;
      } else {
        selectedForecastDay = day;
      }

      renderDailyForecast();
      renderForecastChart();

    });

  });

}

function renderChart({labels, temps, rain, uv, title}) {

  hourlyForecastDiv.innerHTML = `
    <canvas id="hourlyChart"></canvas>
  `;

  const ctx =
    document
      .getElementById("hourlyChart")
      .getContext("2d");

  const chartData = createChartData(labels, temps, rain, uv);

  const chartOptions = createForecastOptions(temps, rain, title);

  if (hourlyChart) {
    hourlyChart.destroy();
  }

  hourlyChart = new Chart(ctx, {
    type: "line",
    data: chartData,
    options: chartOptions
  });
}

function renderInitial12HourChart() {

  const processedData =
    processInitialHoursData();

  renderChart(processedData);
}

function renderForecastChart() {

  if (selectedForecastDay === null) {
    renderInitial12HourChart();
    return;
  }

  if (selectedForecastDay === 0) {
    renderTodayChart();
    return;
  }

  renderFutureDayChart(selectedForecastDay);
}

function renderTodayChart() {

  const processedData =
    processTodayExpandedData();

  renderChart(processedData);
}

function renderFutureDayChart(dayOffset) {

  const processedData =
    processFutureDayData(dayOffset);

  renderChart(processedData);
}
// from here on we need to change!


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

function getUvColor(value) {
  if (value <= 2) return "#2ecc7099";
  if (value <= 5) return "#f1c40f9b";
  if (value <= 7) return "#e67d227f";
  return "#e74c3c";
}

function getUvHoverColor(value) {
  if (value <= 2) return "#2ecc71";
  if (value <= 5) return "#f1c40f";
  if (value <= 7) return "#e67e22";
  return "#e74c3c";
}

function createChartData(labels, temps, rain, uv) {
  return {
    labels,
    datasets: [
      {
        label: "Temperature (°C)",
        data: temps,
        pointRadius: 4,
        borderColor: "#ff4530",
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
        backgroundColor: uv.map(getUvColor),
        hoverBackgroundColor: uv.map(getUvHoverColor),
        yAxisID: "y2",
        barPercentage: 1,
        categoryPercentage: 1
      }
    ]
  };
}

function createForecastOptions(
  temps,
  rain,
  title
) {
  const minTemp = Math.min(...temps);

  const maxTemp = Math.max(...temps);

  const padding = Math.max(3, (maxTemp - minTemp));

  return {
    responsive: true,
    maintainAspectRatio: true,

    plugins: {
      legend: {
        display: false
      },

      title: {
        display: true,
        text: title,
        color: "black",

        font: {
          size: 18
        }
      }
    },

    scales: {
      y: {
        min: Math.floor(minTemp - padding),
        max: Math.ceil(maxTemp + padding),

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


function scheduleSunTimesUpdate() {
  const now = new Date();

  const nextMidnight = new Date(now);
  nextMidnight.setHours(24, 0, 0, 0); // next 00:00:00

  const msUntilMidnight = nextMidnight - now;

  setTimeout(() => {
    renderSunTimes();

    // then repeat every 24 hours
    setInterval(renderSunTimes, 24 * 60 * 60 * 1000);

  }, msUntilMidnight);
}

function scheduleForecastUpdate() {

  const TEN_MINUTES =
    10 * 60 * 1000;

  setInterval(async () => {

    try {

      await fetchForecastData(
        FORECAST_CONFIG
      );

      renderSunTimes();
      renderDailyForecast();
      renderForecastChart();

    } catch (error) {

      console.error(
        "Forecast update failed:",
        error
      );

    }

  }, TEN_MINUTES);
}

// INIT
async function init() {

  await fetchForecastData(FORECAST_CONFIG);

  setupWeatherContainers();

  renderSunTimes();
  renderDailyForecast();

  renderForecastChart();

  scheduleForecastUpdate();
  scheduleSunTimesUpdate();
}

init();