# Plan: Fix D3 display and firmware upload instructions

## Goal
1. Always display D3 pin next to the LED count in the UI so users know to connect to D3.
2. Rewrite the firmware upload instructions: remove all step-by-step text, leave only the copy prompt and the correct firmware code, and add a copy button.

## Changes

### 1. `index.html` — D3/LED label
- **Line 34:** Update the `<label>` text from `Liczba LED:` to `Liczba LED (D3):` so the required pin is always visible next to the input.

### 2. `index.html` — Firmware instructions section (lines 125-297)
- **Remove:** the entire `<ol>` step-by-step list (lines 127-137).
- **Keep only:** the header `📋 INSTRUKCJA: WGRYWANIE FIRMWARE` and a short prompt: `Skopiuj poniższy kod i wklej do Arduino IDE:`.
- **Replace** the embedded code inside `<details>` with the **exact content** of `firmware/firmware.ino` (the current embedded code is an older broken copy missing `uint8_t dothue = 0;` in the Juggle effect and lacking the `clearUnusedLeds()` helper).
- **Add** a `<button class="copy-btn">📋 Kopiuj kod</button>` above or inside the `<details>` block.

### 3. `app.js` — Copy button behavior
- Add a click handler that:
  1. Selects the `<code>` block inside `.firmware-code`.
  2. Copies its text content to the clipboard via `navigator.clipboard.writeText()`.
  3. Temporarily changes the button text to `Skopiowano!` for ~2 seconds, then reverts.
  4. Falls back gracefully if clipboard API is unavailable (e.g. show alert).

### 4. `style.css` — Copy button styling
- Add styles for `.copy-btn` (padding, background, border-radius, cursor, hover state) placed near the firmware code block.
- Ensure it aligns with the existing UI theme.

## Verification
- Open `index.html` in a browser and confirm:
  - LED input label shows `Liczba LED (D3):`.
  - Firmware section shows only the short prompt + `<details>` with correct code + copy button.
  - Clicking copy button copies the full firmware text.
  - The code inside `<details>` matches `firmware/firmware.ino` exactly (226 lines, with `clearUnusedLeds()` and `dothue` declarations present).
