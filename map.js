// TO DO:

// make map on separate page [done]
// if i click on a marker, then the page jumps up -> fixed with: `preventScroll: true` [done]
// Add crtl+z and crtl+y functionality in markers

import { LOCATION } from './script.js';

// MAP SETUP
let map;

function initMap() {
    map = L.map('map').setView([LOCATION.latitude, LOCATION.longitude], 13);

    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
    });

    tiles.addTo(map);

    loadMarkers(map);

    // MAP CLICK HANDLERS
    // Dismiss floating textbox when clicking anywhere on the map
    map.on('click', (event) => {
        // if click was inside the current textbox, do nothing
        if (currentTextbox && !currentTextbox.contains(event.originalEvent.target)) {
            currentTextbox.remove();
            currentTextbox = null;
            event.originalEvent.preventDefault(); // stops any default action
        }
    });

    // Right-click → new marker → show textbox immediately
    map.on('contextmenu', (event) => {
        event.originalEvent.preventDefault();

        if (currentTextbox) {
            currentTextbox.remove();
            currentTextbox = null;
            return;
        }

        const { lat, lng } = event.latlng;
        addMarkerToMap(map, lat, lng, '', true);   // showTextbox = true
    });

}

// LOCALSTORAGE FUNCTIONS
function loadMarkers(map) {
    const saved = JSON.parse(localStorage.getItem('markers') || '[]');
    saved.forEach(({ lat, lng, text }) => 
        addMarkerToMap(map, lat, lng, text, false)   // showTextbox
    );
}

function saveMarker(lat, lng, text) {
    const saved = JSON.parse(localStorage.getItem('markers') || '[]');
    const index = saved.findIndex(marker => marker.lat === lat && marker.lng === lng);
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

function createTextboxInput(text) {
    const input = document.createElement('input');

    input.type = 'text';
    input.value = text;
    input.placeholder = 'Location';

    function resizeInput() {
        input.style.width = Math.max(input.value.length, 9) + 'ch';
    }

    input.addEventListener('input', resizeInput);

    resizeInput();

    return input;
}

function createButton(text) {
    const btn = document.createElement('button');
    btn.textContent = text;
    return btn;
}

// CREATE FLOATING TEXTBOX
function createTextboxForMarker(map, marker) {
    // Remove existing textbox
    if (currentTextbox) currentTextbox.remove();

    const container = document.createElement('div');
    container.id = 'marker-editor';
    currentTextbox = container;

    // Create input, OK/Delete buttons
    const input = createTextboxInput(marker.text);
    const okBtn = createButton('Ok');
    const delBtn = createButton('Del');

    container.append(input, okBtn, delBtn);
    map.getPanes().overlayPane.appendChild(container);

    // auto-focus so cursor is immediately active without scrolling the page
    input.focus({ preventScroll: true });

    // Position textbox near marker
    function updatePosition() {
        const pos = map.latLngToLayerPoint(marker.getLatLng());
        container.style.left = pos.x + 10 + 'px';
        container.style.top = pos.y - 20 + 'px';
    }
    updatePosition();
    map.on('zoom move', updatePosition);

    function closeTextbox() {
        map.off('zoom move', updatePosition);

        container.remove();

        if (currentTextbox === container) {
            currentTextbox = null;
        }
    }

    function saveText() {
        marker.text = input.value;
        const { lat, lng } = marker.getLatLng();
        saveMarker(lat, lng, marker.text);
        closeTextbox();
    }

    okBtn.onclick = saveText;
    input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') saveText();
    });

    // Delete button
    delBtn.onclick = () => {
        map.removeLayer(marker);
        const { lat, lng } = marker.getLatLng();
        deleteMarker(lat, lng);
        closeTextbox();
    };

    // Remove textbox if marker is removed
    marker.on('remove', closeTextbox);
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

// Trigger OK/Delete buttons when Enter/Backspace is pressed, if a textbox is open
// todo: why is this separate and not part of a function?
document.addEventListener('keydown', (event) => {
    if (!currentTextbox) return; // only act if a textbox is open

    if (event.key === 'Enter') {
        event.preventDefault(); // prevent default Enter behavior
        const okBtn = currentTextbox.querySelector('button'); // first button is OK
        if (okBtn) okBtn.click();
    }

    if (event.key === 'Backspace') {

        // if user is actively typing in the input, let Backspace behave normally
        if (document.activeElement.tagName === 'INPUT') {
            return;
        }

        event.preventDefault();

        const delBtn = currentTextbox.querySelectorAll('button')[1];
        if (delBtn) delBtn.click();
    }
});

window.initMap = initMap;
window.map = null;


