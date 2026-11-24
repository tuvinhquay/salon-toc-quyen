import type { AssistantMemoryCategory, AssistantMemoryRecord } from '../db/types'

const normalize = (value: string) => value.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').trim()

export type ParsedMemoryInstruction = { category: AssistantMemoryCategory; title: string; content: string }

export function parseMemoryInstruction(question: string): ParsedMemoryInstruction | null {
  const raw = question.trim().replace(/[.!?]+$/, '').trim()
  if (!raw) return null
  const normalized = normalize(raw)
  const explicit = /^(?:xin\s+)?(?:hay\s+)?(?:ghi nho|hay nho|nho giup|minh nho|luu lai|hay luu|tu nay)\b/.test(normalized)
  const identity = /^(?:ten toi la|ten minh la|goi toi la|goi minh la|toi ten la|minh ten la)\b/.test(normalized)
  if (!explicit && !identity) return null

  const content = raw
    .replace(/^(?:xin\s+)?(?:hãy\s+)?(?:ghi nhớ|hãy nhớ|nhớ giúp(?: mình| tôi)?|mình nhớ|nhớ|lưu lại|hãy lưu|từ nay(?: hãy)?)\s*/i, '')
    .replace(/^(?:giúp mình|giúp tôi|rằng|là)\s*/i, '')
    .replace(/\s+(?:nhé|nha|bạn nhé|giúp mình|giúp tôi)$/i, '')
    .trim()
  if (!content) return null

  const clean = normalize(content)
  let category: AssistantMemoryCategory = 'knowledge'
  if (/^(?:ten toi|ten minh|goi toi|goi minh|toi ten|minh ten)/.test(clean)) category = 'profile'
  else if (/(moi sang|moi ngay|hang ngay|dau ngay|cuoi ngay|lich lam viec|ke hoach hang|thu tu uu tien|routine|kiem tra lich|lap ke hoach)/.test(clean)) category = 'routine'
  else if (/(toi thich|minh thich|toi khong thich|minh khong thich|uu tien|khong thich|muon ban|muon tro ly|cach xung ho|hay tra loi|tra loi ngan gon|giao dien sang|giao dien toi)/.test(clean)) category = 'preference'
  else if (/(du an|project|dang phat trien|cong viec dang lam|salon toc quyen|q-biz)/.test(clean)) category = 'project'

  const title = category === 'profile' ? 'Thông tin cá nhân'
    : category === 'routine' ? 'Thói quen và kế hoạch'
      : category === 'preference' ? 'Sở thích và cách làm việc'
        : category === 'project' ? 'Thông tin dự án'
          : content.slice(0, 64)
  return { category, title, content }
}

export function isMemoryRecallQuestion(question: string): boolean {
  const q = normalize(question)
  return /(ban nho gi|nho gi ve toi|ban co nho toi|toi ten gi|ten toi la gi|so thich cua toi|toi thich gi|toi da dan gi|toi da bao ban|nho cua ban|bo nho cua ban|nhung gi ban da ghi nho|thong tin ban nho|ban con nho)/.test(q)
}

export function answerFromMemories(memories: AssistantMemoryRecord[]): string {
  const active = memories.filter(memory => memory.status === 'active')
  if (!active.length) return 'Mình chưa có trí nhớ dài hạn nào được bạn xác nhận trên thiết bị này. Bạn có thể nói tự nhiên như “Mình tên là Quay” hoặc “Hãy nhớ giúp mình rằng mình thích câu trả lời ngắn gọn”.'
  const sections = active.map((memory, index) => (index + 1) + '. **' + memory.title + '**\n' + memory.content)
  return 'Mình nhớ những điều bạn đã chủ động chia sẻ với mình:\n\n' + sections.join('\n\n') + '\n\nNhững thông tin này được lưu riêng trên thiết bị hiện tại và chưa đồng bộ sang thiết bị khác.'
}

const STOP_WORDS = new Set(['ban','minh','toi','cua','la','gi','ve','cho','voi','hay','nhe','nha','mot','nhung','cac','nay','do','khong','co','duoc','muon'])
export function selectRelevantMemories(memories: AssistantMemoryRecord[], question: string): AssistantMemoryRecord[] {
  const tokens = normalize(question).split(/[^a-z0-9]+/).filter(token => token.length > 2 && !STOP_WORDS.has(token))
  if (!tokens.length) return []
  return memories.filter(memory => memory.status === 'active').map(memory => {
    const haystack = normalize(memory.title + ' ' + memory.content + ' ' + memory.keywords.join(' '))
    const score = tokens.reduce((total, token) => total + (haystack.includes(token) ? 1 : 0), 0)
    return { memory, score }
  }).filter(item => item.score > 0).sort((a, b) => b.score - a.score).slice(0, 5).map(item => item.memory)
}
