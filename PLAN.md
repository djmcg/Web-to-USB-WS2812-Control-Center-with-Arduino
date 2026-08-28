# 🚀 Specyfikacja i Plan Projektu: Web-to-USB WS2812 Control Center

Uniwersalne narzędzie webowe w stylu Dark Mode do sterowania taśmami adresowalnymi LED (WS2812B) podłączonymi do Arduino po USB, bezpośrednio z przeglądarki (Web Serial API).

---

## 🏗️ Architektura Systemu

1. **Frontend (Web UI):** Ciemny panel sterowania (Dark Theme `#0f111a` / `#1a1d29`), wykorzystujący **Web Serial API** do komunikacji szeregowej z portem USB oraz dynamiczny render Canvas/SVG dla wirtualnego podglądu diod.
2. **Firmware (Arduino / FastLED C++):** Uniwersalny program wgrany na Arduino jednorazowo, dynamicznie interpretujący pakiety danych (konfiguracja pinu, liczba diod, wartości RGB, tryb animacji, prędkość i jasność).

---

## 🎨 Szczegółowa Specyfikacja Interfejsu Graficznego (UI)

### 1. Pasek Nagłówkowy (Top Bar)
- [x] **Tytuł dynamiczny:** Tekst `Panel Taśmy LED (8x WS2812)` z automatyczną aktualizacją liczby diod na podstawie konfiguracji.
- [x] **Główny Przełącznik Zasilania (Master Power Toggle):** Przycisk stanu `OFF` / `ON` w prawym górnym rogu (gasi diody bez czyszczenia ustawień).

### 2. Panel Konfiguracji Połączenia (Pasek Narzędziowy)
- [x] **Przycisk "Połącz z Arduino (USB)":** Inicjalizuje okno wyboru portu szeregowego w przeglądarce (`COMx` / `/dev/ttyUSBx`).
- [x] **Wybór Pinu Sygnałowego (Dropdown):** Lista dostępnych pinów cyfrowych Arduino (np. `D2`, `D3`, `D4`, `D5`, `D6`, `D7`, `D8`).
- [x] **Wybór Długości Taśmy (Input/Number):** Pole do wpisania liczby diod (np. od `1` do `256`).

### 3. Sekcja: WYBÓR KOLORU STATYCZNEGO
- [x] **Kołowa Paleta Kolorów (Color Wheel Picker):**
  - Interaktywne koło gradientowe HSV/RGB (Canvas/SVG).
  - Przesuwany biały znacznik (uchwyt) wskazujący wybrany punkt.
  - Wybór barwy (Hue) i nasycenia (Saturation) przy przeciąganiu.
- [x] **Pole Wartości HEX:** Wyświetlanie i wpisywanie kodu koloru (np. `#FF0055`).
- [x] **Podgląd wartości RGB:** Tekstowy podgląd składowych w formacie `RGB(r, g, b)` na żywo.

### 4. Sekcja: SZYBKIE PRESETY KOLORÓW
Grid 10 zaokrąglonych przycisków akcji o zdefiniowanych tłam kolorystycznych:
- [x] **Czerwony** (`#FF0000`)
- [x] **Zielony** (`#00FF00`)
- [x] **Niebieski** (`#0000FF`)
- [x] **Biały** (`#FFFFFF`)
- [x] **Wyłącz** (`#000000`)
- [x] **Żółty** (`#FFFF00`)
- [x] **Pomarańczowy** (`#FF7F00`)
- [x] **Cyan** (`#00FFFF`)
- [x] **Purpurowy** (`#800080`)
- [x] **Fioletowy** (`#8A2BE2`)

### 5. Sekcja: JASNOŚĆ
- [x] **Etykieta stanu:** Tekst `JASNOŚĆ: XX%`.
- [x] **Suwak Jasności (Range Slider):** Pasek w zakresem `0% - 100%` (sterujący `FastLED.setBrightness()`).

### 6. Sekcja: EFEKTY I SZYBKOŚĆ (Pełny Zestaw Biblioteki FastLED)
- [x] **Rozwijana lista wyboru efektu (Select Dropdown):**
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
- [x] **Kontrolki parametrów efektów:**
  - **Suwak Szybkości (`Speed ms`):** Opóźnienie animacji (`10ms` - `1000ms`).
  - **Suwak Czasu DEMO (`Demo Duration s`):** Częstotliwość zmiany efektów w trybie Demo (`5s` - `60s`).
  - **Przyciski nawigacji w Demo (`[ Poprzedni ]` / `[ Następny ]`).**

### 7. Sekcja: PODGLĄD STANU DIOD
- [x] **Wizualizacja Taśmy na Żywo (LED Preview Container):**
  - Wyrenderowane kółka odpowiadające liczbie diod z podpisami `#1`, `#2`, ..., `#N`.
  - Efekty świecenia CSS (`box-shadow` / `radial-gradient`) odzwierciedlające kolory i animacje FastLED w czasie rzeczywistym.

### 8. Stopka Panelu (Footer)
- [x] **Pasek statusu:** `Arduino Uno • Port USB: Web Serial API (9600 baud) • FastLED Engine`

---

## 🛠️ Zadania do wdrożenia przez Agenta AI (Checklista)

### 1. Logika Komunikacji USB (Web Serial API w `app.js`)
- [x] Zaimplementuj funkcję asynchroniczną nawiązującą połączenie z portem COM (`navigator.serial.requestPort()`).
- [x] Skonfiguruj przesył paczek o stałej długości (Uint8Array, 10 bajtów) z baud rate 9600.
- [x] Zadbaj o obsługę błędów (rozłączenie kabla, brak uprawnień) i aktualizację tekstowego paska statusu w stopce.

### 2. Logika Interfejsu i Podglądu Graficznego (DOM w `app.js`)
- [x] **Dynamiczny render diod:** Na podstawie inputu "Liczba LED", wygeneruj w kontenerze `#led-preview-container` odpowiednią liczbę elementów `div` imitujących diody.
- [x] **Koło Kolorów (Canvas):** Obsłuż kliknięcia i przeciąganie po gradiencie HSV/RGB. Po wybraniu koloru, natychmiast wyślij ramkę na port USB.
- [x] **Synchronizacja wizualna (Kluczowe):** Każda zmiana koloru (z koła lub presetów) oraz jasności z suwaka musi dynamicznie aktualizować style CSS wyrenderowanych diod (np. zmianę `box-shadow` i `background-color`), aby strona graficznie reagowała identycznie jak fizyczna taśma LED.

### 3. Integracja Symulatora Wokwi w `index.html`
- [x] Dodaj na dole strony (przed stopką) sekcję HTML z ramką `<iframe>`.
- [x] Jako źródło `src` ramki ustaw publiczny link do zapisanego projektu Wokwi z dodanym parametrem embed (np. `https://wokwi.com/projects/ID_PROJEKTU?embed=1`). Zostaw placeholdery na ID projektu, jeśli jeszcze go nie wygenerowano.
- [x] Nadaj ramce style CSS: `width: 100%; height: 500px; border: none; border-radius: 12px;`.

### 4. Firmware Arduino (`firmware.ino`)
- [x] Zaimplementuj odczyt ramki zaczynającej się od bajtu nagłówka `0xAA`.
- [x] Wykorzystaj instrukcję `switch-case` do obsługi wszystkich 14 trybów FastLED (Static, Rainbow, Fire2012, itp.).
- [x] Dodaj obsługę wirtualnego timera (`millis()`) do kontrolowania prędkości animacji (`Speed ms`) oraz czasu zmiany efektów w trybie DEMO.

---

## 📋 Protokół Komunikacji (USB Serial)

| Bajt | Nazwa | Opis |
|------|-------|------|
| 0 | `HEADER` | `0xAA` — znacznik początku ramki |
| 1 | `MODE` | Numer trybu (0-13) |
| 2 | `BRIGHTNESS` | Jasność 0-255 |
| 3 | `R` | Składowa czerwona |
| 4 | `G` | Składowa zielona |
| 5 | `B` | Składowa niebieska |
| 6 | `SPEED_H` | Szybkość animacji (bajt wysoki) |
| 7 | `SPEED_L` | Szybkość animacji (bajt niski) |
| 8 | `DEMO_TIME` | Czas zmiany efektu w DEMO (sekundy) |
| 9 | `NUM_LEDS` | Liczba diod w taśmie |

**Baud rate:** 9600  
**Długość ramki:** 10 bajtów  
**Kolejność bajtów:** Big-endian dla wartości wielobajtowych

---

## 🧪 Testowanie

1. **Test lokalny:** Otwórz `index.html` w przeglądarce Chrome/Edge. Sprawdź czy interfejs ładuje się poprawnie.
2. **Test Web Serial:** Podłącz Arduino, kliknij "Połącz z Arduino (USB)", wybierz port. Sprawdź czy diody reagują na zmiany koloru/jasności.
3. **Test symulatora Wokwi:** Sprawdź czy iframe ładuje się poprawnie (wymaga poprawnego ID projektu Wokwi).
4. **Test responsywności:** Sprawdź działanie na różnych rozmiarach ekranu.
