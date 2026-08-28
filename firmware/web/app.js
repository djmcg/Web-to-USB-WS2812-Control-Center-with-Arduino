// Globalne zmienne stanu aplikacji
let port = null;
let writer = null;
let isConnected = false;
let isPowerOn = true;

let currentMode = 0;
let brightness = 80;
let colorRGB = { r: 255, g: 0, b: 0 };
let colorHEX = "#FF0000";
let animSpeed = 50;
let demoDuration = 10;
let numLeds = 8;
let selectedPin = 3;

// Elementy DOM
const connectBtn = document.getElementById('connect-btn');
const masterPowerBtn = document.getElementById('master-power-btn');
const pinSelect = document.getElementById('pin-select');
const ledCountInput = document.getElementById('led-count');
const headerTitle = document.getElementById('header-title');
const connectionStatus = document.getElementById('connection-status');

const colorWheel = document.getElementById('color-wheel');
const hexInput = document.getElementById('hex-input');
const rgbDisplay = document.getElementById('rgb-display');
const presetBtns = document.querySelectorAll('.preset-btn');

const brightnessSlider = document.getElementById('brightness-slider');
const brightnessVal = document.getElementById('brightness-val');

const effectSelect = document.getElementById('effect-select');
const speedSlider = document.getElementById('speed-slider');
const speedVal = document.getElementById('speed-val');
const demoControls = document.getElementById('demo-controls');
const demoTimeSlider = document.getElementById('demo-time-slider');
const demoTimeVal = document.getElementById('demo-time-val');

const ledPreviewContainer = document.getElementById('led-preview-container');

// Kontekst Canvas dla koła kolorów
const ctx = colorWheel.getContext('2d');

// Inicjalizacja interfejsu
window.addEventListener('DOMContentLoaded', () => {
    drawColorWheel();
    renderLEDPreview();
    setupEventListeners();
});

// Rysowanie gradientowego koła kolorów
function drawColorWheel() {
    const radius = colorWheel.width / 2;
    const x = radius;
    const y = radius;

    for (let angle = 0; angle < 360; angle += 1) {
        const startAngle = (angle - 2) * Math.PI / 180;
        const endAngle = (angle + 2) * Math.PI / 180;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.arc(x, y, radius, startAngle, endAngle);
        ctx.closePath();

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(1, `hsl(${angle}, 100%, 50%)`);
        ctx.fillStyle = gradient;
        ctx.fill();
    }
}

// Obsługa zdarzeń UI
function setupEventListeners() {
    connectBtn.addEventListener('click', connectSerial);
    masterPowerBtn.addEventListener('click', togglePower);

    ledCountInput.addEventListener('input', (e) => {
        numLeds = Math.min(256, Math.max(1, parseInt(e.target.value) || 8));
        headerTitle.textContent = `Panel Taśmy LED (${numLeds}x WS2812)`;
        renderLEDPreview();
        sendDataToArduino();
    });

    pinSelect.addEventListener('change', (e) => {
        selectedPin = parseInt(e.target.value);
        sendDataToArduino();
    });

    // Przeciąganie i wybieranie barwy z koła kolorów
    let isDragging = false;
    const pickColor = (e) => {
        const rect = colorWheel.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const imgData = ctx.getImageData(x, y, 1, 1).data;

        if (imgData[3] > 0) {
            colorRGB = { r: imgData[0], g: imgData[1], b: imgData[2] };
            colorHEX = rgbToHex(colorRGB.r, colorRGB.g, colorRGB.b);
            updateColorDisplays();
            sendDataToArduino();
        }
    };

    colorWheel.addEventListener('mousedown', (e) => { isDragging = true; pickColor(e); });
    window.addEventListener('mousemove', (e) => { if (isDragging) pickColor(e); });
    window.addEventListener('mouseup', () => { isDragging = false; });

    colorWheel.addEventListener('touchstart', (e) => { isDragging = true; pickColor(e.touches[0]); });
    window.addEventListener('touchmove', (e) => { if (isDragging) pickColor(e.touches[0]); });
    window.addEventListener('touchend', () => { isDragging = false; });

    // Wpisywanie kodu HEX
    hexInput.addEventListener('change', (e) => {
        let hex = e.target.value;
        if (!hex.startsWith('#')) hex = '#' + hex;
        if (/^#[0-9A-F]{6}$/i.test(hex)) {
            colorHEX = hex;
            colorRGB = hexToRgb(hex);
            updateColorDisplays();
            sendDataToArduino();
        }
    });

    // Szybkie presety
    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const hex = btn.getAttribute('data-color');
            colorHEX = hex;
            colorRGB = hexToRgb(hex);
            updateColorDisplays();
            sendDataToArduino();
        });
    });

    // Suwak jasności
    brightnessSlider.addEventListener('input', (e) => {
        brightness = parseInt(e.target.value);
        brightnessVal.textContent = `${brightness}%`;
        sendDataToArduino();
    });

    // Lista wyboru efektu
    effectSelect.addEventListener('change', (e) => {
        currentMode = parseInt(e.target.value);
        if (currentMode === 1) {
            demoControls.classList.remove('hidden');
        } else {
            demoControls.classList.add('hidden');
        }
        sendDataToArduino();
    });

    // Suwak szybkości animacji
    speedSlider.addEventListener('input', (e) => {
        animSpeed = parseInt(e.target.value);
        speedVal.textContent = `${animSpeed}ms`;
        sendDataToArduino();
    });

    // Suwak czasu zmiany w trybie DEMO
    demoTimeSlider.addEventListener('input', (e) => {
        demoDuration = parseInt(e.target.value);
        demoTimeVal.textContent = `${demoDuration}s`;
        sendDataToArduino();
    });
}

// Główny wyłącznik zasilania
function togglePower() {
    isPowerOn = !isPowerOn;
    if (isPowerOn) {
        masterPowerBtn.textContent = 'ON';
        masterPowerBtn.className = 'power-btn on';
    } else {
        masterPowerBtn.textContent = 'OFF';
        masterPowerBtn.className = 'power-btn off';
    }
    sendDataToArduino();
}

// Konwersje i aktualizacje formatów barwnych
function updateColorDisplays() {
    hexInput.value = colorHEX.toUpperCase();
    rgbDisplay.textContent = `RGB(${colorRGB.r}, ${colorRGB.g}, ${colorRGB.b})`;
    updateLEDPreviewColors();
}

function rgbToHex(r, g, b) {
    return "#" + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}

// Renderowanie dynamicznej taśmy LED na stronie
function renderLEDPreview() {
    ledPreviewContainer.innerHTML = '';
    for (let i = 1; i <= numLeds; i++) {
        const item = document.createElement('div');
        item.className = 'led-item';
        
        const circle = document.createElement('div');
        circle.className = 'led-circle';
        circle.id = `led-circle-${i}`;
        
        const label = document.createElement('span');
        label.className = 'led-label';
        label.textContent = `#${i}`;
        
        item.appendChild(circle);
        item.appendChild(label);
        ledPreviewContainer.appendChild(item);
    }
    updateLEDPreviewColors();
}

function updateLEDPreviewColors() {
    const effBrightness = isPowerOn ? (brightness / 100) : 0;
    const r = Math.round(colorRGB.r * effBrightness);
    const g = Math.round(colorRGB.g * effBrightness);
    const b = Math.round(colorRGB.b * effBrightness);

    for (let i = 1; i <= numLeds; i++) {
        const circle = document.getElementById(`led-circle-${i}`);
        if (circle) {
            circle.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
            circle.style.boxShadow = effBrightness > 0 ? `0 0 12px rgb(${r}, ${g}, ${b})` : 'none';
        }
    }
}

// Nawiązywanie połączenia Web Serial API
async function connectSerial() {
    if (!('serial' in navigator)) {
        alert('Przeglądarka nie wspiera Web Serial API! Użyj najnowszego Google Chrome, MS Edge lub Opera.');
        return;
    }

    try {
        port = await navigator.serial.requestPort();
        await port.open({ baudRate: 9600 });
        
        const textEncoder = new TransformStream();
        textEncoder.readable.pipeTo(port.writable);
        writer = textEncoder.writable.getWriter();
        
        isConnected = true;
        connectBtn.textContent = '✅ Połączono';
        connectBtn.style.backgroundColor = '#10b981';
        connectionStatus.textContent = 'Połączono z Arduino USB • 9600 baud • Transmisja aktywna';
        
        sendDataToArduino();
    } catch (err) {
        console.error('Błąd połączenia USB:', err);
        connectionStatus.textContent = 'Błąd połączenia z portem USB';
    }
}

// Wysyłanie ramki bajtów przez USB do Arduino
async function sendDataToArduino() {
    updateLEDPreviewColors();

    if (!isConnected || !writer) return;

    const effBrightness = isPowerOn ? Math.round((brightness / 100) * 255) : 0;
    const speedH = (animSpeed >> 8) & 0xFF;
    const speedL = animSpeed & 0xFF;

    const packet = new Uint8Array([
        0xAA,           // Header
        currentMode,    // Mode / Efekt
        effBrightness,  // Brightness (0..255)
        colorRGB.r,     // Red
        colorRGB.g,     // Green
        colorRGB.b,     // Blue
        speedH,         // Speed High Byte
        speedL,         // Speed Low Byte
        demoDuration,   // Demo Switch Interval
        numLeds         // Number of LEDs
    ]);

    try {
        await writer.write(packet);
    } catch (err) {
        console.error('Błąd wysyłania ramki po USB:', err);
    }
}
