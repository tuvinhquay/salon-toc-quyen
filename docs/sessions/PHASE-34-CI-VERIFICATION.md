# Phase 34 – CI verification supplement
Date: 2026-11-25
Branch: `phase-34-owner-analytics-and-friendly-vietnamese-ux`
PR: #30

## CI evidence
- Initial typecheck detected an unused `owner` context binding in `src/app/App.tsx` after the salon ID display was removed. Removed the now-unused import and binding.
- The next production build detected the Owner-provided `public/icons/icon.png` asset at 2.1 MB, exceeding Workbox's 2 MiB default precache limit. Updated `vite.config.ts` to set `maximumFileSizeToCacheInBytes: 3 * 1024 * 1024`, preserving the supplied PNG in the PWA precache.
- GitHub Actions run #461 (`45648266830`, commit `1d63f0bc3237269e00dc8d429c315e78ef948d95`) completed **PASS**:
  - Typecheck: PASS
  - ESLint: PASS
  - Unit tests: 59/59 PASS
  - Production Build/PWA: PASS

## Remaining acceptance
- Android/Termux runtime smoke test and desktop visual acceptance are still required.
- The existing JavaScript bundle-size warning (>500 KB) remains a warning, not a build failure; no code splitting was attempted in this UI-focused phase.
- No merge and no Firebase/Hosting deployment until Owner acceptance.
