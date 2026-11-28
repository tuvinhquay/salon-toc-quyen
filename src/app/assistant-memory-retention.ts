import type { AssistantEpisodeType } from '../db/types'

export type MemoryStoragePressure = 'normal' | 'high' | 'critical'
export type MemoryRetentionLimits = {
  pressure: MemoryStoragePressure
  chatMaxMessages: number
  chatMaxBytes: number
  chatRetentionDays: number
  episodeMaxCount: number
  episodeMaxBytes: number
  episodeRetentionDays: number
  manualMaxCount: number
  manualMaxBytes: number
}

export function getMemoryRetentionLimits(usageBytes = 0, quotaBytes = 0): MemoryRetentionLimits {
  const ratio = quotaBytes > 0 ? usageBytes / quotaBytes : 0
  if (ratio >= 0.95) return { pressure: 'critical', chatMaxMessages: 12, chatMaxBytes: 10_000, chatRetentionDays: 3, episodeMaxCount: 25, episodeMaxBytes: 12_000, episodeRetentionDays: 30, manualMaxCount: 15, manualMaxBytes: 12_000 }
  if (ratio >= 0.85) return { pressure: 'high', chatMaxMessages: 24, chatMaxBytes: 24_000, chatRetentionDays: 14, episodeMaxCount: 60, episodeMaxBytes: 32_000, episodeRetentionDays: 90, manualMaxCount: 40, manualMaxBytes: 32_000 }
  return { pressure: 'normal', chatMaxMessages: 40, chatMaxBytes: 48_000, chatRetentionDays: 30, episodeMaxCount: 120, episodeMaxBytes: 64_000, episodeRetentionDays: 180, manualMaxCount: 80, manualMaxBytes: 64_000 }
}

export function normalizeMemoryText(value: string): string {
  return value.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').trim()
}

/** Keep useful context while avoiding copied contact details in assistant memory. */
export function sanitizeAssistantMemoryText(value: string, maxChars = 420): string {
  return value.replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, '[email ẩn]')
    .replace(/(?:\+?\d[\d\s().-]{7,}\d)/g, match => match.replace(/\d/g, '•'))
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/\s+/g, ' ').trim().slice(0, maxChars)
}

export function isLowValueMemoryText(value: string): boolean {
  const q = normalizeMemoryText(value).replace(/[.!?]+$/g, '').trim()
  if (!q || q.length < 8) return true
  if (/^(xin chao|chao)(?:\\s+ena)?$/.test(q) || /^(hello|hi|hey|ok|okay|cam on|thanks|xac nhan|xac nhan luu tru|huy|huy bo|huy thao tac|dong y|luu|test|thu)$/.test(q)) return true
  if (/^(da|vang|duoc|ok|okay|em day|em day a|da em day|da em day a)$/.test(q) && q.length < 30) return true
  return false
}

export function episodeTypeForAction(action: string): AssistantEpisodeType | null {
  const types: Record<string, AssistantEpisodeType> = {
    product_created: 'product_created', product_updated: 'product_updated', product_archived: 'product_archived',
    customer_created: 'customer_created', customer_updated: 'customer_updated', customer_archived: 'customer_archived',
    conversation: 'conversation',
  }
  return types[action] ?? null
}

export function memoryKeywords(value: string): string[] {
  return [...new Set(normalizeMemoryText(value).split(/[^a-z0-9]+/).filter(word => word.length > 2))].slice(0, 18)
}

export function estimateMemoryBytes(value: string): number {
  return value.length * 2
}

export function isAssistantEpisodeRecallQuestion(value: string): boolean {
  const q = normalizeMemoryText(value)
  return /(ban nho|ena nho|nho lai|luc nay|hoi nay|truoc do|vua roi|lan truoc|da lam gi|da them|da tao|da cap nhat|da luu tru|minh vua|toi vua|san pham nao|ma sku nao|nhung viec vua lam|viec gan day|cuoc tro chuyen truoc)/.test(q)
}

export function shouldRememberConversation(userText: string, assistantText: string): boolean {
  const q = normalizeMemoryText(userText)
  const a = normalizeMemoryText(assistantText)
  if (isLowValueMemoryText(userText) || isLowValueMemoryText(assistantText)) return false
  if (/(^(them|tao|nhap|bo sung|cap nhat|sua|xoa|luu tru|ngung kinh doanh|xac nhan|huy)\b)/.test(q)) return false
  if (/(doanh thu|bao cao|ton kho|lich hen|top khach|thong ke)/.test(q) && a.length < 180) return false
  return q.split(/\s+/).filter(word => word.length > 2).length >= 4 && a.length >= 80
}
