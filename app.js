
// Globalne zmienne stanu aplikacji
let port = null;
let writer = null;
let isConnected = false;
let isPowerOn = false;

let currentMode = 0;
let brightness = 80;
let colorRGB = { r: 255, g: 0, b: 0 };
let colorHEX = "#FF0000";
let animSpeed = 50;
let demoDuration = 10;
let numLeds = 8;

// Animacja podglądu diod
let previewAnimId = null;
let previewGHue = 0;
let previewFrame = 0;
let lastPreviewUpdate = 0;

// Elementy DOM
const connectBtn = document.getElementById('connect-btn');
const masterPowerBtn = document.getElementById('master-power-btn');
const masterPowerBtnLg = document.getElementById('master-power-btn-2');
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
    setupCopyButton();
    startPreviewAnimation();
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
    connectBtn.addEventListener('click', toggleConnection);
    masterPowerBtn.addEventListener('click', togglePower);
    masterPowerBtnLg.addEventListener('click', togglePower);

    ledCountInput.addEventListener('input', (e) => {
        numLeds = Math.min(256, Math.max(1, parseInt(e.target.value) || 8));
        headerTitle.textContent = `Panel Taśmy LED (${numLeds}x WS2812)`;
        renderLEDPreview();
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
            demoTimeSlider.disabled = false;
            demoControls.style.opacity = '1';
        } else {
            demoControls.classList.add('hidden');
            demoTimeSlider.disabled = true;
            demoControls.style.opacity = '0.5';
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

// Kopiowanie kodu firmware do schowka
function setupCopyButton() {
    const copyBtn = document.getElementById('copy-firmware-btn');
    if (!copyBtn) return;

    copyBtn.addEventListener('click', async () => {
        const codeBlock = document.querySelector('.firmware-code code');
        if (!codeBlock) return;

        const text = codeBlock.textContent || codeBlock.innerText;
        if (!text) return;

        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                copyBtn.textContent = 'Skopiowano!';
            } else {
                // Fallback dla starszych przeglądarek
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                copyBtn.textContent = 'Skopiowano!';
            }
        } catch (err) {
            console.error('Błąd kopiowania:', err);
            alert('Nie udało się skopiować kodu. Spróbuj zaznaczyć i skopiować ręcznie.');
            return;
        }

        setTimeout(() => {
            copyBtn.textContent = '📋 Kopiuj kod';
        }, 2000);
    });
}

// Główny wyłącznik zasilania
function togglePower() {
    isPowerOn = !isPowerOn;
    if (isPowerOn) {
        masterPowerBtn.textContent = 'ON';
        masterPowerBtn.className = 'power-btn on';
        masterPowerBtnLg.textContent = '⏻ WŁĄCZONY';
        masterPowerBtnLg.className = 'power-btn-lg on';
    } else {
        masterPowerBtn.textContent = 'OFF';
        masterPowerBtn.className = 'power-btn off';
        masterPowerBtnLg.textContent = '⏻ WYŁĄCZONY';
        masterPowerBtnLg.className = 'power-btn-lg off';
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
}

// Pętla animacji podglądu diod
function startPreviewAnimation() {
    if (previewAnimId) cancelAnimationFrame(previewAnimId);
    
    function animate(timestamp) {
        if (timestamp - lastPreviewUpdate >= animSpeed) {
            lastPreviewUpdate = timestamp;
            previewFrame++;
            previewGHue = (previewGHue + 1) % 256;
            renderPreviewEffect();
        }
        previewAnimId = requestAnimationFrame(animate);
    }
    
    previewAnimId = requestAnimationFrame(animate);
}

// Renderowanie efektu w podglądzie
function renderPreviewEffect() {
    if (!isPowerOn) {
        updateLEDPreviewColors();
        return;
    }
    
    const effBrightness = brightness / 100;
    
    switch (currentMode) {
        case 0: // Static
            updateLEDPreviewColors();
            break;
            
        case 1: // Demo - przełączanie efektów
            renderDemoPreview(effBrightness);
            break;
            
        case 2: // Rainbow
            renderRainbowPreview(effBrightness);
            break;
            
        case 3: // Rainbow with Glitter
            renderRainbowGlitterPreview(effBrightness);
            break;
            
        case 4: // Confetti
            renderConfettiPreview(effBrightness);
            break;
            
        case 5: // Sinelon
            renderSinelonPreview(effBrightness);
            break;
            
        case 6: // BPM
            renderBPMPreview(effBrightness);
            break;
            
        case 7: // Juggle
            renderJugglePreview(effBrightness);
            break;
            
        case 8: // Fire2012
            renderFirePreview(effBrightness);
            break;
            
        case 9: // Breathing
            renderBreathingPreview(effBrightness);
            break;
            
        case 10: // Theater Chase
            renderTheaterChasePreview(effBrightness);
            break;
            
        case 11: // Sparkle
            renderSparklePreview(effBrightness);
            break;
            
        case 12: // Color Palette Cycle
            renderPaletteCyclePreview(effBrightness);
            break;
            
        case 13: // Strobe
            renderStrobePreview(effBrightness);
            break;
            
        default:
            updateLEDPreviewColors();
    }
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

// Implementacje efektów dla podglądu
function renderRainbowPreview(brightness) {
    for (let i = 0; i < numLeds; i++) {
        const hue = (previewGHue + i * 7) % 256;
        const rgb = hslToRgb(hue / 256, 1, 0.5);
        setLedColor(i + 1, rgb.r, rgb.g, rgb.b, brightness);
    }
}

function renderRainbowGlitterPreview(brightness) {
    renderRainbowPreview(brightness);
    if (Math.random() < 0.1) {
        const idx = Math.floor(Math.random() * numLeds) + 1;
        setLedColor(idx, 255, 255, 255, brightness);
    }
}

function renderConfettiPreview(brightness) {
    for (let i = 1; i <= numLeds; i++) {
        const hue = (previewGHue + i * 13) % 256;
        const rgb = hslToRgb(hue / 256, 0.8, 0.6);
        setLedColor(i, rgb.r, rgb.g, rgb.b, brightness * 0.8);
    }
}

function renderSinelonPreview(brightness) {
    const pos = Math.floor((Math.sin(previewFrame * 0.1) + 1) / 2 * (numLeds - 1));
    for (let i = 1; i <= numLeds; i++) {
        const dist = Math.abs(i - 1 - pos);
        const intensity = Math.max(0, 1 - dist / 3);
        const rgb = hslToRgb(previewGHue / 256, 1, 0.5);
        setLedColor(i, rgb.r * intensity, rgb.g * intensity, rgb.b * intensity, brightness);
    }
}

function renderBPMPreview(brightness) {
    const beat = (Math.sin(previewFrame * 0.2) + 1) / 2;
    for (let i = 1; i <= numLeds; i++) {
        const hue = (previewGHue + i * 2) % 256;
        const rgb = hslToRgb(hue / 256, 1, beat * 0.8);
        setLedColor(i, rgb.r, rgb.g, rgb.b, brightness);
    }
}

function renderJugglePreview(brightness) {
    for (let i = 1; i <= numLeds; i++) {
        const hue = (previewGHue + i * 32) % 256;
        const rgb = hslToRgb(hue / 256, 1, 0.5);
        const pos = Math.floor((Math.sin(previewFrame * 0.15 + i) + 1) / 2 * (numLeds - 1));
        const dist = Math.abs(i - 1 - pos);
        const intensity = Math.max(0, 1 - dist / 2);
        setLedColor(i, rgb.r * intensity, rgb.g * intensity, rgb.b * intensity, brightness);
    }
}

function renderFirePreview(brightness) {
    for (let i = 1; i <= numLeds; i++) {
        const heat = Math.random();
        const rgb = hslToRgb(0.05 + heat * 0.08, 1, heat * 0.6);
        setLedColor(i, rgb.r, rgb.g, rgb.b, brightness);
    }
}

function renderBreathingPreview(brightness) {
    const breath = (Math.sin(previewFrame * 0.05) + 1) / 2;
    const r = Math.round(colorRGB.r * breath);
    const g = Math.round(colorRGB.g * breath);
    const b = Math.round(colorRGB.b * breath);
    for (let i = 1; i <= numLeds; i++) {
        setLedColor(i, r, g, b, brightness);
    }
}

function renderTheaterChasePreview(brightness) {
    const step = previewFrame % 3;
    for (let i = 1; i <= numLeds; i++) {
        if ((i - 1 + step) % 3 === 0) {
            setLedColor(i, colorRGB.r, colorRGB.g, colorRGB.b, brightness);
        } else {
            setLedColor(i, 0, 0, 0, 0);
        }
    }
}

function renderSparklePreview(brightness) {
    for (let i = 1; i <= numLeds; i++) {
        setLedColor(i, colorRGB.r * 0.2, colorRGB.g * 0.2, colorRGB.b * 0.2, brightness * 0.3);
    }
    if (Math.random() < 0.3) {
        const idx = Math.floor(Math.random() * numLeds) + 1;
        setLedColor(idx, colorRGB.r, colorRGB.g, colorRGB.b, brightness);
    }
}

function renderPaletteCyclePreview(brightness) {
    for (let i = 1; i <= numLeds; i++) {
        const hue = (previewGHue + i * 8) % 256;
        const rgb = hslToRgb(hue / 256, 0.8, 0.5);
        setLedColor(i, rgb.r, rgb.g, rgb.b, brightness);
    }
}

function renderStrobePreview(brightness) {
    const isOn = previewFrame % 4 < 2;
    for (let i = 1; i <= numLeds; i++) {
        if (isOn) {
            setLedColor(i, colorRGB.r, colorRGB.g, colorRGB.b, brightness);
        } else {
            setLedColor(i, 0, 0, 0, 0);
        }
    }
}

function renderDemoPreview(brightness) {
    // Demo przełącza co kilka sekund - uproszczone: co 180 klatek (~3s przy 60fps)
    const demoStep = Math.floor(previewFrame / 180) % 12 + 2;
    const savedMode = currentMode;
    currentMode = demoStep;
    renderPreviewEffect();
    currentMode = savedMode;
}

function setLedColor(index, r, g, b, brightness) {
    const circle = document.getElementById(`led-circle-${index}`);
    if (circle) {
        const ri = Math.round(r * brightness);
        const gi = Math.round(g * brightness);
        const bi = Math.round(b * brightness);
        circle.style.backgroundColor = `rgb(${ri}, ${gi}, ${bi})`;
        circle.style.boxShadow = brightness > 0 ? `0 0 12px rgb(${ri}, ${gi}, ${bi})` : 'none';
    }
}

// Konwersja HSL do RGB
function hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

async function toggleConnection() {
    if (isConnected) {
        await disconnectSerial();
    } else {
        await connectSerial();
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
        
        writer = port.writable.getWriter();
        
        isConnected = true;
        updateConnectionUI();
        
        sendDataToArduino();
    } catch (err) {
        console.error('Błąd połączenia USB:', err);
        connectionStatus.textContent = 'Błąd połączenia z portem USB';
    }
}

async function disconnectSerial() {
    try {
        if (writer) {
            writer.releaseLock();
            writer = null;
        }
        if (port) {
            await port.close();
            port = null;
        }
        isConnected = false;
        updateConnectionUI();
    } catch (err) {
        console.error('Błąd rozłączania:', err);
    }
}

function updateConnectionUI() {
    if (isConnected) {
        connectBtn.textContent = 'Rozłącz';
        connectBtn.style.backgroundColor = '#ef4444';
        connectionStatus.textContent = 'Połączono z Arduino USB • 9600 baud • Transmisja aktywna';
    } else {
        connectBtn.textContent = '🔌 Połącz z Arduino (USB)';
        connectBtn.style.backgroundColor = '';
        connectionStatus.textContent = 'Rozłączono • Kliknij "Połącz z Arduino (USB)"';
    }
}

// Wysyłanie ramki bajtów przez USB do Arduino
async function sendDataToArduino() {
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
