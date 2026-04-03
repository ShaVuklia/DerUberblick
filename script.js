// CONFIG
export const LOCATION = {
  latitude: 52.37,
  longitude: 4.90,
  timezone: "Europe/Amsterdam"
};

// DOM REFERENCES
const toggleButton = document.getElementById("toggleButton");

// Listen for system preference changes
const prefersDarkQuery = window.matchMedia('(prefers-color-scheme: dark)');

// EVENTS
// Toggle button behavior for manual override
toggleButton.addEventListener('click', () => {
  const isDark = document.body.classList.contains('dark-mode');
  applyMode(!isDark);
});

prefersDarkQuery.addEventListener('change', (e) => {
  applyMode(e.matches);
});

// Function to apply the dark/light theme
function applyMode(isDark) {
  document.body.classList.toggle('dark-mode', isDark);
  document.body.classList.toggle('light-mode', !isDark);
  toggleButton.textContent = isDark ? 'Hell' : 'Dunkel';
}

// INITIALISE
applyMode(prefersDarkQuery.matches);


