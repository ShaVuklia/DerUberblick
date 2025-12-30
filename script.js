const toggleButton = document.getElementById('toggleButton');

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

fetch("https://api.open-meteo.com/v1/forecast?latitude=52.37&longitude=4.90&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max&timezone=Europe%2FAmsterdam")
  .then(res => res.json())
  .then(data => {
    const container = document.getElementById("daily-forecast");
    container.innerHTML = "";

    const dates = data.daily.time;
    const tempMin = data.daily.temperature_2m_min;
    const tempMax = data.daily.temperature_2m_max;
    const rainMax = data.daily.precipitation_probability_max;
    const uvMax = data.daily.uv_index_max;

    for (let i = 0; i < 5; i++) {
        const date = new Date(dates[i]);
        const dayName = date.toLocaleDateString('en-EN', { weekday: 'short', month: 'short', day: 'numeric' });

        const rainIcon = rainMax[i] >= 35 ? "☔" : "🌂";

        const div = document.createElement("div");
        div.className = "weather-item";
        div.innerHTML = `
            <strong>${dayName}</strong><br>
            Temp: ${Math.round(tempMin[i])}/${Math.round(tempMax[i])}°C<br>
            ${rainIcon}: ${rainMax[i]}%<br>
            UV Index: ${uvMax[i]}
        `;
        container.appendChild(div);
    }
  })
  .catch(err => {
    document.getElementById("daily-forecast").textContent = "Unable to load forecast.";
    console.error(err);
  });



fetch("https://api.open-meteo.com/v1/forecast?latitude=52.37&longitude=4.90&hourly=temperature_2m,precipitation_probability,precipitation,windspeed_10m,winddirection_10m,uv_index&timezone=Europe%2FAmsterdam")
  .then(res => res.json())
  .then(data => {
    const forecastDiv = document.getElementById("hourly-forecast");
    forecastDiv.innerHTML = "";

    const hours = data.hourly.time;                   
    const temps = data.hourly.temperature_2m;       
    const rainProbs = data.hourly.precipitation_probability; 
    const rainAmounts = data.hourly.precipitation;
    const windSpeeds = data.hourly.windspeed_10m;
    const windDirs = data.hourly.winddirection_10m;
    const uvIndex = data.hourly.uv_index;

    const now = new Date();
    const currentTime = now.getTime();

    // End time: next day 02:00
    const end = new Date();
    end.setDate(end.getDate() + 1);
    end.setHours(2, 0, 0, 0);
    const endTime = end.getTime();

    for (let i = 0; i < hours.length; i++) {
        const date = new Date(hours[i]);
        const hour = date.getHours();

        if (date.getTime() >= currentTime && date.getTime() <= endTime) {
            const temp = Math.round(temps[i]);
            const rainProb = rainProbs[i];
            const rainAmount = rainAmounts[i]; // mm
            const windSpeed = Math.round(windSpeeds[i]);   // km/h
            const uv = uvIndex[i];

            const rainIcon = rainProb >= 35 ? "☔" : "🌂";

            const div = document.createElement("div");
            div.className = "weather-item";
            div.innerHTML = `
                <strong>${hour}:00</strong><br>
                Temp: ${temp}°C<br>
                ${rainIcon}: ${rainProb}% (${rainAmount} mm)<br>
                🍃: ${windSpeed} km/h<br>
                UV Index: ${uv}
            `;
            forecastDiv.appendChild(div);
        }
    }
  })
  .catch(err => {
    document.getElementById("hourly-forecast").textContent = "Unable to load forecast.";
    console.error(err);
  });


