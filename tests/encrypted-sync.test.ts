import { describe, expect, it } from 'vitest'
import { openSyncPacket, sealSyncPacket } from '../src/sync/encrypted-sync'
import type { ActorContext, ChangeLog } from '../src/db/types'
const owner:ActorContext={salonId:'salon-1',actorId:'owner-1',deviceId:'device-a'}
const peer:ActorContext={salonId:'salon-1',actorId:'owner-1',deviceId:'device-b'}
const change:ChangeLog={id:'change-1',salonId:'salon-1',entityType:'customer',entityId:'customer-1',operation:'update',baseRevision:1,entityRevision:2,encryptedPayload:'ciphertext-only',createdAt:'2026-11-19T01:00:00.000Z',syncedAt:null,revision:1,updatedAt:'2026-11-19T01:00:00.000Z',createdBy:'owner-1',updatedBy:'owner-1',deviceId:'device-a'}
describe('encrypted sync protocol',()=>{
 it('seals and opens a change batch only for the same salon and expected peer',async()=>{
  const packet=await sealSyncPacket(owner,[change],'a-very-long-sync-passphrase')
  const payload=await openSyncPacket(peer,packet,'a-very-long-sync-passphrase','device-a')
  expect(payload.changes).toHaveLength(1)
  expect(payload.changes[0].entityId).toBe('customer-1')
  await expect(openSyncPacket({...peer,salonId:'other-salon'},packet,'a-very-long-sync-passphrase')).rejects.toThrow('không hợp lệ')
  await expect(openSyncPacket(peer,packet,'a-very-long-sync-passphrase','device-c')).rejects.toThrow('không khớp')
 })
})
