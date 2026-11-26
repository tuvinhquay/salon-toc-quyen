import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Bot, Brain, Eraser, Send, Sparkles, UserRound, Trash2 } from 'lucide-react'
import { useOwnerContext } from '../auth/OwnerContext'
import { useAuth } from '../auth/AuthProvider'
import type { AssistantMemoryRecord, Customer, Product } from '../db/types'
import type { ProductInput } from '../db/schema'
import { answerOwnerQuestion, redactQuestionForGemini } from './assistant-local'
import { clearAssistantMemory, describeAssistantMemory, learnAssistantHabit, readAssistantMemory } from './assistant-memory'
import { answerAssistantAbout, answerFromMemories, applyLearnedVocabulary, findMatchingAssistantShortcut, isAssistantGreeting, isMemoryRecallQuestion, parseMemoryInstruction, selectRelevantMemories } from './assistant-brain'
import { archiveOwnerMemory, listOwnerMemories, saveOwnerMemory } from './assistant-brain-store'
import { archiveCustomers, createProductWithOpeningStock, listCustomers, listProducts, saveProduct } from '../db/repositories'
import { askGeminiAdviser, isGeminiAssistantReady } from './assistant-gemini'
import { makeAssistantLanguageFriendly } from './assistant-language'
import { isGuideQuestion } from './guide-content'

type Message = { id: string; role: 'assistant' | 'user'; content: string; source?: 'local' | 'gemini' }

type PendingProductAction =
  | { kind: 'create'; phase: 'details' | 'confirm'; input: ProductInput; quantity: number | null; unitCostVnd: number | null }
  | { kind: 'update'; phase: 'confirm'; product: Product; salePriceVnd: number }
const parseMoneyVnd = (raw: string, multiplier = 1) => {
  const digits = raw.replace(/[.,\s]/g, '')
  const value = Number(digits) * multiplier
  return Number.isFinite(value) && value >= 0 ? Math.round(value) : null
}
function parseProductCreateCommand(prompt: string) {
  const match = prompt.match(/(?:thêm|tạo|nhập|bổ sung)\s+(?:sản phẩm\s+|mặt hàng\s+)?(.+?)\s+(?:mã|sku)\s+([a-z0-9-]+)/i)
  const priceMatch = prompt.match(/(?:giá|đơn giá)\s*[:=]?\s*([\d.,]+)\s*(triệu|trieu|nghìn|nghin|ngàn|ngan|k)?/i)
  if (!match || !priceMatch) return null
  const multiplier = /^(triệu|trieu)$/i.test(priceMatch[2] ?? '') ? 1_000_000 : /^(nghìn|nghin|ngàn|ngan|k)$/i.test(priceMatch[2] ?? '') ? 1000 : 1
  const price = parseMoneyVnd(priceMatch[1], multiplier)
  const name = match[1].trim().replace(/\s+(?:giá|đơn giá)\s*.*$/i, '').trim()
  if (!name || price === null) return null
  const sku = match[2].trim().toUpperCase()
  const category = /(keo|sáp|sap|gel|wax|xịt|xit)/i.test(name) ? 'Tạo kiểu' : 'Chăm sóc tóc'
  const unit = /(sáp|sap|hũ|hu)/i.test(name) ? 'hũ' : 'chai'
  const quantityMatch = prompt.match(/(?:số lượng|nhập kho|tồn đầu|ton dau|so luong)\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i)
  const costMatch = prompt.match(/(?:giá vốn|gia von|cost)\s*[:=]?\s*([\d.,]+)\s*(triệu|trieu|nghìn|nghin|ngàn|ngan|k)?/i)
  const costMultiplier = /^(triệu|trieu)$/i.test(costMatch?.[2] ?? '') ? 1_000_000 : /^(nghìn|nghin|ngàn|ngan|k)$/i.test(costMatch?.[2] ?? '') ? 1000 : 1
  return {
    input: { name, sku, category, unit, salePriceVnd: price, trackingMode: 'lot' as const, minimumStock: 0, active: true, customFields: {} },
    quantity: quantityMatch ? Number(quantityMatch[1].replace(',', '.')) : null,
    unitCostVnd: costMatch ? parseMoneyVnd(costMatch[1], costMultiplier) : null,
  }
}
function parseProductPriceUpdate(prompt: string) {
  const normalized = prompt.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')
  if (!/(doi gia|cap nhat gia|sua gia|gia moi)/.test(normalized) || !/(san pham|mat hang)/.test(normalized)) return null
  const skuMatch = prompt.match(/(?:mã|sku)\s+([a-z0-9-]+)/i)
  const priceMatch = prompt.match(/(?:thành|sang|giá mới|gia moi|là|la)\s*[:=]?\s*([\d.,]+)\s*(triệu|trieu|nghìn|nghin|ngàn|ngan|k)?/i)
    ?? prompt.match(/(?:giá|gia)\s*[:=]?\s*([\d.,]+)\s*(triệu|trieu|nghìn|nghin|ngàn|ngan|k)?/i)
  if (!skuMatch || !priceMatch) return null
  const multiplier = /^(triệu|trieu)$/i.test(priceMatch[2] ?? '') ? 1_000_000 : /^(nghìn|nghin|ngàn|ngan|k)$/i.test(priceMatch[2] ?? '') ? 1000 : 1
  const price = parseMoneyVnd(priceMatch[1], multiplier)
  return price === null ? null : { sku: skuMatch[1].toUpperCase(), salePriceVnd: price }
}

const suggestions = [
  'Hôm nay tiệm kiếm được bao nhiêu tiền?',
  'Tình hình doanh thu tháng này thế nào?',
  'Khách hàng nào đặt lịch nhiều nhất năm nay?',
  'Dịch vụ nào được làm nhiều nhất tháng này?',
  'Kho có mặt hàng nào sắp hết không?',
  'Tư vấn giúp mình cải thiện hoạt động tiệm.',
  'Quý này tiệm kinh doanh thế nào?',
  'Nhân viên nào có nhiều ca làm nhất tháng này?',
  'Tìm sản phẩm dầu gội trong kho.',
  'Bạn có thể làm được gì?',
  'Hướng dẫn mình cách tạo lịch hẹn.',
  'Cách lập hóa đơn và ghi nhận tiền khách trả?',
  'Ứng dụng có những tính năng nào?',
  'Ai đã tạo ra bạn?',
]
const needsAdviser = (question: string, intent: string) => intent === 'general' || /(tu van|giai thich|de xuat|nen lam gi|lam sao|chien luoc|ke hoach|vi sao)/i.test(question.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd'))

export function AssistantPage() {
  const actor = useOwnerContext()
  const { user } = useAuth()
  const ownerName = (user?.displayName ?? '').trim().split(/\s+/)[0]
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<Message[]>([{
    id: 'welcome',
    role: 'assistant',
    content: ownerName ? 'Dạ, em chào anh ' + ownerName + '! Hôm nay anh cần em hỗ trợ gì ạ? Em có thể hướng dẫn cách dùng app, tra cứu nhân viên, khách hàng, sản phẩm, lịch hẹn và thống kê doanh thu. Anh cứ nói ngắn gọn; nếu chưa hiểu rõ, em sẽ hỏi lại nhé.' : 'Dạ, em chào anh/chị! Hôm nay mình cần em hỗ trợ gì ạ? Em có thể tra cứu nhân viên, khách hàng, sản phẩm, lịch hẹn và thống kê doanh thu. Anh/chị cứ nói ngắn gọn; nếu chưa hiểu rõ, em sẽ hỏi lại nhé.',
    source: 'local',
  }])
  const [memory, setMemory] = useState(() => readAssistantMemory(actor.salonId, actor.actorId))
  const [longTermMemories, setLongTermMemories] = useState<AssistantMemoryRecord[]>([])
  const [pendingCustomerArchive, setPendingCustomerArchive] = useState<Customer[] | null>(null)
  const [pendingProductAction, setPendingProductAction] = useState<PendingProductAction | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [adviserNotice, setAdviserNotice] = useState<string | null>(null)
  const chatRef = useRef<HTMLDivElement | null>(null)
  const stickToLatestRef = useRef(true)
  const [showLatest, setShowLatest] = useState(false)
  const geminiReady = isGeminiAssistantReady()

  useEffect(() => {
    let active = true
    void listOwnerMemories(actor.salonId, actor.actorId).then(rows => { if (active) setLongTermMemories(rows) }).catch(() => { if (active) setError('Không đọc được trí nhớ nội bộ trên thiết bị.') })
    return () => { active = false }
  }, [actor.salonId, actor.actorId])

  useEffect(() => {
    const node = chatRef.current
    if (!node || !stickToLatestRef.current) {
      if (node) setShowLatest(true)
      return
    }
    const frame = window.requestAnimationFrame(() => {
      node.scrollTo({ top: node.scrollHeight, behavior: messages.length > 2 ? 'smooth' : 'auto' })
      setShowLatest(false)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [messages, busy])

  function handleChatScroll() {
    const node = chatRef.current
    if (!node) return
    const atLatest = node.scrollHeight - node.clientHeight - node.scrollTop < 72
    stickToLatestRef.current = atLatest
    setShowLatest(!atLatest)
  }

  function goToLatest() {
    const node = chatRef.current
    if (!node) return
    stickToLatestRef.current = true
    node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' })
    setShowLatest(false)
  }

  async function refreshLongTermMemories() {
    const rows = await listOwnerMemories(actor.salonId, actor.actorId)
    setLongTermMemories(rows)
    return rows
  }

  async function send(value = question) {
    const prompt = value.trim()
    if (!prompt || busy) return
    setQuestion('')
    setError(null)
    setAdviserNotice(null)
    stickToLatestRef.current = true
    setShowLatest(false)
    setMessages(previous => [...previous, { id: crypto.randomUUID(), role: 'user', content: prompt }])
    setBusy(true)
    try {
      const normalizedPrompt = prompt.toLocaleLowerCase('vi').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/đ/g, 'd')
      if (pendingCustomerArchive) {
        if (/^(xac nhan luu tru|xac nhan)$/.test(normalizedPrompt.trim())) {
          const count = await archiveCustomers(actor, pendingCustomerArchive.map(customer => customer.id))
          setPendingCustomerArchive(null)
          setMessages(previous => [...previous, { id: crypto.randomUUID(), role: 'assistant', content: 'Em đã lưu trữ ' + count + ' hồ sơ khách hàng. Lịch sử hóa đơn và thanh toán liên quan vẫn được giữ nguyên.', source: 'local' }])
          return
        }
        if (/^(huy|huy bo|khong|dung lai)$/.test(normalizedPrompt.trim())) {
          setPendingCustomerArchive(null)
          setMessages(previous => [...previous, { id: crypto.randomUUID(), role: 'assistant', content: 'Dạ, em đã hủy thao tác. Không có hồ sơ khách hàng nào bị thay đổi.', source: 'local' }])
          return
        }
        setMessages(previous => [...previous, { id: crypto.randomUUID(), role: 'assistant', content: 'Em vẫn đang chờ xác nhận lưu trữ ' + pendingCustomerArchive.length + ' hồ sơ. Anh gõ “XÁC NHẬN LƯU TRỮ” để tiếp tục hoặc “HỦY” để dừng nhé.', source: 'local' }])
        return
      }

      const archiveIntent = /(xoa|luu tru|loai bo|dua ra khoi he thong)/.test(normalizedPrompt) && /(khach hang|khach)/.test(normalizedPrompt)
      if (archiveIntent) {
        const customers = await listCustomers(actor)
        const allRequested = /(tat ca|toan bo|het danh sach|toan danh sach)/.test(normalizedPrompt)
        const digits = prompt.replace(/\\D/g, '')
        const matched = allRequested ? customers : customers.filter(customer => {
          const name = customer.fullName.toLocaleLowerCase('vi').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/đ/g, 'd')
          const phone = (customer.phone ?? '').replace(/\\D/g, '')
          return (name.length > 2 && normalizedPrompt.includes(name)) || (digits.length >= 8 && phone.length >= 8 && phone.includes(digits))
        })
        if (!allRequested && matched.length === 0) {
          setMessages(previous => [...previous, { id: crypto.randomUUID(), role: 'assistant', content: 'Em chưa xác định được khách hàng cần lưu trữ. Anh hãy nêu tên hoặc số điện thoại cụ thể, hoặc nói rõ “lưu trữ tất cả khách hàng”. Em sẽ hiển thị danh sách và xin xác nhận trước khi thực hiện.', source: 'local' }])
          return
        }
        if (matched.length > 1 && !allRequested) {
          setMessages(previous => [...previous, { id: crypto.randomUUID(), role: 'assistant', content: 'Có ' + matched.length + ' hồ sơ gần khớp. Anh vui lòng cung cấp số điện thoại hoặc tên đầy đủ chính xác để tránh lưu trữ nhầm người.', source: 'local' }])
          return
        }
        if (!matched.length) {
          setMessages(previous => [...previous, { id: crypto.randomUUID(), role: 'assistant', content: 'Danh sách khách hàng hiện tại không có hồ sơ nào để lưu trữ.', source: 'local' }])
          return
        }
        setPendingCustomerArchive(matched)
        const preview = matched.slice(0, 12).map((customer, index) => (index + 1) + '. ' + customer.fullName + (customer.phone ? ' · ' + customer.phone : '')).join('\\n')
        setMessages(previous => [...previous, { id: crypto.randomUUID(), role: 'assistant', content: 'Em tìm thấy ' + matched.length + ' hồ sơ sẽ được lưu trữ:\\n' + preview + (matched.length > 12 ? '\\n… và ' + (matched.length - 12) + ' hồ sơ khác.' : '') + '\\n\\nĐây là thao tác lưu trữ, không xóa lịch sử hóa đơn/thanh toán. Để tiếp tục, anh gõ “XÁC NHẬN LƯU TRỮ”. Gõ “HỦY” để dừng.', source: 'local' }])
        return
      }


      if (pendingProductAction) {
        if (/^(huy|huy bo|khong|dung lai)$/.test(normalizedPrompt.trim())) {
          setPendingProductAction(null)
          setMessages(previous => [...previous, { id: crypto.randomUUID(), role: 'assistant', content: 'Đã hủy thao tác. Dữ liệu kho không thay đổi.', source: 'local' }])
          return
        }
        if (pendingProductAction.kind === 'create' && pendingProductAction.phase === 'details') {
          const quantityMatch = prompt.match(/(?:số lượng|nhập kho|tồn đầu|ton dau|so luong)\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i) ?? prompt.match(/^\s*(\d+(?:[.,]\d+)?)/)
          const costMatch = prompt.match(/(?:giá vốn|gia von|cost)\s*[:=]?\s*([\d.,]+)\s*(triệu|trieu|nghìn|nghin|ngàn|ngan|k)?/i)
          const quantity = quantityMatch ? Number(quantityMatch[1].replace(',', '.')) : pendingProductAction.quantity
          const multiplier = /^(triệu|trieu)$/i.test(costMatch?.[2] ?? '') ? 1_000_000 : /^(nghìn|nghin|ngàn|ngan|k)$/i.test(costMatch?.[2] ?? '') ? 1000 : 1
          const cost = costMatch ? parseMoneyVnd(costMatch[1], multiplier) : pendingProductAction.unitCostVnd
          if (!quantity || !Number.isFinite(quantity) || quantity <= 0 || cost === null || cost === undefined) {
            setPendingProductAction({ ...pendingProductAction, quantity: quantity && quantity > 0 ? quantity : null, unitCostVnd: cost ?? null })
            setMessages(previous => [...previous, { id: crypto.randomUUID(), role: 'assistant', content: 'Để nhập tồn chính xác, bạn vui lòng gửi đủ số lượng ban đầu và giá vốn mỗi đơn vị. Ví dụ: “Số lượng 10, giá vốn 120.000”. Chưa có dữ liệu nào được ghi.', source: 'local' }])
            return
          }
          const next = { ...pendingProductAction, phase: 'confirm' as const, quantity, unitCostVnd: cost }
          setPendingProductAction(next)
          setMessages(previous => [...previous, { id: crypto.randomUUID(), role: 'assistant', content: 'Xác nhận tạo sản phẩm và nhập tồn đầu kỳ?\n\nTên: ' + next.input.name + '\nMã SKU: ' + next.input.sku + '\nGiá bán: ' + next.input.salePriceVnd.toLocaleString('vi-VN') + ' ₫\nSố lượng nhập: ' + quantity + ' ' + next.input.unit + '\nGiá vốn/đơn vị: ' + cost.toLocaleString('vi-VN') + ' ₫\n\nGõ “XÁC NHẬN” để ghi vào kho hoặc “HỦY” để dừng.', source: 'local' }])
          return
        }
        if (/^(xac nhan|xac nhan them san pham|dong y|luu)$/.test(normalizedPrompt.trim())) {
          if (pendingProductAction.kind === 'create') {
            if (pendingProductAction.quantity === null || pendingProductAction.unitCostVnd === null) {
              setMessages(previous => [...previous, { id: crypto.randomUUID(), role: 'assistant', content: 'Em còn thiếu số lượng nhập và giá vốn mỗi đơn vị. Vui lòng cung cấp hai thông tin đó trước khi xác nhận.', source: 'local' }])
              return
            }
            const product = await createProductWithOpeningStock(actor, pendingProductAction.input, pendingProductAction.quantity, pendingProductAction.unitCostVnd)
            setPendingProductAction(null)
            setMessages(previous => [...previous, { id: crypto.randomUUID(), role: 'assistant', content: 'Đã tạo sản phẩm và ghi nhận tồn đầu kỳ thành công.\n' + product.name + ' · SKU ' + (product.sku ?? '') + ' · Giá bán ' + (product.salePriceVnd ?? 0).toLocaleString('vi-VN') + ' ₫ · Tồn ' + pendingProductAction.quantity + ' ' + product.unit + '. Giao dịch đã được ghi lịch sử kiểm kê.', source: 'local' }])
            return
          }
          const product = pendingProductAction.product
          const saved = await saveProduct(actor, { name: product.name, sku: product.sku ?? '', category: product.category, unit: product.unit, salePriceVnd: pendingProductAction.salePriceVnd, trackingMode: product.trackingMode, minimumStock: product.minimumStock, active: product.active, customFields: product.customFields ?? {} }, product.id)
          setPendingProductAction(null)
          setMessages(previous => [...previous, { id: crypto.randomUUID(), role: 'assistant', content: 'Đã cập nhật giá bán sản phẩm ' + saved.name + ' · SKU ' + (saved.sku ?? '') + ' thành ' + (saved.salePriceVnd ?? 0).toLocaleString('vi-VN') + ' ₫.', source: 'local' }])
          return
        }
        setMessages(previous => [...previous, { id: crypto.randomUUID(), role: 'assistant', content: 'Em đang chờ xác nhận thao tác sản phẩm. Gõ “XÁC NHẬN” để thực hiện hoặc “HỦY” để dừng.', source: 'local' }])
        return
      }

      const createProductIntent = /(thêm|tạo|nhập|bổ sung)/.test(normalizedPrompt) && /(sản phẩm|mặt hàng)/.test(normalizedPrompt) && /(mã|sku)/.test(normalizedPrompt)
      if (createProductIntent) {
        const parsed = parseProductCreateCommand(prompt)
        if (!parsed) {
          setMessages(previous => [...previous, { id: crypto.randomUUID(), role: 'assistant', content: 'Em nhận ra bạn muốn thêm sản phẩm, nhưng chưa đọc đủ tên, mã SKU hoặc giá bán. Vui lòng viết: “Thêm sản phẩm [tên] mã [SKU] giá [giá]”.', source: 'local' }])
          return
        }
        const existing = await listProducts(actor)
        if (existing.some(product => (product.sku ?? '').toUpperCase() === parsed.input.sku)) {
          setMessages(previous => [...previous, { id: crypto.randomUUID(), role: 'assistant', content: 'Mã SKU ' + parsed.input.sku + ' đã tồn tại. Em không tạo bản trùng; hãy yêu cầu sửa sản phẩm theo mã SKU này.', source: 'local' }])
          return
        }
        setPendingProductAction({ kind: 'create', phase: parsed.quantity && parsed.unitCostVnd !== null ? 'confirm' : 'details', input: parsed.input, quantity: parsed.quantity, unitCostVnd: parsed.unitCostVnd })
        if (!parsed.quantity || parsed.unitCostVnd === null) {
          setMessages(previous => [...previous, { id: crypto.randomUUID(), role: 'assistant', content: 'Em đã nhận thông tin sản phẩm:\n' + parsed.input.name + ' · SKU ' + parsed.input.sku + ' · Giá bán ' + parsed.input.salePriceVnd.toLocaleString('vi-VN') + ' ₫.\n\nĐể ghi tồn kho và tính lợi nhuận chính xác, cần thêm số lượng nhập ban đầu và giá vốn mỗi đơn vị. Ví dụ: “Số lượng 10, giá vốn 120.000”. Chưa ghi dữ liệu.', source: 'local' }])
          return
        }
        setMessages(previous => [...previous, { id: crypto.randomUUID(), role: 'assistant', content: 'Bạn xác nhận tạo sản phẩm ' + parsed.input.name + ' (SKU ' + parsed.input.sku + '), giá bán ' + parsed.input.salePriceVnd.toLocaleString('vi-VN') + ' ₫, nhập ' + parsed.quantity + ' ' + parsed.input.unit + ' với giá vốn ' + (parsed.unitCostVnd ?? 0).toLocaleString('vi-VN') + ' ₫/đơn vị? Gõ “XÁC NHẬN” hoặc “HỦY”.', source: 'local' }])
        return
      }

      const updateProductIntent = parseProductPriceUpdate(prompt)
      if (updateProductIntent) {
        const products = await listProducts(actor)
        const product = products.find(item => (item.sku ?? '').toUpperCase() === updateProductIntent.sku)
        if (!product) {
          setMessages(previous => [...previous, { id: crypto.randomUUID(), role: 'assistant', content: 'Không tìm thấy sản phẩm có SKU ' + updateProductIntent.sku + ' trong salon hiện tại. Không có dữ liệu nào thay đổi.', source: 'local' }])
          return
        }
        setPendingProductAction({ kind: 'update', phase: 'confirm', product, salePriceVnd: updateProductIntent.salePriceVnd })
        setMessages(previous => [...previous, { id: crypto.randomUUID(), role: 'assistant', content: 'Xác nhận cập nhật giá bán?\n' + product.name + ' · SKU ' + updateProductIntent.sku + '\nGiá cũ: ' + (product.salePriceVnd ?? 0).toLocaleString('vi-VN') + ' ₫\nGiá mới: ' + updateProductIntent.salePriceVnd.toLocaleString('vi-VN') + ' ₫\n\nGõ “XÁC NHẬN” hoặc “HỦY”.', source: 'local' }])
        return
      }

      const instruction = parseMemoryInstruction(prompt)
      if (instruction) {
        const saved = await saveOwnerMemory(actor, instruction.category, instruction.title, instruction.content)
        await refreshLongTermMemories()
        setMessages(previous => [...previous, { id: crypto.randomUUID(), role: 'assistant', content: 'Mình đã lưu vào trí nhớ dài hạn trên thiết bị này.\n\n**' + saved.title + '**\n' + saved.content + '\n\nMục này hiện chỉ nằm trên thiết bị đang dùng; chưa được đồng bộ P2P sang thiết bị khác. Khi hệ thống ghép đôi P2P hoàn thành, bộ nhớ sẽ được đưa vào hàng đợi đồng bộ mã hóa.', source: 'local' }])
        return
      }

      const about = answerAssistantAbout(prompt)
      if (about) {
        setMessages(previous => [...previous, { id: crypto.randomUUID(), role: 'assistant', content: about, source: 'local' }])
        return
      }

      if (isAssistantGreeting(prompt)) {
        setMessages(previous => [...previous, { id: crypto.randomUUID(), role: 'assistant', content: ownerName ? 'Dạ, em đây anh ' + ownerName + '! Anh cần em tra cứu thông tin hay xem báo cáo gì ạ?' : 'Dạ, em đây ạ! Mình cần em tra cứu thông tin hay xem báo cáo gì ạ?', source: 'local' }])
        return
      }

      if (isMemoryRecallQuestion(prompt)) {
        const rows = await refreshLongTermMemories()
        setMessages(previous => [...previous, { id: crypto.randomUUID(), role: 'assistant', content: answerFromMemories(rows), source: 'local' }])
        return
      }

      const trainedShortcut = findMatchingAssistantShortcut(longTermMemories, prompt)
      const learnedPrompt = applyLearnedVocabulary(longTermMemories, prompt)
      const local = await answerOwnerQuestion(actor.salonId, trainedShortcut?.content ?? learnedPrompt)
      const nextMemory = learnAssistantHabit(actor.salonId, actor.actorId, local.intent, local.period)
      setMemory(nextMemory)
      const relevant = selectRelevantMemories(longTermMemories, prompt)
      let answer = trainedShortcut ? 'Theo câu hỏi nghiệp vụ bạn đã dạy (“' + trainedShortcut.content.replace(/^\.\s*/, '') + '”):\n\n' + local.answer : local.answer
      let source: Message['source'] = 'local'
      if (relevant.length && /(ke hoach|lap ke hoach|nen lam gi|thoi quen|uu tien|buoi sang|hang ngay)/i.test(prompt.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd'))) {
        answer += '\n\n**Điều mình đã ghi nhớ có liên quan**\n' + relevant.map(item => '• ' + item.content).join('\n')
      }
      if (!trainedShortcut && !isGuideQuestion(prompt) && needsAdviser(prompt, local.intent)) {
        if (geminiReady) {
          try {
            const safeQuestion = await redactQuestionForGemini(actor.salonId, prompt)
            answer += '\n\n**Gợi ý từ trợ lý AI**\n' + await askGeminiAdviser(safeQuestion, local.safeContext, describeAssistantMemory(nextMemory))
            source = 'gemini'
          } catch {
            setAdviserNotice('Trợ lý AI chưa kết nối được. Em vẫn trả lời bằng dữ liệu có sẵn trên thiết bị.')
          }
        } else {
          setAdviserNotice('Trợ lý AI chưa được kết nối. Các chức năng tra cứu trên thiết bị vẫn hoạt động bình thường.')
        }
      }
      setMessages(previous => [...previous, { id: crypto.randomUUID(), role: 'assistant', content: makeAssistantLanguageFriendly(answer), source }])
    } catch {
      setError('Mình chưa xử lý được yêu cầu trên thiết bị. Bạn kiểm tra lại ứng dụng và thử gửi câu hỏi lần nữa nhé.')
    } finally {
      setBusy(false)
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    void send()
  }

  function resetMemory() {
    if (!window.confirm('Xóa phần ghi nhớ thói quen sử dụng trên thiết bị này? Trí nhớ dài hạn và dữ liệu kinh doanh không bị ảnh hưởng.')) return
    clearAssistantMemory(actor.salonId, actor.actorId)
    setMemory(readAssistantMemory(actor.salonId, actor.actorId))
  }

  async function forgetLongTermMemory(memoryId: string) {
    if (!window.confirm('Lưu trữ mục trí nhớ này? Trợ lý sẽ không sử dụng mục đó nữa.')) return
    await archiveOwnerMemory(actor, memoryId)
    await refreshLongTermMemories()
  }

  return <section className="work-page assistant-page">
    <div className="work-intro">
      <div><small>TRỢ LÝ ĐỒNG HÀNH TÓC QUYỀN</small><h2>Trợ lý của chủ tiệm</h2><p>Trợ lý lưu những điều bạn chủ động dặn nhớ trên thiết bị này. Khi có kết nối, trợ lý có thể dùng AI để tư vấn thêm.</p></div>
      <span className="assistant-role-badge">OWNER</span>
    </div>
    <div className="assistant-status-row">
      <div><span className="assistant-status-dot"/> Trợ lý sẵn sàng</div>
      <div className={geminiReady ? 'assistant-gemini-ready' : 'assistant-gemini-idle'}><Sparkles size={14}/> Trợ lý AI {geminiReady ? 'đã kết nối' : 'chưa kết nối'}</div>
    </div>
    <div className="assistant-chat" aria-live="polite" aria-relevant="additions" ref={chatRef} onScroll={handleChatScroll}>
      {messages.map(message => <article className={'assistant-message ' + message.role} key={message.id}>
        <span className="assistant-message-icon">{message.role === 'assistant' ? <Bot size={17}/> : <UserRound size={17}/>}</span>
        <div className="assistant-message-body">
          <small>{message.role === 'assistant' ? (message.source === 'gemini' ? 'TRỢ LÝ · GEMINI CỐ VẤN' : 'TRỢ LÝ TÓC QUYỀN') : 'BẠN'}</small>
          <div className="assistant-message-content">{message.content.split('\n').map((line, index) => <p key={index}>{line.replaceAll('**', '').replaceAll('_', '') || '\u00a0'}</p>)}</div>
        </div>
      </article>)}
      {busy && <div className="assistant-thinking"><Brain size={16}/> Em đang tìm thông tin trong dữ liệu của tiệm…</div>}
    </div>
    <div className="assistant-chat-meta">Thông tin được xem từ dữ liệu lưu trên thiết bị này; hiện chưa tự chuyển sang thiết bị khác.</div>
    {adviserNotice && <div className="assistant-adviser-note" role="status">{adviserNotice}</div>}
    {showLatest && <button type="button" className="assistant-latest-button" onClick={goToLatest}>↓ Tin nhắn mới</button>}
    {error && <p className="form-error" role="alert">{error}</p>}
    <form className="assistant-composer" onSubmit={submit}>
      <textarea aria-label="Nhập câu hỏi cho trợ lý" rows={3} maxLength={4000} value={question} onChange={event => setQuestion(event.target.value)} placeholder="Hỏi về công việc, cách dùng app, doanh thu, khách hàng hoặc kho…" />
      <button className="primary-button" disabled={busy || !question.trim()}><Send size={16}/> Gửi câu hỏi</button>
    </form>
    <div className="assistant-suggestions"><div className="assistant-section-title">Gợi ý câu hỏi</div><div>{suggestions.map(item => <button key={item} type="button" className="assistant-suggestion" onClick={() => void send(item)} disabled={busy}>{item}</button>)}</div></div>
    <div className="assistant-memory">
      <div className="assistant-memory-icon"><Brain size={19}/></div>
      <div><strong>Trí nhớ thói quen</strong><p>{describeAssistantMemory(memory)}</p><small>Thống kê lượt hỏi được lưu riêng trên thiết bị này.</small></div>
      <button type="button" className="subtle-button" onClick={resetMemory}><Eraser size={14}/> Xóa</button>
    </div>
    <div className="assistant-memory">
      <div className="assistant-memory-icon"><Brain size={19}/></div>
      <div><strong>Điều trợ lý đã ghi nhớ · {longTermMemories.length} mục</strong>
        <p>Lưu thông tin cá nhân, sở thích và câu hỏi nghiệp vụ do chủ tiệm tự dạy. Ví dụ: “Hãy ghi nhớ thêm. Tổng hợp danh sách nhân viên xuất sắc tháng này”.</p>
        {longTermMemories.length > 0 ? <ul>{longTermMemories.map(item => <li key={item.id}><strong>{item.title}:</strong> {item.content} <button type="button" className="subtle-button" onClick={() => void forgetLongTermMemory(item.id)} aria-label="Lưu trữ trí nhớ"><Trash2 size={13}/></button></li>)}</ul> : <small>Chưa có mục nào. Hãy bắt đầu bằng “Hãy ghi nhớ…”</small>}
        <small>Những điều đã lưu chỉ có trên thiết bị này, chưa tự chuyển sang thiết bị khác.</small>
      </div>
    </div>
    <p className="assistant-privacy-note">Trợ lý chỉ ghi nhớ khi bạn chủ động yêu cầu. Bạn có thể xem hoặc lưu trữ các mục đã nhớ. Trợ lý không tự sửa dữ liệu kinh doanh.</p>
  </section>
}
