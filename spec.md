# Colour Clash

## Current State
Full-stack fashion color harmony app. Key files:
- `src/frontend/src/pages/ScannerPage.tsx` (2874 lines) — Home tab with color scanner, outfit generation, shop matching styles, full outfit palette generator
- `src/frontend/src/pages/FavoritesPage.tsx` (1483 lines) — Favourites tab with couple match, saved looks
- `src/frontend/src/App.tsx` (653 lines) — Tab navigation, profile overlay, House of Indya banner
- `src/frontend/src/utils/colorUtils.ts` — Color utilities (hexToHsl, hslToHex, hexToColorName)

## Requested Changes (Diff)

### Add
1. **Daily Style Challenge** — A new section in the Home (ScannerPage) tab showing a daily color challenge personalized by the active gender/age filter. Each day a new challenge appears (e.g. "Style an outfit in Dusty Rose today — Male/Adult"). User can score their outfit for the challenge and share a challenge badge card with score + challenge name + QR code. Uses a date-seeded array of 30 challenges covering all gender/age combos.

2. **Style DNA Report** — A button in the Favourites tab (or as a floating card after 3+ scans). Analyzes the user's scan history from localStorage (`cc_lookbook` and saved palettes) + profile (gender, age, style preference) to generate a personality card: "You're a [Style Type]" (e.g. Warm Earth Toner, Bold Minimalist, Pastel Dreamer, Monochrome Master, Jewel Tone Queen, Street Edge). Shows a percentage breakdown (e.g. 70% Earthy, 20% Bold, 10% Neutral). Shareable as a styled PNG card.

3. **Color Clash Battle** — A section in the Score tab (below the existing score result). After scoring, user can tap "Start a Color Battle". The app generates a shareable battle card with the user's score, photo thumbnail, and a QR code. When a friend scans the QR code (or visits the app link), they are challenged to beat the score. The battle card shows both scores side-by-side once the friend shares back. Since real-time is not possible, the battle card is a static shareable PNG with "Can you beat my [score]? Scan to try!" text.

4. **Seasonal Palette Forecast** — A new card/section in the Trends tab (TrendRadarPage). Shows "This Season's Must-Have Palette" using Indian fashion seasons: Wedding Season (Oct-Feb), Summer (Mar-May), Monsoon (Jun-Sep), Festive (Sep-Oct). Each season has 5-6 curated colors with names, a brief description, and a "Shop This Palette" button per color linking to retailer URLs filtered by active gender. Shareable as a styled PNG.

### Modify
5. **Fix Full Outfit Palette bug** — In `ScannerPage.tsx` around line 2745, the `showPalette` section generates swatches but ALL use the SAME `l` (lightness) and `s` (saturation) values from the scanned color. Fix: for complementary use `h+180`, for triadic use distinct hue offsets, AND vary lightness meaningfully (complement should be darker/lighter, neutral should be truly desaturated with `l=0.85` for light neutral). Also fix low-saturation edge case: if `s < 0.1`, force `sBase = 0.6` for generated swatches so they are visually distinct. The 5 swatches should be: Primary (original), Complement (h+180, s, adjusted l), Triadic 1 (h+120, s*0.9, l+0.1), Triadic 2 (h+240, s*0.85, l-0.1), Neutral (h, 0.08, 0.88). This ensures all 5 are always visually distinct from each other.

### Remove
- Nothing to remove

## Implementation Plan
1. Fix Full Outfit Palette in ScannerPage.tsx (showPalette section ~line 2745): update the 5 swatch calculations to use varied lightness and force sBase when low saturation
2. Add Daily Style Challenge component in ScannerPage.tsx: date-seeded challenge, score button, shareable badge
3. Add Style DNA Report in FavoritesPage.tsx: analyze localStorage scan history + profile, render personality card, share as PNG
4. Add Color Clash Battle section in OutfitScorePage.tsx: after score result, show battle card with share option
5. Add Seasonal Palette Forecast in TrendRadarPage.tsx: Indian seasons, 5-6 colors per season, shop links, share PNG
6. Validate (lint + typecheck + build)
