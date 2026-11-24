import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { firestore } from '../lib/firebase'

/**
 * Creates a first-time owner's tenant and membership in one atomic batch.
 * Firestore Rules verify the matching post-write documents; the client cannot
 * create a membership on its own or change an existing role.
 */
export async function provisionOwnerSalon(uid: string, salonName: string): Promise<string> {
  if (!firestore) throw new Error('Firebase Firestore chưa được cấu hình.')
  if (!uid.trim()) throw new Error('Bạn cần đăng nhập Google trước khi tạo salon.')

  const name = salonName.trim()
  if (name.length < 2 || name.length > 80) {
    throw new Error('Tên salon cần có từ 2 đến 80 ký tự.')
  }

  const salonRef = doc(collection(firestore, 'salons'))
  const membershipRef = doc(firestore, 'memberships', uid)
  const batch = writeBatch(firestore)
  const timestamp = serverTimestamp()

  batch.set(salonRef, {
    salonId: salonRef.id,
    name,
    ownerUid: uid,
    status: 'active',
    createdAt: timestamp,
    updatedAt: timestamp,
    plan: 'starter',
  })
  batch.set(membershipRef, {
    uid,
    salonId: salonRef.id,
    role: 'owner',
    status: 'active',
    createdAt: timestamp,
    updatedAt: timestamp,
  })

  await batch.commit()
  return salonRef.id
}
