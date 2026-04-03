# Colour Clash — Battle Card + 4 New Shareable Features

## Current State

The app is fully built (Version 59). OutfitScorePage.tsx contains:
- `ColorClashBattle` component: generates a battle card PNG on canvas (800x600) showing current photo on left, score on right, VS badge, CAN YOU BEAT X? text. Share to WhatsApp currently uses `wa.me/?text=` which only sends the caption URL — the PNG image is NOT shared.
- `buildShareImage()` function: builds 1080x1920 share card for the main score share (this works correctly via native share API on mobile, or in-browser modal on desktop).
- Lookbook entries stored in `cc_lookbook` localStorage.
- The battle card does NOT support side-by-side comparison with a previous score.

Current 4 extra features in the app: Daily Style Challenge, Style DNA Report, Color Clash Battle (existing), Seasonal Palette Forecast.

## Requested Changes (Diff)

### Add
- **Battle Card Comparison Mode**: When user clicks "Generate Battle Card", if there's a previous lookbook entry from a different session, show a side-by-side comparison: LEFT = previous photo + previous score, RIGHT = current photo + current score. Highlight the winner with a gold crown emoji and "WINNER" text. The resulting battle card PNG must be shareable and include both photos side by side.
- **Battle Card Share Fix**: The battle card PNG must actually be shared (not just caption text). On mobile: use `navigator.share({ files: [file] })` to send the PNG directly. On desktop: show in-browser modal with Download Image + Copy Caption (same pattern as the main share card).
- **4 New Shareable Features** (all must be independent, not overlap with existing features, and produce shareable PNG cards):
  1. **Outfit Repeat Tracker** (FavoritesPage or ScannerPage): Tracks when user wears the same color combo again. If the user has scanned similar colors before, show a "Repeat Offender" or "Fresh Look" badge with a shareable card. Card shows streak of unique looks vs repeated combos.
  2. **Color Personality Quiz** (FavoritesPage): A quick 3-question quiz (pick your favorite from 2 colors, 3 times) that generates a "Color Personality" result (e.g., "Bold Romantic", "Urban Explorer", "Classic Minimalist"). Result is a shareable portrait card with color palette swatches and personality description.
  3. **Weekly Style Report** (FavoritesPage): Summarizes the week's scans — most-used color, highest score, style improvement tip. Shown as a shareable weekly summary card (portrait PNG).
  4. **Clash Leaderboard Invite** (OutfitScorePage, shown after scoring): After scoring, a "Challenge a Friend" card appears. User enters a friend's name, and the app generates a personalized "[Friend], can you beat [UserName]'s score of [X]?" shareable PNG card with both score challenge and QR code.

### Modify
- `ColorClashBattle` component in `OutfitScorePage.tsx`: Completely rewrite `buildBattleCard` to support side-by-side comparison. Pull the most recent *different-session* lookbook entry as the challenger. If no previous entry exists, show a placeholder left panel with "Be the first!" and encourage sharing.
- Battle card share button: Replace `wa.me/?text=` link with a proper share handler that uses `navigator.share({ files: [file] })` on mobile (with the PNG file) and falls back to in-browser modal on desktop.
- Battle card canvas dimensions: Change to 1080x600 (landscape) to better show side-by-side comparison.

### Remove
- The simple `wa.me/?text=` anchor tag from the battle card share — replace with proper share function.

## Implementation Plan

1. **Rewrite `buildBattleCard`** in `OutfitScorePage.tsx`:
   - Canvas 1080x600 landscape
   - Pull latest lookbook entry that is NOT the current entry (challenger from previous session)
   - Left panel (540x600): challenger photo + score. If no challenger, show "Be the first!" color block
   - Right panel (540x600): current user photo + current score
   - VS badge center (red circle)
   - Compare scores: winner gets gold "WINNER 👑" text above their panel, loser gets "Challenger"
   - Bottom strip: "COLOUR CLASH" branding + QR code + app link
   - Return blob for sharing

2. **Fix battle card share**:
   - `handleShareBattle(blob)`: try `navigator.share({ files: [file] })` first
   - If fails/unsupported: show in-browser modal (same `showBattleSheet` state, show image + Download + Copy Caption)
   - Remove the `wa.me/?text=` anchor

3. **Add Outfit Repeat Tracker** to `FavoritesPage.tsx`:
   - Read scan history from localStorage `cc_scan_history`
   - Count repeated color names (within 20% HEX distance)
   - Show badge: if >2 repeats = "Repeat Offender 🔄", else "Fresh Look ✨"
   - Shareable canvas card (800x450)

4. **Add Color Personality Quiz** to `FavoritesPage.tsx`:
   - 3 rounds: show 2 color swatches per round, user picks one
   - Map picks to personality type (8 combinations = 8 personalities)
   - Show result card with personality name, description, color palette
   - Shareable portrait PNG (800x1000)

5. **Add Weekly Style Report** to `FavoritesPage.tsx`:
   - Read last 7 days of lookbook entries
   - Compute: most-used color, highest score, avg score, count
   - Generate shareable PNG report card

6. **Add Clash Leaderboard Invite** to `OutfitScorePage.tsx`:
   - Appears in results view after scoring
   - Input field for friend's name
   - Build personalized challenge PNG: "[Friend], [UserName] scored X/100. Can you beat it?" + QR code
   - Share via native share or in-browser modal

7. All new features must be fully functional (no broken UI states) and produce downloadable/shareable PNG output.
