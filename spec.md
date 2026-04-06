# Colour Clash

## Current State
- App has a Login Welcome Modal (sign in/sign up) that shows to unauthenticated users
- FilterContext has `aiPlatform` state that stores the selected AI (Gemini, ChatGPT, etc.)
- Home filter bar has Gender, Age, Size, and AI Platform selector (collapsible)
- Scanner (ScannerPage) has Live Color Scan (camera pixel sampling); no Upload Picture or Open Camera tabs
- Garment type selector is manual (24 single-entity labels)
- The 5 Complete Looks (OutfitCard) are generated via internal logic or Gemini via `getGeminiAdvice`
- Complementary Colors section and 5 Complete Looks are generated when a color is locked
- `geminiAI.ts` has `getGeminiAdvice` for outfit generation with gender param
- No AI Engine selection modal distinct from the sign-in modal

## Requested Changes (Diff)

### Add
1. **AI Engine Welcome Modal** -- A separate "Welcome to Colour Clash" modal that shows ONCE on first app open (checked via `cc_ai_engine_preference` in localStorage). Has: colorful gradient design, "Connect Custom AI Engine" button (redirects to AI login, waits for user to return, then marks connected), "Use Internal App Engine" button (saves preference, goes to home), "Skip" button (defaults to internal). Does NOT show if preference already exists in localStorage.
2. **Scanner: Upload Picture tab** -- New tab in scanner UI alongside Live Color Scan. User picks image from gallery, Gemini Vision detects main clothing item + color (garment type + hex). Auto-selects the detected garment in the "What is this item?" selector. User can override the auto-selection.
3. **Scanner: Open Camera tab** -- Third scanner tab. User captures a photo via device camera. Same Gemini Vision detection flow as Upload Picture.
4. **Gemini Vision garment detection function** -- New export in `geminiAI.ts`: `detectGarmentFromImage(imageBase64, mimeType)` returns `{ garmentType: string, colorHex: string, colorName: string }`.

### Modify
1. **AI Engine Welcome Modal** (replaces/extends the existing login modal behavior) -- The existing sign-in modal is a separate ICP/InternetIdentity login. The new AI Engine modal is orthogonal -- it asks about AI platform preference, not account login. Show AI Engine modal after the Netflix intro and greeting overlay settle.
2. **5 Complete Looks** -- Must pass `gender` AND `size` from FilterContext as mandatory variables into both the Gemini prompt (`getGeminiAdvice`) and the internal fallback generator. All 5 looks must strictly match active gender + size.
3. **Auto-refresh Complementary Colors + 5 Complete Looks** -- Every time a new color is scanned (from Live Scan, Upload, or Camera), Complementary Colors section and 5 Complete Looks auto-recalculate immediately without any button tap.
4. **getGeminiAdvice** in `geminiAI.ts` -- Add `size` parameter to the prompt so outfit advice includes size-appropriate items.

### Remove
- Nothing is removed. Existing scanner Live Color Scan stays as the first tab.

## Implementation Plan
1. Add `detectGarmentFromImage` to `geminiAI.ts`
2. Add `size` param to `getGeminiAdvice` in `geminiAI.ts`
3. Create `AIEngineModal` component in `src/frontend/src/components/AIEngineModal.tsx` -- colorful modal, saves to `cc_ai_engine_preference` in localStorage
4. Mount `AIEngineModal` in `App.tsx` after intro -- check localStorage on mount, skip if preference exists
5. Update `ScannerPage.tsx`:
   - Add 3-tab scanner UI: "Live Color Scan" | "Upload Picture" | "Open Camera"
   - Upload/Camera flow: show image preview, call `detectGarmentFromImage`, auto-select detected garment in selector
   - Manual garment selector override still works
   - Pass `size` from FilterContext to outfit generation
   - Auto-refresh complementary colors + 5 Complete Looks on every new color lock (already done via state, but ensure image upload also triggers)
