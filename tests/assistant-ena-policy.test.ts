import { describe, expect, it } from 'vitest'
import { assertEnaOwnerActor } from '../src/app/assistant-ena-policy'
import type { ActorContext } from '../src/db/types'

const actor: ActorContext = { salonId: 'salon-a', actorId: 'owner-a', deviceId: 'device-a' }

describe('ENA owner boundary', () => {
  it('allows only the authenticated identity represented by the verified Owner context', () => {
    expect(() => assertEnaOwnerActor(actor, 'owner-a')).not.toThrow()
  })
  it('rejects a different or missing authenticated identity', () => {
    expect(() => assertEnaOwnerActor(actor, 'employee-b')).toThrow(/không xác minh được quyền Owner/i)
    expect(() => assertEnaOwnerActor(actor, null)).toThrow(/không xác minh được quyền Owner/i)
  })
  it('rejects incomplete salon or device context', () => {
    expect(() => assertEnaOwnerActor({ ...actor, salonId: '' }, 'owner-a')).toThrow()
    expect(() => assertEnaOwnerActor({ ...actor, deviceId: '' }, 'owner-a')).toThrow()
  })
})
