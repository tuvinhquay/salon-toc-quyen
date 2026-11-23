import type { AssistantMemoryCategory, AssistantMemoryRecord } from '../db/types'

const normalize = (value: string) => value.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').trim()

export type ParsedMemoryInstruction = { category: AssistantMemoryCategory; title: string; content: string }

export function parseMemoryInstruction(question: string): ParsedMemoryInstruction | null {
  const raw = question.trim().replace(/[.!?]+$/, '').trim()
  const normalized = normalize(raw)
  const explicit = /^(hay\s+)?(ghi nho|hay nho|nho giup|minh nho|luu lai|hay luu|tu nay hay|tu nay)/.test(normalized)
  const identity = /^(ten toi la|ten minh la|goi toi la|goi minh la|toi ten la|minh ten la)/.test(normalized)
  if (!explicit && !identity) return null

  let content = raw
    .replace(/^(hãy\s+)?(ghi nhớ|nhớ giúp|nhớ|mình nhớ|lưu lại|hãy lưu|từ nay hãy|từ nay)\s*/i, '')
    .replace(/^(rằng|là)\s*/i, '')
    .trim()
  content = content.replace(/\s+(nhé|nha|bạn nhé|giúp mình)$/i, '').trim()
  if (!content) return null

  const clean = normalize(content)
  let category: AssistantMemoryCategory = 'knowledge'
  if (/^(ten toi|ten minh|goi toi|goi minh|toi ten|minh ten)/.test(clean)) category = 'profile'
  else if (/(moi sang|moi ngay|hang ngay|dau ngay|cuoi ngay|lich lam viec|ke hoach hang|thu tu uu tien|routine)/.test(clean)) category = 'routine'
  else if (/(toi thich|minh thich|uu tien|khong thich|muon ban|cach xung ho)/.test(clean)) category = 'preference'
  else if (/(du an|project|dang phat trien|cong viec dang lam)/.test(clean)) category = 'project'

  const title = category === 'profile' ? 'Thông tin cá nhân'
    : category === 'routine' ? 'Thói quen và kế hoạch'
      : category === 'preference' ? 'Sở thích và cách làm việc'
        : category === 'project' ? 'Thông tin dự án'
          : content.slice(0, 64)
  return { category, title, content }
}

export function isMemoryRecallQuestion(question: string): boolean {
  const q = normalize(question)
  return /(ban nho gi ve toi|ban co nho toi|toi da dan gi|toi da bao ban|nho cua ban|bo nho cua ban|nhung gi ban da ghi nho|thong tin ban nho)/.test(q)
}

export function answerFromMemories(memories: AssistantMemoryRecord[]): string {
  const active = memories.filter(memory => memory.status === 'active')
  if (!active.length) return 'Mình chưa có trí nhớ dài hạn nào được chủ tiệm xác nhận trên thiết bị này. Bạn có thể nói “Hãy ghi nhớ…” để dạy mình.'
  const sections = active.map((memory, index) => (index + 1) + '. **' + memory.title + '**\n' + memory.content)
  return 'Đây là những điều mình đang ghi nhớ trên thiết bị này:\n\n' + sections.join('\n\n') + '\n\nMình chỉ lưu các nội dung chủ tiệm chủ động yêu cầu ghi nhớ. Hiện các mục này chưa được đồng bộ P2P sang thiết bị khác.'
}

export function selectRelevantMemories(memories: AssistantMemoryRecord[], question: string): AssistantMemoryRecord[] {
  const tokens = normalize(question).split(/[^a-z0-9]+/).filter(token => token.length > 2)
  if (!tokens.length) return []
  return memories.filter(memory => memory.status === 'active').map(memory => {
    const haystack = normalize(memory.title + ' ' + memory.content + ' ' + memory.keywords.join(' '))
    const score = tokens.reduce((total, token) => total + (haystack.includes(token) ? 1 : 0), 0)
    return { memory, score }
  }).filter(item => item.score > 0).sort((a, b) => b.score - a.score).slice(0, 5).map(item => item.memory)
}
