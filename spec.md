# Colour Clash

## Current State
Full-stack fashion color harmony app with: Home/Scanner tab (ScannerPage.tsx), Favourites, Score, Trends, Deals tabs. UserProfileContext stores user profile (name, gender, DOB from backend/localStorage). ScannerPage has garment type selector and color matching with internal color theory engine. OutfitScorePage has Single/Couple mode toggle, human detection, share functionality. App has Netflix intro, greeting overlay, profile slide-in page.

## Requested Changes (Diff)

### Add
- **Gender + Age Category selector bar on Home/ScannerPage** -- Always visible at top, two rows: Row 1 = Male / Female toggle; Row 2 = Kid / Teenage / Young / Adult / Senior Citizen chips. Auto-fills from user profile (gender field) if logged in; otherwise user picks.
- **Age/gender-aware suggestion filtering** -- All matching styles, shop links, and garment suggestions filter based on selected gender + age category. Logic:
  - Kid: Only casual items (tshirt, shorts, shoes, bag). Exclude watches, formal wear, sarees, ethnic adult wear. Size hint: XS/S.
  - Teenage: Casual + streetwear (tshirt, jeans, sneakers, hoodie, cap, bag). Exclude sarees, formal suits. Size hint: S/M.
  - Young: All categories including ethnic. Trend-forward suggestions.
  - Adult: All categories including formal, ethnic, suits, sarees.
  - Senior Citizen: Comfort wear + ethnic heavy. Exclude streetwear, crop tops, mini skirts. Size hint: L/XL/XXL.
  - Male: Exclude sarees, purses, kurtis (women-specific). Include shirts, pants, kurta, shoes, watch, jacket.
  - Female: Include sarees, kurtis, dresses, bags, dupattas.
- **Instant re-filtering** -- When user changes gender or age after scan, matching styles and shop suggestions update immediately without re-scanning.
- **Style Mood Selector** -- Before scanning, user picks a mood chip: Casual / Formal / Party / Date Night / Festive. Filters suggestions accordingly.
- **Occasion Tag** -- Office / Wedding / Outdoor / Travel chips, suggestions adapt.
- **Quick Style Presets** -- One-tap preset buttons: "School Look" (auto-sets Female/Male + Kid/Teenage + Casual), "Festival Ready" (Adult + Festive), "Gym Mode" (Young + Casual), "Date Night" (Young/Adult + Party). Auto-sets gender+age+mood together.
- **Size Hint on shop links** -- Show a small size badge (XS/S, S/M, M/L, L/XL, XXL+) based on age category, displayed on each shop card.
- **Share fix for Couple mode** -- Couple mode share must generate a composite image (photo + score overlay + app logo) just like Single mode. Currently only Single mode generates the composite.
- **No image compression on share** -- Use maximum quality canvas toDataURL (quality 1.0), export as PNG not JPEG, to prevent compression artifacts when sharing.
- **Consistent branding on share** -- The composite share image must use the exact same font (Inter/system) and logo (ColourClashLogo) as the app header. No different version.
- **App share link in share text** -- When sharing via WhatsApp/X/clipboard, the share text must include: https://colourclash-emb.caffeine.xyz/

### Modify
- ScannerPage.tsx: Add gender+age selector bar at top. Thread gender+age+mood+occasion state through all color suggestion and shop filtering logic. All `generateMatchingColors` and `COMPLEMENTARY_GARMENT_MAP` calls must respect the active filters.
- OutfitScorePage.tsx: Fix Couple mode share to generate composite image same as Single mode. Fix canvas toDataURL to use PNG format at quality 1.0 to avoid compression. Fix share text to include app URL.
- ColourClashLogo component: Must be used identically in both app header and share composite image. No variations.

### Remove
- Nothing to remove.

## Implementation Plan
1. In ScannerPage.tsx, add a `FilterBar` component at the top with:
   - Gender toggle: Male | Female (pill buttons, active = filled blue)
   - Age chips: Kid | Teenage | Young | Adult | Senior Citizen (horizontal scroll chips)
   - Mood chips: Casual | Formal | Party | Date Night | Festive
   - Occasion chips: Office | Wedding | Outdoor | Travel
   - Quick Preset buttons row: School Look / Festival Ready / Gym Mode / Date Night
   - All collapsed into a compact 2-3 row design, not taking too much space
2. Add state: `selectedGender`, `selectedAge`, `selectedMood`, `selectedOccasion` in ScannerPage.
3. On mount, auto-fill `selectedGender` from `userProfile.gender` if logged in.
4. Create `filterGarmentsByProfile(garments, gender, age)` utility that returns allowed garment types and excluded types.
5. Create `filterProductsByProfile(products, gender, age)` utility.
6. Thread these filters into: COMPLEMENTARY_GARMENT_MAP lookups, shop retailer URL generation, product catalog display.
7. When any filter chip changes after a color is locked, re-run the suggestion rendering (React state will trigger re-render automatically).
8. Add size hint badge to shop cards based on age category.
9. In OutfitScorePage.tsx, add Couple share composite image generation:
   - Draw photo on canvas
   - Draw left/right bounding box overlays for Person 1 / Person 2
   - Draw score badge top-right
   - Draw app logo top-left using same font/style as app
   - Use `canvas.toDataURL('image/png')` (not jpeg) for lossless quality
10. Fix share text in all share buttons (WhatsApp, X, clipboard) to append: https://colourclash-emb.caffeine.xyz/
11. Ensure Single mode share also uses PNG and same logo placement.
