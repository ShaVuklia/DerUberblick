const LOCATION = {
  latitude: 52.37,        // Amsterdam
  longitude: 4.90,
  timezone: "Europe/Amsterdam"
};
  
const METEO_API = "https://api.open-meteo.com/v1/forecast";

const dailyForecastDiv = document.getElementById("daily-forecast");
const hourlyForecastDiv = document.getElementById("hourly-forecast");
const sunTimesDiv = document.getElementById("sunTimes");
const toggleButton = document.getElementById('toggleButton');

// Function to update container alignment
function updateWeatherAlignment(container) {
  if (container.scrollWidth > container.clientWidth) {
    container.classList.add("overflow");
    container.classList.remove("center");
  } else {
    container.classList.add("center");
    container.classList.remove("overflow");
  }
}

// Select all weather containers
const containers = document.querySelectorAll(".weather-container");

// Run on page load
containers.forEach(updateWeatherAlignment);

// Re-check on window resize
window.addEventListener("resize", () => {
  containers.forEach(updateWeatherAlignment);
});

// Re-check when content changes (e.g., after fetching forecast)
containers.forEach(container => {
  const observer = new MutationObserver(() => updateWeatherAlignment(container));
  observer.observe(container, { childList: true, subtree: true });
});


function buildMeteoUrl({ daily, hourly }) {
  const params = new URLSearchParams({
    latitude: LOCATION.latitude,
    longitude: LOCATION.longitude,
    timezone: LOCATION.timezone,
  });

  if (daily) params.set("daily", daily);
  if (hourly) params.set("hourly", hourly);

  return `${METEO_API}?${params.toString()}`;
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

// Set initial text based on current mode
toggleButton.textContent = document.body.classList.contains('dark-mode') ? 'Hell' : 'Dunkel';
toggleButton.addEventListener('click', toggleMode);

function toggleMode() {
    if (document.body.classList.contains('light-mode')) {
        document.body.classList.replace('light-mode', 'dark-mode');
        toggleButton.textContent = 'Hell';
    } else {
        document.body.classList.replace('dark-mode', 'light-mode');
        toggleButton.textContent = 'Dunkel';
    }
}

async function getSunTimes() {
  const url = buildMeteoUrl({ daily: "sunrise,sunset" });

  try {
    const data = await fetchJson(url);
    console.log(data); // inspect the structure

    const { time, sunrise, sunset } = data.daily;
    const todayIndex = 0;

    // Convert ISO strings to Date objects
    const sunriseDate = new Date(sunrise[todayIndex]);
    const sunsetDate = new Date(sunset[todayIndex]);

    // Format hours and minutes with leading zeros
    const sunriseTime = sunriseDate.toLocaleTimeString("de-DE", {hour: "2-digit", minute: "2-digit"});
    const sunsetTime  = sunsetDate.toLocaleTimeString("de-DE", {hour: "2-digit", minute: "2-digit"});

    sunTimesDiv.textContent = `Sunrise: ${sunriseTime}, Sunset: ${sunsetTime}`;
  } catch (error) {
    console.error("Error fetching sun times:", error);
    sunTimesDiv.textContent = "Unable to load sun times.";
  }
}


async function getDailyForecast() {
  const url = buildMeteoUrl({
    daily: "temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max"
  });

  try {
    const data = await fetchJson(url);
    dailyForecastDiv.innerHTML = "";

    const { time, temperature_2m_min, temperature_2m_max, precipitation_probability_max, uv_index_max } = data.daily;
    
    let html = "";

    for (let i = 0; i < 5; i++) {
      const date = new Date(time[i]);
      const dayName = date.toLocaleDateString("en-EN", { weekday: "short", month: "short", day: "numeric" });
      const rainIcon = precipitation_probability_max[i] >= 35 ? "☔" : "🌂";

      html += `
        <div class="weather-item">
          <strong>${dayName}</strong><br>
          Temp: ${Math.round(temperature_2m_min[i])}/${Math.round(temperature_2m_max[i])}°C<br>
          ${rainIcon}: ${precipitation_probability_max[i]}%<br>
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
    end.setDate(end.getDate() + 1);
    end.setHours(2, 0, 0, 0);
    
    let html = "";

    for (let i = 0; i < time.length; i++) {
      const date = new Date(time[i]);
      if (date >= now && date <= end) {
        const hour = date.getHours();
        const temp = Math.round(temperature_2m[i]);
        const rainProb = precipitation_probability[i];
        const rainAmount = precipitation[i];
        const windSpeed = Math.round(windspeed_10m[i]);
        const uv = uv_index[i];
        const rainIcon = rainProb >= 35 ? "☔" : "🌂";

        html += `
          <div class="weather-item">
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

getSunTimes();
getDailyForecast();
getHourlyForecast();

