# Phase 44 – ENA unified salon operations assistant

Date: 2026-11-28  
Branch: `phase-44-ena-unified-operations-assistant`  
Base: `phase-43-gemini-model-flash-lite`  
Repository: `tuvinhquay/salon-toc-quyen`

## Goal
Provide one assistant identity and one conversation surface: **ENA – Trợ lý điều hành salon**. Gemini is the language model; the application and existing repositories retain exclusive authority over salon data and writes.

## Implemented on this branch
- Unified visible assistant identity. Chat messages are all attributed to ENA rather than splitting between local assistant and Gemini.
- Gemini general conversation retained. For finance, inventory, appointments, services and overview queries, local business logic computes the result and supplies verified context/result to Gemini for a natural-language answer.
- Customer creation: explicit name/phone/email/notes extraction, duplicate check, preview and explicit confirmation; write uses existing `saveCustomer` repository with schema validation, salon scope and audit event.
- Customer phone update: exact full-name match required; ambiguous or missing matches are rejected; preview and confirmation required.
- Customer archive: existing flow retained with preview and confirmation.
- Product creation with opening stock and price update: existing Phase 32 flows retained.
- Product archival: exact SKU required; preview and confirmation; product is marked inactive rather than physically deleted, preserving stock and invoice history.
- Owner actor guard: requires authenticated Firebase UID to equal OwnerContext actorId and non-empty salon/device context.
- Gemini adviser prompt states it has no database access and must only interpret application-provided verified results.
- Added tests for Owner actor boundary and customer command parsing.
- CI workflow branch filters include Phase 43/44.

## Permission boundary
The current app is Owner-only: AuthGate verifies an active Owner membership before mounting OwnerContext. Employee directory rows are not login identities. Employee authentication, membership and per-action permissions are not implemented in this branch; ENA must not be exposed to employees until those trusted contexts exist. Do not use a local role label or Gemini prompt as authorization.

## Data and privacy boundaries
- Gemini does not directly read IndexedDB/Firestore and does not execute writes.
- For the selected aggregate/report intents, the app computes results locally and passes only those result/context strings to Gemini.
- Customer/staff profile lookups remain local to avoid sending identifiable records to Gemini.
- Every write is executed by an existing app repository after explicit confirmation; repository validation, salonId scoping and audit events remain authoritative.
- Customer archive is reversible archive behavior. Product archive is an inactive flag, not hard deletion.
- No Firestore Rules, Firebase Auth, App Check, Dexie schema or tenant-isolation changes.

## Production limitation
Gemini API key remains server-only in `.env.local`. The current Vite middleware proxy is development-only and localhost-origin restricted. A secure production backend with secret storage, authenticated requests, rate limiting and server-side authorization is still required before production deployment. Do not deploy the dev proxy.

## Validation status
- Owner direct Gemini API test: PASS (Phase 43, model `gemini-3.5-flash-lite`).
- Owner local Vite proxy status and POST smoke test: PASS (Phase 43).
- Phase 44 typecheck: PENDING.
- Phase 44 lint: PENDING.
- Phase 44 unit tests: PENDING.
- Phase 44 production build: PENDING.
- GitHub Actions CI: PENDING.
- Termux/Android app acceptance: PENDING (customer create/update/archive; product create/update/archive; finance/inventory read with Gemini; cancellation; Owner identity guard).
- Employee permission acceptance: BLOCKED by missing employee authentication/membership/permission context; intentionally denied, not considered implemented.

No merge or deployment performed.
