import type { ActorContext } from '../db/types'

/** The current application only mounts OwnerContext after AuthGate verifies an active Owner membership. */
export function assertEnaOwnerActor(actor: ActorContext, authenticatedUid: string | null | undefined): void {
  if (!authenticatedUid || authenticatedUid !== actor.actorId || !actor.salonId.trim() || !actor.deviceId.trim()) {
    throw new Error('ENA không xác minh được quyền Owner của phiên hiện tại. Vui lòng tải lại ứng dụng hoặc đăng nhập lại.')
  }
}
