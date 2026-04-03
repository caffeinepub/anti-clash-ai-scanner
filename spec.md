# Colour Clash - Score Tab Overhaul (v61)

## Current State
- OutfitScorePage.tsx (3036 lines) contains all scoring, sharing, battle, invite, and skin tone logic
- `ColorClashBattle` component builds a side-by-side card using the CURRENT + a past lookbook entry (not a fresh friend upload)
- `ClashLeaderboardInvite` component: 'Challenge a Friend' — generates a personalised invite card with friend's name
- Skin tone swatches (score < 70): shows colored circles with name labels but NO shop links
- Path to 100% section: always shows 9 swatches + shop links regardless of score
- No score-based popup/celebration animations exist
- Share app link is https://colourclash-emb.caffeine.xyz (no deep link to score tab)

## Requested Changes (Diff)

### Add
- **Battle flow (new):** 
  1. After scoring, show a "Start Battle" button (not just a static card)
  2. When tapped, generate a battle share card with user's score + photo on LEFT side, RIGHT side shows placeholder "Your friend's photo here" with "Can you beat [score]?"
  3. Share app link = `https://colourclash-emb.caffeine.xyz/?battle=1` — when a friend opens this link, the app auto-navigates to the Score tab
  4. When friend scores their outfit, app detects the `?battle=1` URL param and shows side-by-side comparison: left = friend's just-scored photo, right = challenger's last battle entry from localStorage
  5. Display winner badge (crown icon) on the higher scoring side
  6. Both photos visible side-by-side with scores, winner highlighted

- **Score celebration popups (AnimatePresence):**
  - Score 70-74: subtle confetti burst + "Nice outfit! 🎉" toast
  - Score 75-79: confetti + "Great Style! ✨" toast with color burst
  - Score 80-84: bigger burst + "Impressive! 🌟" toast
  - Score 85-89: fireworks + "Style Master! 🔥" modal popup (auto-dismiss 3s)
  - Score 90-94: full-screen overlay + "Outstanding! 💎" (auto-dismiss 3s)
  - Score 95-99: full-screen gold overlay + "Elite Stylist! 👑" (auto-dismiss 3s)
  - Score 100: animated floating hearts (20+ hearts rise from bottom to top), full-screen pink/red overlay, "PERFECT SCORE! 💖 You are flawless!" text, auto-dismiss 4s
  - Each tier has visually distinct animation/color

- **Skin tone suggestions: shop links**
  - When user clicks a skin tone colour swatch (below score < 70), show retailer shop links filtered by that color + home page gender/age (read `cc_gender` and `cc_age` from localStorage)
  - Show at least: House of Indya, Myntra, Amazon, Ajio links

### Modify
- **Path to 100% section:**
  - If score === 100: hide the 9-swatch section entirely, replace with a congratulatory note: "🎯 You are perfect in colour matching! No suggestions required — your outfit is flawless as it is. Keep rocking your style!"
  - If score < 100: show swatches as before

- **ColorClashBattle component:**
  - Rename/repurpose as `BattleField` with the new flow described above
  - Remove the old "Generate Battle Card" that pulls from lookbook for VS
  - New flow: user scores → "⚔️ Start a Battle" button → generates challenge card → share → friend opens link → scores → side-by-side shown with winner

- **ClashLeaderboardInvite component:**
  - Remove entirely (disable 'Challenge a Friend')

### Remove
- `ClashLeaderboardInvite` component and all its JSX rendering
- Old battle card that silently pulls a past lookbook entry as the "opponent"

## Implementation Plan
1. Remove `ClashLeaderboardInvite` component and its render call
2. Rewrite `ColorClashBattle` → `BattleField` component:
   a. Shows 'Start Battle' button after scoring
   b. On click: saves current entry as `cc_battle_challenger` in localStorage (score + photoDataUrl + date)
   c. Builds battle challenge card (portrait 9:16): user photo LEFT with score, RIGHT side = placeholder with "Can you beat [score]? Upload YOUR outfit!", QR code bottom linking to `https://colourclash-emb.caffeine.xyz/?battle=1`
   d. Share button sends this card + caption: "I scored [X]/100! Can you beat me? Open the link to start your battle! 👊 #ColourClash"
   e. On app load: read `?battle=1` URL param → if present, auto-navigate to Score tab AND set a `battleMode` flag
   f. After friend scores: if `cc_battle_challenger` exists AND battleMode flag, show side-by-side comparison modal: left = challenger's photo + score, right = friend's just-scored photo + score. Winner (higher score) gets a golden crown badge overlay
   g. Show "You Win! 👑" or "They Win! 😤 Try again?" message + option to share the VS card
3. Add score celebration popup system:
   a. `ScoreCelebration` component triggered by score value
   b. 70-84: toast-style notification (auto-dismiss 2.5s) with confetti particles (CSS animation)
   c. 85-99: full-screen overlay modal (auto-dismiss 3s) with animated elements per tier
   d. 100: floating hearts animation (AnimatePresence, 24 hearts with staggered rise), pink gradient overlay, "PERFECT SCORE!" text
4. Modify Path to 100% section: conditional render based on score === 100
5. Modify Skin Tone section: on swatch click, expand a shop row below (House of Indya, Myntra, Amazon, Ajio) with URLs encoded with color name + gender + age from localStorage
