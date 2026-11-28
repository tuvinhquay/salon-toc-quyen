# Phase 47 – Local-first Firebase Sync Hub

Date: 2026-11-28
Branch: `phase-47-local-first-device-sync-hub`
Base: `phase-46-ena-lightweight-memory-retention`

## Owner decision
- Each authorized device (desktop, laptop, iPhone, Android) keeps its own local IndexedDB as the primary working store.
- Firebase is the identity, membership, device approval and sync coordination/distribution hub; it is not the primary salon business-data store.
- Encrypted relay envelopes may be temporarily held/distributed by Firebase; they are not plaintext or canonical business records.
- This supersedes the P2P-only/no-Firebase-relay restriction from 2026-11-23 while retaining local-first, E2E encryption, tenant isolation and independent encrypted backup.

## Changes in this phase
- Added architecture decision record `docs/architecture/LOCAL_FIRST_FIREBASE_SYNC_HUB.md`.
- Updated `src/app/guide-content.ts` so both the Guide page and ENA local guide-answering explain local IndexedDB per device, Firebase control-plane/relay responsibilities, offline/conflict expectations, backup safety and the fact that real sync transport is not yet available.
- Updated `src/app/GuidePage.tsx` introduction and limitations to describe the new architecture accurately.
- Added Phase 47 to CI branch filters.
- Updated ROADMAP and Vietnamese session history.

## Not yet implemented
- Atomic outbox creation in every business repository.
- Firestore device/control-plane and encrypted relay documents + strict Rules.
- Upload/download transport, acknowledgement, cursors, retry and idempotency.
- Conflict policies for invoices, payments, refunds, stock and other business entities.
- Cross-device ENA memory synchronization.
- Per-device quota health monitoring, warning UX and push notifications.
- Automated multi-device tests and real desktop/iPhone/Android acceptance.

## Safety
- Never delete salon records or unacknowledged outbox data to free space.
- Browser quota estimates are not total physical free-space measurements.
- Do not claim sync is active until transport, Rules, tests and device acceptance pass.
- No merge or deployment in this phase.
