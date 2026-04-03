// TO DO:
// - Add crtl+z and crtl+y functionality in markers

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
        addMarkerToMap(map, lat, lng, text, false)   // showTextbox
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

// CREATE MARKER
function createMarker(map, lat, lng, text = '') {
    const marker = L.marker([lat, lng]).addTo(map);
    marker.text = text;
    return marker;
}

// CREATE FLOATING TEXTBOX
// TO DO: possibly split up this function?
function createTextboxForMarker(map, marker) {
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
        zIndex: 1000,                       // ensures it appears above other map elements
        display: 'flex',
        gap: '5px',
        alignItems: 'center'
    });

    const input = document.createElement('input');
    input.type = 'text';
    input.value = marker.text;
    input.placeholder = 'Location';

    function resizeInput() {
        input.style.width = Math.max(input.value.length, 9) + 'ch';
    }
    input.addEventListener('input', resizeInput);
    resizeInput();

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

    // OK button or Enter key
    function saveText() {
        marker.text = input.value;
        saveMarker(marker.getLatLng().lat, marker.getLatLng().lng, marker.text);
        container.remove();
        currentTextbox = null;
    }

    okBtn.onclick = saveText;
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') saveText();
    });

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

// ADD MARKER TO MAP
function addMarkerToMap(map, lat, lng, initialText = '', showTextbox = false) {
    const marker = createMarker(map, lat, lng, initialText);

    if (showTextbox) {
        createTextboxForMarker(map, marker);
    }

    // Click marker to edit
    marker.on('click', () => createTextboxForMarker(map, marker));
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
    addMarkerToMap(map, lat, lng, '', true);   // showTextbox = true
});


// Trigger OK/Delete buttons when Enter/Backspace is pressed, if a textbox is open
document.addEventListener('keydown', (e) => {
    if (!currentTextbox) return; // only act if a textbox is open

    if (e.key === 'Enter') {
        e.preventDefault(); // prevent default Enter behavior
        const okBtn = currentTextbox.querySelector('button'); // first button is OK
        if (okBtn) okBtn.click();
    }

    if (e.key === 'Backspace') {
        e.preventDefault(); // prevent default backspace behavior
        const delBtn = currentTextbox.querySelectorAll('button')[1]; // second button is Delete
        if (delBtn) delBtn.click();
    }
});

// INITIALISE 
loadMarkers(map);

// Force recalculation
window.addEventListener('load', () => {
  map.invalidateSize();
});