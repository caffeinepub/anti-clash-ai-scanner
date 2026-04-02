# Colour Clash

## Current State
- GARMENT_TYPES in ScannerPage.tsx uses dual-labels: "Top / Shirt", "Bottom / Pants", "Scarf / Dupatta" etc.
- COMPLEMENTARY_GARMENT_MAP maps old dual-labels to complementary garment suggestions
- GARMENT_KEYWORD_MAP maps old labels to search keywords
- ShopMatchingStyles renders sections per garment type, with one consolidated shop link per garment section per retailer tab -- BUT within each section multiple sections can produce repeated retailer banners across sections in the same retailer tab
- buildRetailerUrl() builds URLs with gender prefix but does NOT pass gender as a URL query param to retailer sites that accept it
- OutfitScorePage.tsx shows a score ring with grade letter (S/A/B/C/D/F) baked in, but NO explanation of what each grade means
- QR code on share card is fetched via Google Charts API img tag drawn to canvas -- CORS causes it to taint the canvas and break PNG export

## Requested Changes (Diff)

### Add
- Single-entity garment labels: Top, Shirt, Bottom, Pant, Blouse, Scarf, Dupatta, Skirt (+ keep existing: Dress, Jacket/Coat, Shoes/Footwear, Watch/Accessory, Bag/Purse, Saree/Ethnic Wear, Kurta/Kurti, Turban, Stole, Ethnic Wear, Suit/Blazer, Hoodie, Shorts, Jeans, Sneakers)
- Blouse as a new high-priority garment category (female-weighted)
- Dynamic complementary linking per item:
  - Pant/Bottom selected (male) → show Shirts
  - Pant/Bottom selected (female) → show Shirts + Tops
  - Blouse selected → prioritize Saree/Ethnic Wear
  - Scarf selected (female) → show everything applicable to female (Tops, Dress, Blouse, Kurta)
  - Top/Shirt → show Pant/Bottom, Shoes, Accessories
- Letter grade legend below the score ring: "S = Style Master • A = Great Look • B = Good Combo • C = Average • D = Needs Work • F = Bold Clash"
- QR code for share card generated fully client-side using a pure JS QR library (qrcode.js or qr-creator) -- no external image fetching, no CORS

### Modify
- GARMENT_TYPES array: remove all dual-label entries; replace with atomic single labels
- GARMENT_KEYWORD_MAP: updated to match new atomic labels
- COMPLEMENTARY_GARMENT_MAP: updated to reflect new labels + dynamic linking rules above
- ShopMatchingStyles de-duplication: in the "tabs" (by-retailer) view, group all sections under one retailer tab and show only ONE consolidated shop link per retailer (not one per garment section per retailer). The per-section cards can still show, but there must be exactly one CTA button per retailer tab total.
- buildRetailerUrl(): add gender URL parameter encoding for retailers that accept it:
  - Myntra: use URL path gender prefix (e.g. /women/ or /men/)
  - Amazon: add &rh=n:gender encoded in search
  - Flipkart: encode gender in query
  - Ajio, Meesho, Nykaa: append gender to search query string
  - House of Indya, Offduty: gender in search query
- Score ring in OutfitScorePage: add a small grade legend below the ring in the results view

### Remove
- All dual-label garment buttons ("Top / Shirt", "Bottom / Pants", "Scarf / Dupatta") replaced by atomic alternatives
- External QR code fetch (Google Charts API) replaced by client-side QR generation

## Implementation Plan
1. In ScannerPage.tsx:
   a. Replace GARMENT_TYPES with atomic single-label list
   b. Update GARMENT_KEYWORD_MAP to match new labels
   c. Update COMPLEMENTARY_GARMENT_MAP with new dynamic per-item logic
   d. In ShopMatchingStyles tabs view: deduplicate so only ONE consolidated "Shop [color] on [retailer]" button appears per retailer tab (not one per garment section)
   e. Update buildRetailerUrl() to pass gender+color params to retailers that accept URL filters

2. In OutfitScorePage.tsx:
   a. Add grade legend string below score ring in results view
   b. Replace Google Charts QR image fetch with client-side QR code generation (use canvas-based QR drawing or install qrcode npm package)

3. Validate: lint + typecheck + build must pass
