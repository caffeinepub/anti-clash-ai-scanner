# Colour Clash

## Current State
- FavoritesPage has only a "Pick Photo" button for color detection; no live camera
- Saved palette cards show scanned color circle but complementary picked colors are only shown as tiny swatches
- Saved palettes fail silently when user not logged in (no localStorage fallback)
- OutfitScorePage lookbook entries expand inline but don't open as a full Instagram-style post view
- Outfit history stored in plain `localStorage.outfitHistory` (not user-specific)
- No mood tagging for palettes; no daily style tip feature

## Requested Changes (Diff)

### Add
- Live camera scan in FavoritesPage using `useCamera` hook (video viewfinder, capture, color detect)
- Both scanned color AND selected complementary colors shown prominently in each saved palette card
- localStorage fallback keyed by user principal for favorites (when not logged in or backend fails)
- Lookbook entry tap opens a full-screen Instagram post view (same card layout as fresh score result) with all options (share, re-analyse, close)
- User-specific localStorage key for outfit history (`outfitHistory_<principal>`)
- Mood tag selector when saving a palette (Casual / Formal / Party / Travel / Sport)
- Daily Style Tip card in FavoritesPage (Gemini-generated or curated, shown once per day)

### Modify
- FavoritesPage: remove Pick Photo file input; replace with camera scan section
- FavoritesPage SavedCard: redesign to show scanned color + complementary strip side by side clearly
- OutfitScorePage HistoryCard: clicking entry enters "view" mode showing full InstagramPostCard
- Outfit score saveEntry: use user-principal-keyed localStorage key

### Remove
- Pick Photo button and file input from FavoritesPage

## Implementation Plan
1. Update `FavoritesPage.tsx`:
   - Import and use `useCamera` hook for live scan
   - Add camera viewfinder UI with "Start Scan", "Capture", "Stop" controls
   - Remove Pick Photo file input
   - Update `SavedCard` to clearly show scanned color + all complementary colors as a row of circles with names
   - Add mood tag selector (chips) before saving
   - Add localStorage favorites fallback keyed by principal
   - Add Daily Style Tip card (curated tips, rotating by date)
2. Update `OutfitScorePage.tsx`:
   - Add `viewEntry: HistoryEntry | null` state
   - When viewEntry set, render InstagramPostCard using viewEntry data instead of fresh score
   - Add "Back to Lookbook" button in that mode
   - Store/load history from `outfitHistory_<principal>` key (fallback `outfitHistory`)
   - Import `useInternetIdentity` to get principal
