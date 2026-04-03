import { LOCATION } from './script.js';

// MAP SETUP
const map = L.map('map').setView([LOCATION.latitude, LOCATION.longitude], 13);

const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});

tiles.addTo(map);

// LOCALSTORAGE FUNCTIONS
function loadMarkers(map) {
    const saved = JSON.parse(localStorage.getItem('markers') || '[]');
    saved.forEach(({ lat, lng, text }) => 
        addMarkerToMap(
            map, 
            lat, 
            lng, 
            text, 
            false // showTextbox = false
        )
    );
}

function saveMarker(lat, lng, text) {
    const saved = JSON.parse(localStorage.getItem('markers') || '[]');
    const index = saved.findIndex(m => m.lat === lat && m.lng === lng);
    if (index !== -1) {
        saved[index].text = text;
    } else {
        saved.push({ lat, lng, text });
    }
    localStorage.setItem('markers', JSON.stringify(saved));
}

function deleteMarker(lat, lng) {
    let saved = JSON.parse(localStorage.getItem('markers') || '[]');
    saved = saved.filter(m => m.lat !== lat || m.lng !== lng);
    localStorage.setItem('markers', JSON.stringify(saved));
}

// GLOBAL REFERENCE TO CURRENT TEXTBOX
let currentTextbox = null;

// MARKER UTILITY WITH FLOATING TEXTBOX
function addMarkerToMap(map, lat, lng, initialText = '', showTextbox = false) {
    const marker = L.marker([lat, lng]).addTo(map);

    // Store text on the marker
    marker.text = initialText;

    // Show floating textbox for marker
    function showFloatingTextbox() {
        // Remove existing textbox
        if (currentTextbox) currentTextbox.remove();

        const container = document.createElement('div');
        container.id = 'marker-editor';
        currentTextbox = container;

        Object.assign(container.style, {
            position: 'absolute',
            background: 'white',
            padding: '5px',
            border: '1px solid #ccc',
            borderRadius: '5px',
            zIndex: 1000,
            display: 'flex',
            gap: '5px',
            alignItems: 'center'
        });

        // Input
        const input = document.createElement('input');
        input.type = 'text';
        input.value = marker.text;
        input.placeholder = 'Location';

        function resizeInput() {
            input.style.width = Math.max(input.value.length, 9) + 'ch';
        }
        input.addEventListener('input', resizeInput);
        resizeInput();

        // Buttons
        const okBtn = document.createElement('button');
        okBtn.textContent = 'Ok';
        const delBtn = document.createElement('button');
        delBtn.textContent = 'Del';

        container.append(input, okBtn, delBtn);
        map.getPanes().overlayPane.appendChild(container);

        // Position textbox near marker
        function updatePosition() {
            const pos = map.latLngToLayerPoint(marker.getLatLng());
            container.style.left = pos.x + 10 + 'px';
            container.style.top = pos.y - 20 + 'px';
        }
        updatePosition();
        map.on('zoom move', updatePosition);

        // OK button: save text
        okBtn.onclick = () => {
            marker.text = input.value;
            saveMarker(marker.getLatLng().lat, marker.getLatLng().lng, marker.text);
            container.remove();
            currentTextbox = null;
        };

        // Delete button
        delBtn.onclick = () => {
            map.removeLayer(marker);
            deleteMarker(marker.getLatLng().lat, marker.getLatLng().lng);
            container.remove();
            currentTextbox = null;
        };

        // Remove textbox if marker is removed
        marker.on('remove', () => {
            container.remove();
            if (currentTextbox === container) currentTextbox = null;
        });
    }

    // Only show textbox immediately if requested
    if (showTextbox) {
        showFloatingTextbox();
    }

    // Click marker to edit
    marker.on('click', showFloatingTextbox);
}

// MAP CLICK HANDLERS
// Dismiss floating textbox when clicking anywhere on the map
map.on('click', (e) => {
    // if click was inside the current textbox, do nothing
    if (currentTextbox && !currentTextbox.contains(e.originalEvent.target)) {
        currentTextbox.remove();
        currentTextbox = null;
        e.originalEvent.preventDefault(); // stops any default action
    }
});

// Right-click → new marker → show textbox immediately
map.on('contextmenu', (e) => {
    if (currentTextbox) {
        currentTextbox.remove();
        currentTextbox = null;
        e.originalEvent.preventDefault();
        return;
    }

    const { lat, lng } = e.latlng;
    addMarkerToMap(map, lat, lng, '', true); // <--- showTextbox = true
});

// INITIALISE 
loadMarkers(map);

// Force recalculation
window.addEventListener('load', () => {
  map.invalidateSize();
});