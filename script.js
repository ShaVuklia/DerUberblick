// CONFIG
export const LOCATION = {
  latitude: 52.37,
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

// DOM REFERENCES
const toggleButton = document.getElementById("toggleButton");
const timeZonesDiv = document.getElementById("timeZones");

// FEATURE FUNCTIONS
// Function to apply the dark/light theme
function applyMode(isDark) {
  document.body.classList.toggle('dark-mode', isDark);
  document.body.classList.toggle('light-mode', !isDark);
  toggleButton.textContent = isDark ? 'Hell' : 'Dunkel';
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
const prefersDarkQuery = window.matchMedia('(prefers-color-scheme: dark)');

prefersDarkQuery.addEventListener('change', (e) => {
  applyMode(e.matches);
});

// INIT
function init() {
  getTimeZones();
}

applyMode(prefersDarkQuery.matches);

init();
setInterval(getTimeZones, 1000);

