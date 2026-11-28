# Phase 45 – ENA product write routing and chat UX

Date: 2026-11-28
Branch: `phase-45-ena-write-chat-ux-notifications`
Base: `phase-44-ena-unified-operations-assistant`
Repository: `tuvinhquay/salon-toc-quyen`

## User-reported issues
- ENA says it has no ability to add/edit salon data.
- Chat does not follow the newest message reliably and is too small.
- Too many repeated notes occupy the assistant screen.
- No clear unread-message bell at the screen corner.

## Changes
- Product parser now explicitly extracts product name, SKU (including the phrase “mã SKU”), unit, sale price, cost, and opening quantity. It no longer mistakes the first “giá vốn” value for the sale price.
- Full product command routes to the local write handler; preview + explicit confirmation are still required. Writes use existing inventory/product repository, not Gemini.
- Gemini prompt distinguishes model-level DB restriction from ENA's app-level supported operations. It must not blanket-deny ENA's write capability or falsely claim success.
- Chat follows latest messages in layout phase; if user scrolls upward, it preserves position and shows a jump-to-latest control.
- Chat viewport enlarged, font size improved, suggestions/memory folded into an expandable panel, repeated metadata removed from primary view.
- Floating ENA launcher has a bell and unread count. Badge increments only when a new ENA reply arrives while the user is reading older messages; opening the assistant clears it.
- Added tests for full product create prompt; CI includes this branch and Phase 44 as PR base.

## Authorization
No unrestricted read/write access is granted to Gemini. ENA app actions remain scoped by verified Owner context, salon tenant, repository validation and explicit confirmation. Employee access remains disabled until real employee authentication, membership and permissions exist.

## Validation
Pending on the branch: typecheck, lint, unit tests, production build, GitHub Actions CI and Android/Termux acceptance. Do not merge/deploy until these pass.
