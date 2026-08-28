#include <FastLED.h>

// Maksymalna zarezerwowana liczba diod w pamięci RAM
#define MAX_LEDS 256
#define DEFAULT_PIN 3

CRGB leds[MAX_LEDS];

// Zmienne konfiguracyjne
uint16_t numLeds = 8;
uint8_t currentPin = DEFAULT_PIN;
uint8_t globalBrightness = 200;

// Zmienne trybu i animacji
uint8_t currentMode = 0;   // 0: Static, 1: Demo, 2: Rainbow, 3: RainbowGlitter, itd.
uint8_t targetR = 255, targetG = 0, targetB = 0;
uint16_t animSpeed = 50;   // opóźnienie w ms
uint16_t demoDuration = 10; // czas zmiany efektu w trybie Demo (sekundy)

// Zmienne pomocnicze dla efektów
uint8_t gHue = 0; 
unsigned long lastAnimUpdate = 0;
unsigned long lastDemoSwitch = 0;
uint8_t demoStep = 2; // Zaczynamy demo od efektu nr 2 (Rainbow)

void setup() {
  Serial.begin(9600);
  
  // Domyślna inicjalizacja FastLED na pinie D3 (można zmienić w kodzie/re-init)
  FastLED.addLeds<WS2812B, DEFAULT_PIN, GRB>(leds, MAX_LEDS);
  FastLED.setBrightness(globalBrightness);
  FastLED.clear(true);
}

void loop() {
  readSerialData();

  // Obsługa czasu odświeżania animacji
  if (millis() - lastAnimUpdate >= animSpeed) {
    lastAnimUpdate = millis();
    gHue++; // płynna zmiana odcienia w tle
    runEffectLogic();
    FastLED.show();
  }
}

// Odbieranie pakietów po port szeregowym USB
// Format ramki: [HEADER 0xAA] [MODE] [BRIGHTNESS] [R] [G] [B] [SPEED_MS_HIGH] [SPEED_MS_LOW] [DEMO_TIME_S] [NUM_LEDS]
void readSerialData() {
  while (Serial.available() >= 10) {
    if (Serial.read() == 0xAA) { // Nagłówek ramki
      currentMode   = Serial.read();
      globalBrightness = Serial.read();
      targetR       = Serial.read();
      targetG       = Serial.read();
      targetB       = Serial.read();
      
      uint8_t speedH = Serial.read();
      uint8_t speedL = Serial.read();
      animSpeed     = (speedH << 8) | speedL;
      
      demoDuration  = Serial.read();
      uint8_t newLeds = Serial.read();

      if (newLeds > 0 && newLeds <= MAX_LEDS) {
        numLeds = newLeds;
      }

      FastLED.setBrightness(globalBrightness);
    }
  }
}

// Wykonanie wybranego efektu
void runEffectLogic() {
  uint8_t activeMode = currentMode;

  // Obsługa Trybu DEMO
  if (currentMode == 1) {
    if (millis() - lastDemoSwitch >= ((unsigned long)demoDuration * 1000)) {
      lastDemoSwitch = millis();
      demoStep++;
      if (demoStep > 13) demoStep = 2; // Pętla po efektach 2..13
    }
    activeMode = demoStep;
  }

  switch (activeMode) {
    case 0: // Stały kolor (Static)
      fill_solid(leds, numLeds, CRGB(targetR, targetG, targetB));
      break;

    case 2: // Rainbow
      fill_rainbow(leds, numLeds, gHue, 7);
      break;

    case 3: // Rainbow with Glitter
      fill_rainbow(leds, numLeds, gHue, 7);
      if (random8() < 80) {
        leds[random16(numLeds)] += CRGB::White;
      }
      break;

    case 4: // Confetti
      fadeToBlackBy(leds, numLeds, 10);
      {
        int pos = random16(numLeds);
        leds[pos] += CHSV(gHue + random8(64), 200, 255);
      }
      break;

    case 5: // Sinelon / Cylon
      fadeToBlackBy(leds, numLeds, 20);
      {
        int pos = beatsin16(13, 0, numLeds - 1);
        leds[pos] += CHSV(gHue, 255, 255);
      }
      break;

    case 6: // BPM
      {
        uint8_t BeatsPerMinute = 62;
        CRGBPalette16 palette = PartyColors_p;
        uint8_t beat = beatsin8(BeatsPerMinute, 64, 255);
        for (int i = 0; i < numLeds; i++) {
          leds[i] = ColorFromPalette(palette, gHue + (i * 2), beat - gHue + (i * 10));
        }
      }
      break;

    case 7: // Juggle
      fadeToBlackBy(leds, numLeds, 20);
      {
        uint8_t dothue = 0;
        for (int i = 0; i < 4; i++) {
          leds[beatsin16(i + 7, 0, numLeds - 1)] |= CHSV(dothue, 200, 255);
          dothue += 32;
        }
      }
      break;

    case 8: // Fire2012
      runFireEffect();
      break;

    case 9: // Breathing / Pulse
      {
        uint8_t breath = beatsin8(15, 10, 255);
        fill_solid(leds, numLeds, CRGB(
          (targetR * breath) / 255,
          (targetG * breath) / 255,
          (targetB * breath) / 255
        ));
      }
      break;

    case 10: // Theater Chase
      {
        static uint8_t step = 0;
        fadeToBlackBy(leds, numLeds, 100);
        for (int i = step; i < numLeds; i += 3) {
          leds[i] = CRGB(targetR, targetG, targetB);
        }
        step = (step + 1) % 3;
      }
      break;

    case 11: // Sparkle / Twinkle
      fadeToBlackBy(leds, numLeds, 15);
      if (random8() < 50) {
        leds[random16(numLeds)] = CRGB(targetR, targetG, targetB);
      }
      break;

    case 12: // Color Palette Cycle (Ocean/Forest)
      {
        CRGBPalette16 palette = OceanColors_p;
        for (int i = 0; i < numLeds; i++) {
          leds[i] = ColorFromPalette(palette, gHue + (i * 8), 255, LINEARBLEND);
        }
      }
      break;

    case 13: // Strobe
      {
        static bool strobeOn = false;
        strobeOn = !strobeOn;
        if (strobeOn) {
          fill_solid(leds, numLeds, CRGB(targetR, targetG, targetB));
        } else {
          fill_solid(leds, numLeds, CRGB::Black);
        }
      }
      break;
  }
}

// Algorytm symulacji ognia Fire2012
void runFireEffect() {
  static uint8_t heat[MAX_LEDS];

  for (int i = 0; i < numLeds; i++) {
    heat[i] = qsub8(heat[i], random8(0, ((55 * 10) / numLeds) + 2));
  }

  for (int k = numLeds - 1; k >= 2; k--) {
    heat[k] = (heat[k - 1] + heat[k - 2] + heat[k - 2]) / 3;
  }

  if (random8() < 120) {
    int y = random8(7);
    heat[y] = qadd8(heat[y], random8(160, 255));
  }

  for (int j = 0; j < numLeds; j++) {
    CRGB color = HeatColor(heat[j]);
    leds[j] = color;
  }
}
