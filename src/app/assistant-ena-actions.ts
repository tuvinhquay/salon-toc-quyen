import type { CustomerInput } from '../db/schema'

/** Parse only explicitly named customer fields; never infer or invent missing values. */
export function parseCustomerCreateCommand(prompt: string): CustomerInput | null {
  const match = prompt.match(/(?:thêm|tạo|lập|đăng ký)\\s+(?:mới\\s+)?khách hàng\\s+(.+?)(?=,?\\s*(?:sđt|số điện thoại|điện thoại|email|ghi chú)\\b|$)/i)
  if (!match) return null
  const fullName = match[1].trim().replace(/[,.\\s]+$/, '')
  if (fullName.length < 2) return null
  const phoneMatch = prompt.match(/(?:sđt|số điện thoại|điện thoại)\\s*[:=]?\\s*([+()\\d .-]{8,})/i)
  const phone = phoneMatch ? phoneMatch[1].trim() : ''
  const phoneDigits = phone.replace(/\\D/g, '')
  if (phone && (phoneDigits.length < 9 || phoneDigits.length > 11)) return null
  const emailMatch = prompt.match(/email\\s*[:=]?\\s*([a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,})/i)
  const notesMatch = prompt.match(/(?:ghi chú|ghi chu)\\s*[:=]?\\s*(.+)$/i)
  return { fullName, phone, email: emailMatch?.[1] ?? '', notes: notesMatch?.[1]?.trim() ?? '', groupIds: [], customFields: {} }
}

/** Supports an exact customer-name match plus one explicit phone-number change. */
export function parseCustomerPhoneUpdate(prompt: string): { name: string; phone: string } | null {
  const normalized = prompt.toLocaleLowerCase('vi').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/đ/g, 'd')
  if (!/(sua|cap nhat|doi thong tin)/.test(normalized) || !/khach hang/.test(normalized)) return null
  const nameMatch = prompt.match(/khách hàng\\s+(.+?)(?=,?\\s*(?:đổi|cập nhật|thành|sđt|số điện thoại)\\b)/i)
  const phoneMatch = prompt.match(/(?:sđt|số điện thoại)(?:\\s+mới)?\\s*(?:thành|là|[:=])?\\s*([+()\\d .-]{8,})/i)
  if (!nameMatch || !phoneMatch) return null
  const phone = phoneMatch[1].trim()
  const digits = phone.replace(/\\D/g, '')
  if (digits.length < 9 || digits.length > 11) return null
  return { name: nameMatch[1].trim().replace(/[,.\\s]+$/, ''), phone }
}
