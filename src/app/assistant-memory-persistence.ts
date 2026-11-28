import { salonDb } from '../db/database'
import type { ActorContext, AssistantChatHistory, AssistantEpisode, AssistantEpisodeType } from '../db/types'
import { estimateMemoryBytes, getMemoryRetentionLimits, isLowValueMemoryText, memoryKeywords, normalizeMemoryText, sanitizeAssistantMemoryText } from './assistant-memory-retention'

export type AssistantChatMessage = { id: string; role: 'assistant' | 'user'; content: string; source?: 'local' | 'gemini'; createdAt?: string }
const DAY_MS = 24 * 60 * 60 * 1000

async function storageLimits() {
  try {
    const estimate = await navigator.storage?.estimate?.()
    return getMemoryRetentionLimits(estimate?.usage ?? 0, estimate?.quota ?? 0)
  } catch {
    return getMemoryRetentionLimits()
  }
}

function baseRecord(actor: ActorContext, id: string, now: string) {
  return { id, salonId: actor.salonId, createdAt: now, updatedAt: now, revision: 1, createdBy: actor.actorId, updatedBy: actor.actorId, deviceId: actor.deviceId }
}

/** Save only the recent, bounded chat transcript. Greeting/confirmation noise and contact details are filtered. */
export async function saveAssistantChatSnapshot(actor: ActorContext, messages: AssistantChatMessage[]): Promise<void> {
  if (!actor.salonId || !actor.actorId) return
  const limits = await storageLimits()
  const now = Date.now()
  const cutoff = now - limits.chatRetentionDays * DAY_MS
  const oldRows = await salonDb.assistantChatHistory.where('[salonId+ownerId]').equals([actor.salonId, actor.actorId]).toArray()
  const previousById = new Map(oldRows.map(row => [row.id, row]))
  const candidates: AssistantChatHistory[] = []
  for (const message of messages) {
    if (!message.id || message.id === 'welcome') continue
    const clean = sanitizeAssistantMemoryText(message.content, 700)
    if (!clean) continue
    if (message.role === 'user' && isLowValueMemoryText(clean)) continue
    const normalized = normalizeMemoryText(clean)
    if (message.role === 'assistant' && /^(ena|dạ, em chào|dạ, em đây|em đây ạ)/.test(normalized)) continue
    const old = previousById.get(message.id)
    const messageAt = message.createdAt ?? old?.messageAt ?? new Date(now).toISOString()
    if (Date.parse(messageAt) < cutoff) continue
    candidates.push({
      ...baseRecord(actor, message.id, old?.createdAt ?? messageAt),
      ownerId: actor.actorId, role: message.role, content: clean, source: message.source,
      messageAt, revision: old ? old.revision + 1 : 1,
    })
  }
  candidates.sort((a, b) => Date.parse(a.messageAt) - Date.parse(b.messageAt))
  let kept = candidates.slice(-limits.chatMaxMessages)
  let bytes = kept.reduce((sum, row) => sum + estimateMemoryBytes(row.content), 0)
  while (kept.length && bytes > limits.chatMaxBytes) {
    bytes -= estimateMemoryBytes(kept[0].content)
    kept = kept.slice(1)
  }
  await salonDb.transaction('rw', salonDb.assistantChatHistory, async () => {
    await salonDb.assistantChatHistory.where('[salonId+ownerId]').equals([actor.salonId, actor.actorId]).delete()
    if (kept.length) await salonDb.assistantChatHistory.bulkPut(kept)
  })
}

export async function loadAssistantChatHistory(actor: ActorContext): Promise<AssistantChatMessage[]> {
  const limits = await storageLimits()
  const now = Date.now()
  const cutoff = now - limits.chatRetentionDays * DAY_MS
  const rows = await salonDb.assistantChatHistory.where('[salonId+ownerId]').equals([actor.salonId, actor.actorId]).toArray()
  const valid = rows.filter(row => Date.parse(row.messageAt) >= cutoff).sort((a, b) => Date.parse(a.messageAt) - Date.parse(b.messageAt))
  const bounded = valid.slice(-limits.chatMaxMessages)
  const validIds = new Set(bounded.map(row => row.id))
  const obsolete = rows.filter(row => !validIds.has(row.id))
  if (obsolete.length) await salonDb.assistantChatHistory.bulkDelete(obsolete.map(row => row.id))
  return bounded.map(row => ({ id: row.id, role: row.role, content: row.content, source: row.source, createdAt: row.messageAt }))
}

export async function recordAssistantEpisode(actor: ActorContext, episodeType: AssistantEpisodeType, summary: string, importance: 1 | 2 | 3 | 4 | 5 = 4): Promise<AssistantEpisode | null> {
  if (!actor.salonId || !actor.actorId) return null
  const clean = summary.replace(/[\\w.+-]+@[\\w.-]+\\.[a-z]{2,}/gi, '[email ẩn]').replace(/\\s+/g, ' ').trim().slice(0, 360)
  if (!clean || (episodeType === 'conversation' && isLowValueMemoryText(clean))) return null
  const limits = await storageLimits()
  const now = new Date().toISOString()
  const rows = await salonDb.assistantEpisodes.where('[salonId+ownerId]').equals([actor.salonId, actor.actorId]).toArray()
  const duplicate = rows.find(row => row.status === 'active' && row.episodeType === episodeType && normalizeMemoryText(row.summary) === normalizeMemoryText(clean))
  const record: AssistantEpisode = duplicate
    ? { ...duplicate, summary: clean, keywords: memoryKeywords(clean), importance: Math.max(duplicate.importance, importance) as 1|2|3|4|5, updatedAt: now, revision: duplicate.revision + 1 }
    : {
      ...baseRecord(actor, 'episode_' + crypto.randomUUID(), now), ownerId: actor.actorId, episodeType,
      summary: clean, keywords: memoryKeywords(clean), importance, status: 'active', lastRecalledAt: null, recallCount: 0,
    }
  await salonDb.assistantEpisodes.put(record)
  await pruneAssistantMemory(actor)
  return record
}

export async function searchAssistantEpisodes(actor: ActorContext, query: string, maxResults = 6): Promise<AssistantEpisode[]> {
  await pruneAssistantMemory(actor)
  const rows = await salonDb.assistantEpisodes.where('[salonId+ownerId]').equals([actor.salonId, actor.actorId]).toArray()
  const active = rows.filter(row => row.status === 'active')
  const terms = [...new Set(memoryKeywords(query))]
  const scored = active.map(row => {
    const haystack = normalizeMemoryText(row.summary + ' ' + row.keywords.join(' '))
    const score = terms.reduce((sum, term) => sum + (haystack.includes(term) ? 2 : 0), 0)
    return { row, score }
  }).filter(item => item.score > 0).sort((a, b) => b.score - a.score || Date.parse(b.row.createdAt) - Date.parse(a.row.createdAt))
  const recent = active.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))\n  const selected = (terms.length && scored.length ? scored.map(item => item.row) : recent).slice(0, maxResults)
  const now = new Date().toISOString()
  await Promise.all(selected.map(row => salonDb.assistantEpisodes.put({ ...row, lastRecalledAt: now, recallCount: row.recallCount + 1, updatedAt: now, revision: row.revision + 1 })))
  return selected
}

export async function pruneAssistantMemory(actor: ActorContext): Promise<{ chatCount: number; episodeCount: number; bytes: number }> {
  const limits = await storageLimits()
  const now = Date.now()
  const chatCutoff = now - limits.chatRetentionDays * DAY_MS
  const episodeCutoff = now - limits.episodeRetentionDays * DAY_MS
  const [chatRows, episodeRows, manualRows] = await Promise.all([
    salonDb.assistantChatHistory.where('[salonId+ownerId]').equals([actor.salonId, actor.actorId]).toArray(),
    salonDb.assistantEpisodes.where('[salonId+ownerId]').equals([actor.salonId, actor.actorId]).toArray(),
    salonDb.assistantMemories.where('[salonId+ownerId]').equals([actor.salonId, actor.actorId]).toArray(),
  ])
  const chatValid = chatRows.filter(row => Date.parse(row.messageAt) >= chatCutoff).sort((a, b) => Date.parse(a.messageAt) - Date.parse(b.messageAt)).slice(-limits.chatMaxMessages)
  let chatBytes = chatValid.reduce((sum, row) => sum + estimateMemoryBytes(row.content), 0)
  let chatKept = [...chatValid]
  while (chatKept.length && chatBytes > limits.chatMaxBytes) {
    chatBytes -= estimateMemoryBytes(chatKept[0].content)
    chatKept.shift()
  }
  const chatKeepIds = new Set(chatKept.map(row => row.id))
  const episodeValid = episodeRows.filter(row => row.status === 'active' && Date.parse(row.createdAt) >= episodeCutoff)
    .sort((a, b) => b.importance - a.importance || Date.parse(b.createdAt) - Date.parse(a.createdAt))
  let episodeKept = episodeValid.slice(0, limits.episodeMaxCount)
  let episodeBytes = episodeKept.reduce((sum, row) => sum + estimateMemoryBytes(row.summary), 0)
  while (episodeKept.length && episodeBytes > limits.episodeMaxBytes) {
    const removed = episodeKept.pop()!
    episodeBytes -= estimateMemoryBytes(removed.summary)
  }
  const episodeKeepIds = new Set(episodeKept.map(row => row.id))
  const manualDuplicateKeys = new Set<string>()
  const manualKeepIds = new Set<string>()
  const categoryWeight: Record<string, number> = { profile: 5, preference: 4, project: 4, routine: 3, shortcut: 2, knowledge: 2 }
  const manualCandidates = manualRows.filter(row => row.status === 'active').sort((a, b) =>
    (categoryWeight[b.category] ?? 1) - (categoryWeight[a.category] ?? 1) || Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
  let manualBytes = 0
  for (const row of manualCandidates) {
    const key = normalizeMemoryText(row.category + ':' + row.content)
    const rowBytes = estimateMemoryBytes(row.title + row.content)
    if (manualDuplicateKeys.has(key) || manualKeepIds.size >= limits.manualMaxCount || manualBytes + rowBytes > limits.manualMaxBytes) continue
    manualDuplicateKeys.add(key)
    manualKeepIds.add(row.id)
    manualBytes += rowBytes
  }
  const archivedManual = manualRows.filter(row => row.status === 'archived' && Date.parse(row.updatedAt) < now - 90 * DAY_MS)
  const deleteChat = chatRows.filter(row => !chatKeepIds.has(row.id)).map(row => row.id)
  const deleteEpisodes = episodeRows.filter(row => !episodeKeepIds.has(row.id)).map(row => row.id)
  const deleteManual = [...archivedManual.map(row => row.id), ...manualRows.filter(row => row.status === 'active' && !manualKeepIds.has(row.id)).map(row => row.id)]
  await salonDb.transaction('rw', salonDb.assistantChatHistory, salonDb.assistantEpisodes, salonDb.assistantMemories, async () => {
    if (deleteChat.length) await salonDb.assistantChatHistory.bulkDelete(deleteChat)
    if (deleteEpisodes.length) await salonDb.assistantEpisodes.bulkDelete(deleteEpisodes)
    if (deleteManual.length) await salonDb.assistantMemories.bulkDelete(deleteManual)
  })
  return { chatCount: chatKept.length, episodeCount: episodeKept.length, bytes: chatBytes + episodeBytes + manualBytes }
}

export async function listRecentAssistantEpisodes(actor: ActorContext, maxResults = 8): Promise<AssistantEpisode[]> {
  const rows = await salonDb.assistantEpisodes.where('[salonId+ownerId]').equals([actor.salonId, actor.actorId]).toArray()
  return rows.filter(row => row.status === 'active').sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, maxResults)
}

export async function deleteAssistantEpisode(actor: ActorContext, episodeId: string): Promise<boolean> {
  const row = await salonDb.assistantEpisodes.get(episodeId)
  if (!row || row.salonId !== actor.salonId || row.ownerId !== actor.actorId) return false
  await salonDb.assistantEpisodes.delete(episodeId)
  return true
}

export function formatAssistantEpisodes(rows: AssistantEpisode[]): string {
  if (!rows.length) return 'Em chưa tìm thấy ký ức gần đây phù hợp. Các thao tác đã xác nhận sẽ được ghi nhớ ngắn gọn trên thiết bị này.'
  return 'Dạ, em nhớ những việc đã ghi nhận:\n\n' + rows.map((row, index) => (index + 1) + '. ' + row.summary + ' (' + new Date(row.createdAt).toLocaleString('vi-VN') + ')').join('\n')
}
