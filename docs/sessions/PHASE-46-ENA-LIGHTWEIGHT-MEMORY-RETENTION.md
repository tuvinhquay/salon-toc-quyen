# Phase 46 – ENA lightweight episodic memory

Date: 2026-11-28
Branch: `phase-46-ena-lightweight-memory-retention`
Base: `phase-45-ena-write-chat-ux-notifications`
Repository: `tuvinhquay/salon-toc-quyen`

## User report
After ENA successfully added a product, leaving the assistant and returning caused it to forget the action. Chat was only React component state; the old long-term memory required an explicit “remember” instruction and contained no successful action log.

## Implementation
- Dexie/IndexedDB schema v9 adds `assistantEpisodes` and `assistantChatHistory`; versions 1–8 remain intact. No database reset or record deletion migration.
- Chat history restores on ENA open, persists by salon + owner, and is bounded/filtered.
- Successful product and customer operations write an episodic memory only after repository success. Product episode retains SKU, cost, sale price, unit and opening stock; customer phone/email are not copied into memory.
- Meaningful conversation pairs can create compact summaries; greetings, confirmation/cancel noise, operational commands and short transient reports are filtered.
- Recall questions search recent/relevant episodes. Gemini receives a small sanitized episode context, not direct database access.
- Automatic cleanup removes expired, duplicate, archived and low-priority items; applies item-count and byte caps; tightens retention at 85%/95% of browser-origin quota; retries after cleanup on quota errors.
- Account/salon scope guard prevents old chat from being persisted into another tenant when Owner changes accounts.

## Planned bounds
- Chat: max 40 messages, 48 KB, 30 days (reduced under quota pressure).
- Episodic memory: max 120 entries, 64 KB, 180 days (reduced under pressure).
- Explicit owner memory: max 80 entries, 64 KB; oldest/lower-priority duplicates are cleaned first.
- These limits apply to ENA's own stored memory, not salon inventory/customer/invoice records.

## Validation
- GitHub Actions CI run #653 PASS at commit `495f01a67e77520e940642165b32dfd234a3535b`: typecheck, lint, unit tests and optimized PWA build passed.
- Owner Android/Termux acceptance remains pending. No merge/deploy.
