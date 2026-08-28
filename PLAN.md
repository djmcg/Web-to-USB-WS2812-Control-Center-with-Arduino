# 🚀 Specyfikacja i Plan Projektu: Web-to-USB WS2812 Control Center

Uniwersalne narzędzie webowe w stylu Dark Mode do sterowania taśmami adresowalnymi LED (WS2812B) podłączonymi do Arduino po USB, bezpośrednio z przeglądarki (Web Serial API).

---

## 🏗️ Architektura Systemu

1. **Frontend (Web UI):** Ciemny panel sterowania (Dark Theme `#0f111a` / `#1a1d29`), wykorzystujący **Web Serial API** do komunikacji szeregowej z portem USB oraz dynamiczny render Canvas/SVG dla wirtualnego podglądu diod.
2. **Firmware (Arduino / FastLED C++):** Uniwersalny program wgrany na Arduino jednorazowo, dynamicznie interpretujący pakiety danych (konfiguracja pinu, liczba diod, wartości RGB, tryb animacji, prędkość i jasność).

---

## 🎨 Szczegółowa Specyfikacja Interfejsu Graficznego (UI)

### 1. Pasek Nagłówkowy (Top Bar)
- [ ] **Tytuł dynamiczny:** Tekst `Panel Taśmy LED (8x WS2812)` z automatyczną aktualizacją liczby diod na podstawie konfiguracji.
- [ ] **Główny Przełącznik Zasilania (Master Power Toggle):** Przycisk stanu `OFF` / `ON` w prawym górnym rogu (gasi diody bez czyszczenia ustawień).

---

### 2. Panel Konfiguracji Połączenia (Pasek Narzędziowy)
- [ ] **Przycisk "Połącz z Arduino (USB)":** Inicjalizuje okno wyboru portu szeregowego w przeglądarce (`COMx` / `/dev/ttyUSBx`).
- [ ] **Wybór Pinu Sygnałowego (Dropdown):** Lista dostępnych pinów cyfrowych Arduino (np. `D2`, `D3`, `D4`, `D5`, `D6`, `D7`, `D8`).
- [ ] **Wybór Długości Taśmy (Input/Number):** Pole do wpisania liczby diod (np. od `1` do `256`).

---

### 3. Sekcja: WYBÓR KOLORU STATYCZNEGO
- [ ] **Kołowa Paleta Kolorów (Color Wheel Picker):**
  - Interaktywne koło gradientowe HSV/RGB (Canvas/SVG).
  - Przesuwany biały znacznik (uchwyt) wskazujący wybrany punkt.
  - Wybór barwy (Hue) i nasycenia (Saturation) przy przeciąganiu.
- [ ] **Pole Wartości HEX:** Wyświetlanie i wpisywanie kodu koloru (np. `#FF0055`).
- [ ] **Podgląd wartości RGB:** Tekstowy podgląd składowych w formacie `RGB(r, g, b)` na żywo.

---

### 4. Sekcja: SZYBKIE PRESETY KOLORÓW
Grid 10 zaokrąglonych przycisków akcji o zdefiniowanych tłam kolorystycznych:
- [ ] **Czerwony** (`#FF0000`)
- [ ] **Zielony** (`#00FF00`)
- [ ] **Niebieski** (`#0000FF`)
- [ ] **Biały** (`#FFFFFF`)
- [ ] **Wyłącz** (`#000000`)
- [ ] **Żółty** (`#FFFF00`)
- [ ] **Pomarańczowy** (`#FF7F00`)
- [ ] **Cyan** (`#00FFFF`)
- [ ] **Purpurowy** (`#800080`)
- [ ] **Fioletowy** (`#8A2BE2`)

---

### 5. Sekcja: JASNOŚĆ
- [ ] **Etykieta stanu:** Tekst `JASNOŚĆ: XX%`.
- [ ] **Suwak Jasności (Range Slider):** Pasek w zakresem `0% - 100%` (sterujący `FastLED.setBrightness()`).

---

### 6. Sekcja: EFEKTY I SZYBKOŚĆ (Pełny Zestaw Biblioteki FastLED)
- [ ] **Rozwijana lista wyboru efektu (Select Dropdown):**
  - 🔄 `DEMO MODE — Automatyczna prezentacja`
  - 🎨 `Static — Stały kolor`
  - 🌈 `Rainbow — Tęcza`
  - ✨ `Rainbow with Glitter — Tęcza z brokatem`
  - 🎊 `Confetti — Konfetti`
  - 🚨 `Sinelon / Cylon — Odbijający się punkt`
  - 💓 `BPM — Pulsujący rytm`
  - 🤹 `Juggle — Żonglerka`
  - 🔥 `Fire2012 — Efekt ognia`
  - 🫁 `Breathing / Pulse — Oddychanie`
  - 🎭 `Theater Chase — Wąż / Biegające światła`
  - 🌟 `Sparkle / Twinkle — Iskry / Gwiazdy`
  - 🌊 `Color Palette Cycle — Palety Barwne`
  - ⚡ `Strobe — Stroboskop`
- [ ] **Kontrolki parametrów efektów:**
  - **Suwak Szybkości (`Speed ms`):** Opóźnienie animacji (`10ms` - `1000ms`).
  - **Suwak Czasu DEMO (`Demo Duration s`):** Częstotliwość zmiany efektów w trybie Demo (`5s` - `60s`).
  - **Przyciski nawigacji w Demo (`[ Poprzedni ]` / `[ Następny ]`).**

---

### 7. Sekcja: PODGLĄD STANU DIOD
- [ ] **Wizualizacja Taśmy na Żywo (LED Preview Container):**
  - Wyrenderowane kółka odpowiadające liczbie diod z podpisami `#1`, `#2`, ..., `#N`.
  - Efekty świecenia CSS (`box-shadow` / `radial-gradient`) odzwierciedlające kolory i animacje FastLED w czasie rzeczywistym.

---

### 8. Stopka Panelu (Footer)
- [ ] **Pasek statusu:** `Arduino Uno • Port USB: Web Serial API (9600 baud) • FastLED Engine`
