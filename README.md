# DerUberblick

A web application providing an overview of weather, time zones, and a customizable map for Amsterdam.

## Features

- **Interactive Map**: Add, edit, and delete markers on the map. Markers are saved locally in your browser.
  - Right-click on the map to add a new marker.
  - Click on an existing marker to edit its text or delete it.
- **Weather Forecast**: Displays daily and hourly weather forecasts for Amsterdam using the Open-Meteo API.
- **Time Zones**: Shows current time in multiple locations worldwide.
- **Dark/Light Mode**: Toggle between dark and light themes based on system preference or manual override.

## Technologies Used

- **HTML5**: Structure of the web page.
- **CSS3**: Styling and responsive design.
- **JavaScript (ES6 Modules)**: Functionality for map, weather, and time zones.
- **Leaflet.js**: Interactive map library.
- **Open-Meteo API**: Free weather data API.

## How to Use

1. Clone or download this repository to your local machine.
2. Open `index.html` in a modern web browser (Chrome, Firefox, etc.).
3. The page will load with the map centered on Amsterdam.
4. Interact with the map as described in Features.
5. Weather data and time zones update automatically.
6. Use the toggle button to switch between dark and light modes.

## File Structure

- `index.html`: Main HTML file containing the page structure.
- `styles.css`: CSS styles for layout, themes, and responsiveness.
- `script.js`: Handles time zones display and theme toggling.
- `weather.js`: Fetches and displays weather data from Open-Meteo API.
- `map.js`: Manages the Leaflet map, markers, and local storage.
- `locations.txt`: (Optional) List of locations, if used.
- `README.md`: This file.

## Requirements

- A modern web browser with JavaScript enabled.
- Internet connection for weather data and map tiles.

## Notes

- Marker data is stored in the browser's localStorage, so it persists between sessions.
- Weather forecasts are for Amsterdam and update periodically.
- The app is responsive and works on mobile devices.

## Contributing

Feel free to fork the repository and submit pull requests for improvements or bug fixes.

## License

This project is open-source. Please check for any specific licensing if applicable.
