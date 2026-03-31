# Colour Clash

## Current State
- `ShopMatchingStyles` in `ScannerPage.tsx` uses `GarmentImageCard` which calls Gemini image generation API to produce product images. This API call often fails silently, resulting in broken/missing cards.
- The `ColorPaletteCard` component exists with full SVG category icons and solid color backgrounds — this is what the Deals tab uses successfully.
- `OutfitCard.handleSave` shows a toast but does NOT actually persist the outfit to localStorage — saved looks are never stored or shown in Favorites.
- `FavoritesPage` has no section for saved AI outfit looks.
- `OutfitScorePage` Path to 100% section shows 9 color swatches as circles with names, but no shop links.

## Requested Changes (Diff)

### Add
- In `OutfitScorePage`: Each Path-to-100% swatch gets a "Shop" tap → opens a small popover/sheet showing retailer links (Amazon, Flipkart, Myntra, Ajio, Nykaa, House of Indya) for that color + auto-detected garment category, filtered by the active gender from localStorage (`cc_gender`).
- In `FavoritesPage`: New "Saved Looks" tab (alongside existing palettes / Couple Match). Reads from localStorage key `cc_saved_looks`. Displays each saved outfit exactly as it appears in OutfitCard (title, color chips per item, hairstyle). Includes a delete button per entry.
- In `ScannerPage`: Replace `GarmentImageCard` (which calls Gemini) with a `PaletteIconCard` component — a solid color background square/rectangle in the `shopColor.hex` color, with a centered `CategoryIcon` SVG (white outline, same as `ColorPaletteCard`). This applies in BOTH the accordion view (ProductCard) and the tabs/retailer view.

### Modify
- `OutfitCard.handleSave` in `ScannerPage.tsx`: Actually save the outfit object to localStorage under key `cc_saved_looks` (array), with a unique `id` (timestamp), `savedAt` date, and all outfit fields. Show toast "Saved to Favourites!".
- `ShopMatchingStyles` product cards: The image area uses the new `PaletteIconCard` instead of `GarmentImageCard`. The "Shop on [retailer]" link button must remain visible below the card.

### Remove
- `GarmentImageCard` component and its import of `generateGarmentImage` (this removes the unnecessary Gemini image API call for product cards)

## Implementation Plan
1. In `ScannerPage.tsx`:
   a. Remove `GarmentImageCard` and its Gemini import
   b. Add `PaletteIconCard` — renders a solid color rectangle with a centered white SVG garment icon (reuse the same SVG paths as `ColorPaletteCard.CategoryIcon`)
   c. Replace all `GarmentImageCard` usages with `PaletteIconCard`
   d. Fix `OutfitCard.handleSave` to persist to `cc_saved_looks` in localStorage

2. In `FavoritesPage.tsx`:
   a. Add a "Saved Looks" tab
   b. Load from `cc_saved_looks` localStorage key
   c. Render each look with title, color swatches per item, and a delete button

3. In `OutfitScorePage.tsx`:
   a. Make each Path-to-100% swatch tappable
   b. On tap, show inline retailer links: for each of the 8 retailers, build a search URL for `{colorName} clothing` filtered by gender
   c. Link text format: "Shop on Amazon", "Shop on Myntra", etc.
