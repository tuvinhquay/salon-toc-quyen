import type { CustomerInput, ProductInput } from '../db/schema'

/** Parse only explicitly supplied customer fields. */
export function parseCustomerCreateCommand(prompt: string): CustomerInput | null {
  const match = prompt.match(/(?:thêm|tạo|lập|đăng ký)\s+(?:mới\s+)?khách hàng(?:\s+mới)?\s+(.+?)(?=,?\s*(?:sđt|số điện thoại|điện thoại|email|ghi chú)(?:\s|[:=]|$)|$)/i)
  if (!match) return null
  const fullName = match[1].trim().replace(/[,.\s]+$/, '')
  if (fullName.length < 2) return null
  const phoneMatch = prompt.match(/(?:sđt|số điện thoại|điện thoại)\s*[:=]?\s*([+()\d .-]{8,})/i)
  const phone = phoneMatch ? phoneMatch[1].trim() : ''
  const phoneDigits = phone.replace(/\D/g, '')
  if (phone && (phoneDigits.length < 9 || phoneDigits.length > 11)) return null
  const emailMatch = prompt.match(/email\s*[:=]?\s*([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/i)
  const notesMatch = prompt.match(/(?:ghi chú|ghi chu)\s*[:=]?\s*(.+)$/i)
  return { fullName, phone, email: emailMatch?.[1] ?? '', notes: notesMatch?.[1]?.trim() ?? '', groupIds: [], customFields: {} }
}

/** Supports an exact customer-name match plus one explicit phone-number change. */
export function parseCustomerPhoneUpdate(prompt: string): { name: string; phone: string } | null {
  const normalized = prompt.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')
  if (!/(sua|cap nhat|doi(?: thong tin)?)/.test(normalized) || !/khach hang/.test(normalized)) return null
  const nameMatch = prompt.match(/khách hàng\s+(.+?)(?=,?\s*(?:đổi|cập nhật|thành|sđt|số điện thoại)(?:\s|[:=]|$))/i)
  const phoneMatch = prompt.match(/(?:sđt|số điện thoại)(?:\s+mới)?\s*(?:thành|là|[:=])?\s*([+()\d .-]{8,})/i)
  if (!nameMatch || !phoneMatch) return null
  const phone = phoneMatch[1].trim()
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 9 || digits.length > 11) return null
  return { name: nameMatch[1].trim().replace(/[,.\s]+$/, ''), phone }
}


export type ParsedProductCreateCommand = {
  input: ProductInput
  quantity: number | null
  unitCostVnd: number | null
}

/** Parse an explicit product name, SKU, sale price, cost and opening quantity. */
export function parseProductCreateCommand(prompt: string): ParsedProductCreateCommand | null {
  const nameMatch = prompt.match(/(?:thêm|tạo|nhập|bổ sung)\\s+(?:sản phẩm\\s+)?(?:mới\\s+)?(?:tên\\s+)?(.+?)(?=\\s*,?\\s*(?:mã|sku)\\s+)/i)
  const skuMatch = prompt.match(/(?:mã|sku)\\s*[:=]?\\s*([a-z0-9-]+)/i)
  const saleMatch = prompt.match(/giá bán\\s*[:=]?\\s*([\\d.,]+)\\s*(triệu|trieu|nghìn|nghin|ngàn|ngan|k|đồng|dong|vnd)?/i)
  if (!nameMatch || !skuMatch || !saleMatch) return null

  const toVnd = (raw: string, unit?: string) => {
    const value = Number(raw.replace(/[.,\\s]/g, ''))
    const multiplier = /^(triệu|trieu)$/i.test(unit ?? '') ? 1_000_000
      : /^(nghìn|nghin|ngàn|ngan|k)$/i.test(unit ?? '') ? 1000 : 1
    return Number.isFinite(value) && value >= 0 ? Math.round(value * multiplier) : null
  }
  const name = nameMatch[1].trim().replace(/[,.\\s]+$/, '')
  const sku = skuMatch[1].trim().toUpperCase()
  const salePriceVnd = toVnd(saleMatch[1], saleMatch[2])
  if (name.length < 2 || !sku || salePriceVnd === null) return null

  const costMatch = prompt.match(/giá vốn\\s*[:=]?\\s*([\\d.,]+)\\s*(triệu|trieu|nghìn|nghin|ngàn|ngan|k|đồng|dong|vnd)?/i)
  const quantityMatch = prompt.match(/(?:số lượng nhập ban đầu|số lượng nhập|nhập ban đầu|tồn đầu|số lượng)\\s*[:=]?\\s*(\\d+(?:[.,]\\d+)?)/i)
  const unitMatch = prompt.match(/đơn vị\\s*(?:là|:)??\\s*([a-zA-ZÀ-ỹ]+)\\b/i)
  const unit = unitMatch?.[1]?.trim().toLocaleLowerCase('vi') ?? (/(hũ|hu|sáp|sap)/i.test(name) ? 'hũ' : 'chai')
  const unitCostVnd = costMatch ? toVnd(costMatch[1], costMatch[2]) : null
  const quantity = quantityMatch ? Number(quantityMatch[1].replace(',', '.')) : null
  if (quantity !== null && (!Number.isFinite(quantity) || quantity <= 0)) return null

  const category = /(keo|sáp|sap|gel|wax|xịt|xit)/i.test(name) ? 'Tạo kiểu' : 'Chăm sóc tóc'
  return {
    input: { name, sku, category, unit, salePriceVnd, trackingMode: 'lot', minimumStock: 0, active: true, customFields: {} },
    quantity,
    unitCostVnd,
  }
}
