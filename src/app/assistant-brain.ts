import type { AssistantMemoryCategory, AssistantMemoryRecord } from '../db/types'

const normalize = (value: string) => value.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').trim()

export type ParsedMemoryInstruction = { category: AssistantMemoryCategory; title: string; content: string }

export function parseMemoryInstruction(question: string): ParsedMemoryInstruction | null {
  const raw = question.trim().replace(/[.!?]+$/, '').trim()
  if (!raw) return null
  const normalized = normalize(raw)
  const explicit = /^(?:xin\s+)?(?:hay\s+)?(?:ghi nho|hay nho|nho rang|nho giup|minh nho|minh muon ban nho|luu lai|hay luu|tu nay)\b/.test(normalized)
  const identity = /^(?:ten toi la|ten minh la|goi toi la|goi minh la|toi ten la|minh ten la)\b/.test(normalized)
  if (!explicit && !identity) return null

  const content = raw
    .replace(/^(?:xin\s+)?(?:hãy\s+)?(?:ghi nhớ(?: thêm)?|hãy nhớ|mình muốn bạn nhớ(?: rằng)?|nhớ giúp(?: mình| tôi)?|nhớ rằng|mình nhớ|nhớ|lưu lại|hãy lưu|từ nay(?: hãy)?)\s*/i, '')
    .replace(/^[.!?]+\s*/, '')
    .replace(/^(?:giúp mình|giúp tôi|rằng|là)\s*/i, '')
    .replace(/\s+(?:nhé|nha|bạn nhé|giúp mình|giúp tôi)$/i, '')
    .trim()
  if (!content) return null

  const clean = normalize(content)
  let category: AssistantMemoryCategory = 'knowledge'
  if (/(tong hop|liet ke|tra cuu|tim kiem|bao cao|danh sach)/.test(clean) && /(nhan vien|doanh thu|san pham|khach hang|dich vu|lich hen|ton kho)/.test(clean)) category = 'shortcut'
  else if (/^(?:ten toi|ten minh|goi toi|goi minh|toi ten|minh ten)/.test(clean)) category = 'profile'
  else if (/(moi sang|moi ngay|hang ngay|dau ngay|cuoi ngay|lich lam viec|ke hoach hang|thu tu uu tien|routine|kiem tra lich|lap ke hoach)/.test(clean)) category = 'routine'
  else if (/(toi thich|minh thich|toi khong thich|minh khong thich|uu tien|khong thich|muon ban|muon tro ly|cach xung ho|hay tra loi|tra loi ngan gon|giao dien sang|giao dien toi)/.test(clean)) category = 'preference'
  else if (/(du an|project|dang phat trien|cong viec dang lam|salon toc quyen|q-biz)/.test(clean)) category = 'project'

  const title = category === 'shortcut' ? 'Câu hỏi nghiệp vụ đã dạy'
    : category === 'profile' ? 'Thông tin cá nhân'
    : category === 'routine' ? 'Thói quen và kế hoạch'
      : category === 'preference' ? 'Sở thích và cách làm việc'
        : category === 'project' ? 'Thông tin dự án'
          : content.slice(0, 64)
  return { category, title, content }
}

export function isMemoryRecallQuestion(question: string): boolean {
  const q = normalize(question)
  return /(ban nho gi|nho gi ve toi|ban co nho toi|toi ten gi|minh ten gi|ten minh la gi|ten toi la gi|ban nho ten minh|so thich cua toi|toi thich gi|toi da dan gi|toi da bao ban|nho cua ban|bo nho cua ban|nhung gi ban da ghi nho|thong tin ban nho|ban con nho)/.test(q)
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


export function isAssistantGreeting(question: string): boolean {
  return /^(?:xin chao|chao(?: ban| bot| tro ly| toc quyen)?|hello|hi|hey)(?: ban| bot| nhe)?[!.? ]*$/.test(normalize(question))
}


export function isAssistantCapabilityQuestion(question: string): boolean {
  const q = normalize(question)
  return /(ban co the lam gi|ban co the lam duoc gi|ban lam duoc gi|ban giup duoc gi|tro ly co the lam gi|ban biet lam gi|chuc nang cua ban|ban ho tro nhung gi)/.test(q)
}

export function isAssistantCreatorQuestion(question: string): boolean {
  const q = normalize(question)
  return /(ai tao ra ban|ai da tao ra ban|ai da tao ra minh|ai tao ra minh|ai lap trinh ban|ai phat trien ban|ai lam ra ban|nguoi tao ra ban|ban duoc tao boi ai)/.test(q)
}

export function answerAssistantAbout(question: string): string | null {
  if (isAssistantCapabilityQuestion(question)) return [
    'Mình là trợ lý nghiệp vụ của TÓC QUYỀN. Mình có thể:',
    '• Tra cứu doanh thu, tiền thu, tiền hoàn và chi phí theo ngày, tháng, quý, năm.',
    '• Tổng hợp lịch hẹn, khách hàng, dịch vụ phổ biến và tình hình kho.',
    '• Tra cứu tên sản phẩm, SKU và số lượng tồn trong danh mục salon.',
    '• Phân tích ca làm đã hoàn thành theo nhân viên khi dữ liệu ca làm được ghi nhận.',
    '• Ghi nhớ câu hỏi nghiệp vụ do chủ tiệm dạy để lần sau hiểu cách hỏi tự nhiên hơn.',
    '• Đối chiếu dữ liệu và nêu rõ chỉ số chưa đủ dữ liệu để kết luận.',
    'Mình chỉ đọc và phân tích dữ liệu; không tự ý sửa hóa đơn, tiền hoặc hồ sơ kinh doanh.'
  ].join('\n')
  if (isAssistantCreatorQuestion(question)) return 'Mình là trợ lý phần mềm được tích hợp trong ứng dụng Salon TÓC QUYỀN. Phần mềm do chủ dự án Salon TÓC QUYỀN xây dựng; khả năng AI có thể dùng Gemini của Google khi dịch vụ này được cấu hình. Mình không phải một con người và không tự biết danh tính cá nhân của người viết từng thành phần nếu thông tin đó chưa được cung cấp.'
  return null
}

const SHORTCUT_STOP_WORDS = new Set(['ban','minh','toi','cua','la','gi','ve','cho','voi','hay','nhe','nha','mot','nhung','cac','nay','do','khong','co','duoc','muon','nao','nhat','lam','viec','tong','hop','danh','sach'])
export function findMatchingAssistantShortcut(memories: AssistantMemoryRecord[], question: string): AssistantMemoryRecord | null {
  const tokens = normalize(question).split(/[^a-z0-9]+/).filter(token => token.length > 2 && !SHORTCUT_STOP_WORDS.has(token))
  if (!tokens.length) return null
  const ranked = memories.filter(memory => memory.status === 'active' && memory.category === 'shortcut').map(memory => {
    const target = normalize(memory.content).split(/[^a-z0-9]+/).filter(token => token.length > 2 && !SHORTCUT_STOP_WORDS.has(token))
    const uniqueTarget = [...new Set(target)]
    const overlap = tokens.filter(token => uniqueTarget.some(candidate => candidate === token || candidate.includes(token) || token.includes(candidate))).length
    const score = overlap / Math.max(1, Math.min(new Set(tokens).size, uniqueTarget.length))
    return { memory, score }
  }).sort((a, b) => b.score - a.score)
  return ranked[0] && ranked[0].score >= 0.35 ? ranked[0].memory : null
}
