import { salonDb } from '../db/database'
import { assistantMemoryInputSchema } from '../db/schema'
import type { ActorContext, AssistantMemoryRecord } from '../db/types'

const normalize = (value: string) => value.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')
const keywordsFor = (content: string) => [...new Set(normalize(content).split(/[^a-z0-9]+/).filter(token => token.length > 2))].slice(0, 30)

export async function listOwnerMemories(salonId: string, ownerId: string): Promise<AssistantMemoryRecord[]> {
  if (!salonId.trim() || !ownerId.trim()) return []
  return salonDb.assistantMemories.where('[salonId+ownerId]').equals([salonId, ownerId]).and(row => row.status === 'active').reverse().sortBy('updatedAt')
}

export async function saveOwnerMemory(actor: ActorContext, category: AssistantMemoryRecord['category'], title: string, content: string): Promise<AssistantMemoryRecord> {
  const parsed = assistantMemoryInputSchema.parse({ category, title, content, keywords: keywordsFor(content) })
  const now = new Date().toISOString()
  const existing = await salonDb.assistantMemories.where('[salonId+ownerId]').equals([actor.salonId, actor.actorId]).and(row => row.status === 'active' && normalize(row.content) === normalize(parsed.content)).first()
  if (existing) {
    const updated = { ...existing, title: parsed.title, category: parsed.category, content: parsed.content, keywords: parsed.keywords, updatedAt: now, updatedBy: actor.actorId, revision: existing.revision + 1 }
    await salonDb.assistantMemories.put(updated)
    return updated
  }
  const record: AssistantMemoryRecord = {
    id: 'brain_' + crypto.randomUUID(), salonId: actor.salonId, ownerId: actor.actorId,
    category: parsed.category, title: parsed.title, content: parsed.content, keywords: parsed.keywords,
    status: 'active', syncState: 'local_only', createdAt: now, updatedAt: now, revision: 1,
    createdBy: actor.actorId, updatedBy: actor.actorId, deviceId: actor.deviceId,
  }
  await salonDb.transaction('rw', salonDb.assistantMemories, salonDb.auditEvents, async () => {
    await salonDb.assistantMemories.add(record)
    await salonDb.auditEvents.add({ id: 'audit_' + crypto.randomUUID(), salonId: actor.salonId, entityType: 'assistant_memory', entityId: record.id, action: 'created', occurredAt: now, actorId: actor.actorId, deviceId: actor.deviceId, summary: 'Chủ tiệm đã thêm một mục trí nhớ cho trợ lý' })
  })
  return record
}

export async function archiveOwnerMemory(actor: ActorContext, memoryId: string): Promise<boolean> {
  const current = await salonDb.assistantMemories.get(memoryId)
  if (!current || current.salonId !== actor.salonId || current.ownerId !== actor.actorId || current.status !== 'active') return false
  const now = new Date().toISOString()
  await salonDb.transaction('rw', salonDb.assistantMemories, salonDb.auditEvents, async () => {
    await salonDb.assistantMemories.put({ ...current, status: 'archived', updatedAt: now, updatedBy: actor.actorId, revision: current.revision + 1 })
    await salonDb.auditEvents.add({ id: 'audit_' + crypto.randomUUID(), salonId: actor.salonId, entityType: 'assistant_memory', entityId: current.id, action: 'archived', occurredAt: now, actorId: actor.actorId, deviceId: actor.deviceId, summary: 'Chủ tiệm đã lưu trữ một mục trí nhớ của trợ lý' })
  })
  return true
}
