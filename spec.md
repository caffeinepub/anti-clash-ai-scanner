# Colour Clash

## Current State

- `ScannerPage.tsx` (3812 lines) contains the full scanner, Live/Upload/Camera tabs, color detection, shop cards, outfit generator, AI stylist panel, and matching color grid.
- Live Scan uses `sampleVideoColor()` in `colorUtils.ts` which samples 8×8 pixels at the **exact centre** of the video frame — there is no visible reticle/target on screen so users don't know where the sample is taken from. This often samples background instead of garment, causing grey or incorrect results.
- Upload/Camera tabs call `detectGarmentFromImage()` via Gemini which returns a single `colorHex` — correct, but the UI gives no way for the user to target a specific area.
- Color result is always a **single HEX value** with a single name.
- "Matching Colours" section shows 5 preset complementary swatches from `generateMatchingColors(activeColor)` based solely on that single HEX.
- Shop cards update based on `selectedMatchingColor` (user tap on a swatch).
- Help icon in `App.tsx` line 467: `<HelpCircle className="w-4 h-4" />` — the `?` icon.

## Requested Changes (Diff)

### Add
- **Draggable palette reticle** on the Live Scan camera view — a moveable crosshair/focus square that shows exactly where sampling happens. User can drag it anywhere on the video feed. Color detection must use only the pixels inside this target box instead of always sampling the centre.
- **Draggable palette reticle** on the Upload/Camera image preview — same draggable focus square overlaid on the static image. When user drags and releases, sample that area from the image canvas.
- **Multi-color breakdown** for the selected target area: instead of averaging to one color, sample ~9 pixel clusters inside the reticle area, group by HSL similarity, and return the top 3-5 distinct colors with names. Display a descriptive text breakdown (e.g., "Grey & black checks with white lines") and a badge showing the distinct color count (e.g., "3 colours detected").
- **Dynamic combination palettes** section titled "Matching Colours" — driven by ALL detected colors from the target area, not just one. Each detected color generates its own complementary swatches. Shop cards refresh to match whichever color the user taps.
- **"How to use Colour Clash" icon** — replace `HelpCircle` import with `Info` (info-circle) from lucide-react at line 467 in `App.tsx`.

### Modify
- `sampleVideoColor()` in `colorUtils.ts`: accept optional `{x, y, size}` parameters for the reticle position (in normalized 0–1 coordinates). Use those to determine which canvas region to sample.
- Live Scan tab: render a draggable reticle SVG (60×60px focus square with corner brackets) on the video, with touch and mouse drag support. Pass its normalized position to the sampling interval.
- Upload/Camera image preview: render the same draggable reticle on the `<img>` element. On drag, re-sample that region from the image and update `detectedColor` + trigger multi-color analysis.
- Color display bar (below camera card): show detected color name + hex as before, but also show the multi-color breakdown text below (small, muted) and color count badge.

### Remove
- Nothing should be removed. All existing features stay intact.

## Implementation Plan

1. **`colorUtils.ts`** — add `sampleImageRegion(imageEl, x, y, w, h): string` that draws the image to a temp canvas, samples the given pixel region, and returns the dominant HEX. Also add `analyzeRegionColors(canvas, x, y, w, h): {colors: Array<{hex, name}>, breakdown: string}` that clusters pixel data into distinct color groups and returns a human-readable breakdown string + array of distinct colors.

2. **Live Scan reticle** — in `ScannerPage.tsx`, add `reticlePos` state (`{x: number, y: number}` in 0-1 normalized) and `reticleSize = 60`. Render an absolutely-positioned draggable div with corner-bracket SVG over the video. Pass reticle position to the sampling interval so `sampleVideoColor` samples there instead of the centre.

3. **Upload/Camera reticle** — on the image preview, render the same draggable reticle. On `pointerup`/`touchend`, call `analyzeRegionColors` on the image, update `detectedColor` (dominant color) + new `detectedColors` state (array of 3-5 colors + breakdown text).

4. **Multi-color breakdown UI** — below the color info bar, show: badge with count ("4 colours"), breakdown text in muted italic. In the "Matching Colours" grid, render each detected color as a swatch (not just one), each tappable to set `selectedMatchingColor` and refresh shop cards.

5. **`App.tsx`** — swap `HelpCircle` import for `Info` and replace `<HelpCircle className="w-4 h-4" />` with `<Info className="w-4 h-4" />` at the help button.
