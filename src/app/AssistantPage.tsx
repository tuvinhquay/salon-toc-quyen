import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react'
import { Bot, Brain, Eraser, Send, Sparkles, UserRound, Trash2 } from 'lucide-react'
import { useOwnerContext } from '../auth/OwnerContext'
import { useAuth } from '../auth/AuthProvider'
import type { AssistantMemoryRecord, Customer, Product } from '../db/types'
import { deleteAssistantEpisode, formatAssistantEpisodes, listRecentAssistantEpisodes, loadAssistantChatHistory, pruneAssistantMemory, recordAssistantEpisode, saveAssistantChatSnapshot, searchAssistantEpisodes } from './assistant-memory-persistence'
import { isAssistantEpisodeRecallQuestion, shouldRememberConversation } from './assistant-memory-retention'
import type { CustomerInput, ProductInput } from '../db/schema'
import { answerOwnerQuestion, detectAssistantIntent, redactQuestionForGemini } from './assistant-local'
import { classifyAssistantRoute, sanitizeQuestionForGemini } from './assistant-routing'
import { clearAssistantMemory, describeAssistantMemory, learnAssistantHabit, readAssistantMemory } from './assistant-memory'
import { answerAssistantAbout, answerFromMemories, applyLearnedVocabulary, findMatchingAssistantShortcut, isAssistantGreeting, isMemoryRecallQuestion, parseMemoryInstruction, selectRelevantMemories } from './assistant-brain'
import { archiveOwnerMemory, listOwnerMemories, saveOwnerMemory } from './assistant-brain-store'
import { archiveCustomers, createProductWithOpeningStock, listCustomers, listProducts, saveCustomer, saveProduct } from '../db/repositories'
import { askGeminiAdviser, askGeminiConversation, getGeminiConfigurationStatus, getGeminiErrorDetails, isGeminiAssistantReady, testGeminiConnection } from './assistant-gemini'
import { makeAssistantLanguageFriendly } from './assistant-language'
import { isGuideQuestion } from './guide-content'
import { assertEnaOwnerActor } from './assistant-ena-policy'
import { parseCustomerCreateCommand, parseCustomerPhoneUpdate, parseProductCreateCommand } from './assistant-ena-actions'
import { clearEnaUnreadCount, incrementEnaUnreadCount } from './assistant-notifications'

type Message = { id: string; role: 'assistant' | 'user'; content: string; source?: 'local' | 'gemini'; createdAt?: string }

type PendingProductAction =
  | { kind: 'create'; phase: 'details' | 'confirm'; input: ProductInput; quantity: number | null; unitCostVnd: number | null }
  | { kind: 'update'; phase: 'confirm'; product: Product; salePriceVnd: number }
  | { kind: 'archive'; phase: 'confirm'; product: Product }
type PendingCustomerSave = { kind: 'create' | 'update'; input: CustomerInput; customerId?: string }

const parseMoneyVnd = (raw: string, multiplier = 1) => {
  const digits = raw.replace(/[.,\s]/g, '')
  const value = Number(digits) * multiplier
  return Number.isFinite(value) && value >= 0 ? Math.round(value) : null
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
  const [recentEpisodes, setRecentEpisodes] = useState<Awaited<ReturnType<typeof listRecentAssistantEpisodes>>>([])
  const [chatHistoryScope, setChatHistoryScope] = useState('')
  const [memoryStats, setMemoryStats] = useState({ chatCount: 0, episodeCount: 0, bytes: 0 })
  const [pendingCustomerArchive, setPendingCustomerArchive] = useState<Customer[] | null>(null)
  const [pendingCustomerSave, setPendingCustomerSave] = useState<PendingCustomerSave | null>(null)
  const [pendingProductAction, setPendingProductAction] = useState<PendingProductAction | null>(null)
  const [busy, setBusy] = useState(false)
  const [busyLabel, setBusyLabel] = useState('Em đang xử lý yêu cầu…')
  const [error, setError] = useState<string | null>(null)
  const [adviserNotice, setAdviserNotice] = useState<string | null>(null)
  const [geminiTestState, setGeminiTestState] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle')
  const [geminiTestMessage, setGeminiTestMessage] = useState<string | null>(null)
  const chatRef = useRef<HTMLDivElement | null>(null)
  const stickToLatestRef = useRef(true)
  const lastAssistantMessageIdRef = useRef('welcome')
  const [showLatest, setShowLatest] = useState(false)
  const geminiReady = isGeminiAssistantReady()
  const geminiConfigStatus = getGeminiConfigurationStatus()

  useEffect(() => {
    let active = true
    void Promise.all([
      listOwnerMemories(actor.salonId, actor.actorId),
      loadAssistantChatHistory(actor),
      pruneAssistantMemory(actor),
      listRecentAssistantEpisodes(actor, 8),
    ]).then(([rows, history, stats, episodes]) => {
      if (!active) return
      setLongTermMemories(rows)
      setRecentEpisodes(episodes)
      setMemoryStats(stats)
      if (history.length) setMessages(history)
      else setMessages([{ id: 'welcome', role: 'assistant', content: ownerName ? 'Dạ, em chào anh ' + ownerName + '! Hôm nay anh cần em hỗ trợ gì ạ? Em có thể hướng dẫn cách dùng app, tra cứu nhân viên, khách hàng, sản phẩm, lịch hẹn và thống kê doanh thu. Anh cứ nói ngắn gọn; nếu chưa hiểu rõ, em sẽ hỏi lại nhé.' : 'Dạ, em chào anh/chị! Hôm nay mình cần em hỗ trợ gì ạ? Em có thể tra cứu nhân viên, khách hàng, sản phẩm, lịch hẹn và thống kê doanh thu. Anh/chị cứ nói ngắn gọn; nếu chưa hiểu rõ, em sẽ hỏi lại nhé.', source: 'local' }])
      setChatHistoryScope(actor.salonId + ':' + actor.actorId)
    }).catch(() => {
      if (!active) return
      setError('Không đọc được bộ nhớ ENA trên thiết bị.')
      setChatHistoryScope(actor.salonId + ':' + actor.actorId)
    })
    return () => { active = false }
  }, [actor.salonId, actor.actorId])

  useEffect(() => {
    if (chatHistoryScope !== actor.salonId + ':' + actor.actorId) return
    void saveAssistantChatSnapshot(actor, messages).then(async () => {
      const stats = await pruneAssistantMemory(actor)
      setMemoryStats(stats)
      const episodes = await listRecentAssistantEpisodes(actor, 8)
      setRecentEpisodes(episodes)
    }).catch(() => setError('ENA chưa thể cập nhật bộ nhớ hội thoại. Dữ liệu salon không bị ảnh hưởng.'))

    const assistant = messages[messages.length - 1]
    const userMessage = messages[messages.length - 2]
    if (assistant?.role === 'assistant' && userMessage?.role === 'user' && shouldRememberConversation(userMessage.content, assistant.content)) {
      void recordAssistantEpisode(actor, 'conversation', 'Trao đổi: ' + userMessage.content + ' — ENA: ' + assistant.content.slice(0, 240), 2)
    }
  }, [chatHistoryScope, messages, actor.salonId, actor.actorId])

  useLayoutEffect(() => {
    const node = chatRef.current
    if (!node) return
    if (stickToLatestRef.current) {
      node.scrollTop = node.scrollHeight
      setShowLatest(false)
    } else {
      setShowLatest(true)
    }
  }, [messages, busy])

  useEffect(() => {
    const latestAssistant = [...messages].reverse().find(message => message.role === 'assistant')
    if (!latestAssistant || latestAssistant.id === lastAssistantMessageIdRef.current) return
    lastAssistantMessageIdRef.current = latestAssistant.id
    if (!stickToLatestRef.current) incrementEnaUnreadCount()
  }, [messages])

  function handleChatScroll() {
    const node = chatRef.current
    if (!node) return
    const atLatest = node.scrollHeight - node.clientHeight - node.scrollTop < 72
    stickToLatestRef.current = atLatest
    if (atLatest) clearEnaUnreadCount()
    setShowLatest(!atLatest)
  }

  function goToLatest() {
    const node = chatRef.current
    if (!node) return
    stickToLatestRef.current = true
    node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' })
    clearEnaUnreadCount()
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
    try { assertEnaOwnerActor(actor, user?.uid) } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'ENA không thể xác minh quyền truy cập.')
      return
    }
    setQuestion('')
    setError(null)
    setAdviserNotice(null)
    stickToLatestRef.current = true
    setShowLatest(false)
    setMessages(previous => [...previous, { id: crypto.randomUUID(), role: 'user', content: prompt }])
    setBusy(true)
    setBusyLabel('Em đang xử lý yêu cầu…')
    try {
      const normalizedPrompt = prompt.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')
      if (pendingCustomerSave) {
        if (/^(huy|huy bo|khong|dung lai)$/.test(normalizedPrompt.trim())) {
          setPendingCustomerSave(null)
          setMessages(previous => [...previous, { id: crypto.randomUUID(), role: 'assistant', content: 'Dạ, em đã hủy thao tác. Hồ sơ khách hàng không thay đổi.' }])
          return
        }
        if (/^(xac nhan|xac nhan them khach hang|xac nhan cap nhat|dong y|luu)$/.test(normalizedPrompt.trim())) {
          const saved = await saveCustomer(actor, pendingCustomerSave.input, pendingCustomerSave.customerId)
          await recordAssistantEpisode(actor, pendingCustomerSave.kind === 'create' ? 'customer_created' : 'customer_updated', pendingCustomerSave.kind === 'create' ? 'Đã thêm hồ sơ khách hàng mới vào salon (thông tin liên hệ được giữ trong danh mục khách hàng, không sao chép vào trí nhớ ENA).' : 'Đã cập nhật hồ sơ một khách hàng trong salon (chi tiết nằm trong danh mục khách hàng).', 4)
          setPendingCustomerSave(null)
          setMessages(previous => [...previous, { id: crypto.randomUUID(), role: 'assistant', content: (pendingCustomerSave.kind === 'create' ? 'Đã thêm khách hàng ' : 'Đã cập nhật hồ sơ khách hàng ') + saved.fullName + (saved.phone ? ' · ' + saved.phone : '') + '. Thay đổi đã được ghi vào salon hiện tại và nhật ký thao tác.' }])
          return
        }
        setMessages(previous => [...previous, { id: crypto.randomUUID(), role: 'assistant', content: 'Em đang chờ xác nhận thay đổi hồ sơ khách hàng. Gõ “XÁC NHẬN” để thực hiện hoặc “HỦY” để dừng.' }])
        return
      }

      if (pendingCustomerArchive) {
        if (/^(xac nhan luu tru|xac nhan)$/.test(normalizedPrompt.trim())) {
          const count = await archiveCustomers(actor, pendingCustomerArchive.map(customer => customer.id))
          await recordAssistantEpisode(actor, 'customer_archived', 'Đã lưu trữ ' + count + ' hồ sơ khách hàng; lịch sử hóa đơn và thanh toán được giữ nguyên.', 4)
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

      const customerPhoneUpdate = parseCustomerPhoneUpdate(prompt)
      if (customerPhoneUpdate) {
        const customers = await listCustomers(actor)
        const normalizedName = customerPhoneUpdate.name.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')
        const matches = customers.filter(customer => customer.fullName.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd') === normalizedName)
        if (matches.length !== 1) {
          setMessages(previous => [...previous, { id: crypto.randomUUID(), role: 'assistant', content: matches.length ? 'Có nhiều hồ sơ trùng tên. Em chưa sửa để tránh nhầm khách; anh hãy cung cấp số điện thoại hiện tại của khách.' : 'Em chưa tìm thấy khách hàng có tên chính xác “' + customerPhoneUpdate.name + '”. Không có dữ liệu nào thay đổi.' }])
          return
        }
        const customer = matches[0]
        const input: CustomerInput = { fullName: customer.fullName, phone: customerPhoneUpdate.phone, email: customer.email ?? '', notes: customer.notes, groupIds: customer.groupIds ?? [], customFields: customer.customFields ?? {} }
        setPendingCustomerSave({ kind: 'update', customerId: customer.id, input })
        setMessages(previous => [...previous, { id: crypto.randomUUID(), role: 'assistant', content: 'Em tìm thấy đúng hồ sơ cần cập nhật:\nTên: ' + customer.fullName + '\nSố điện thoại cũ: ' + (customer.phone || 'Chưa có') + '\nSố điện thoại mới: ' + customerPhoneUpdate.phone + '\n\nChỉ số điện thoại được thay đổi. Anh xác nhận để lưu hay hủy thao tác?' }])
        return
      }

      const createCustomerIntent = /(them|tao|lap|dang ky)/.test(normalizedPrompt) && /(khach hang|khach)/.test(normalizedPrompt)
      if (createCustomerIntent) {
        const input = parseCustomerCreateCommand(prompt)
        if (!input) {
          setMessages(previous => [...previous, { id: crypto.randomUUID(), role: 'assistant', content: 'Em nhận ra anh muốn thêm khách hàng nhưng chưa đọc đủ tên hoặc số điện thoại hợp lệ. Ví dụ: “Thêm khách hàng Nguyễn Văn A, số điện thoại 0901234567”. Chưa có dữ liệu nào được ghi.' }])
          return
        }
        const customers = await listCustomers(actor)
        const phoneDigits = (input.phone ?? '').replace(/\D/g, '')
        const duplicate = customers.find(customer => customer.fullName.toLocaleLowerCase('vi') === input.fullName.toLocaleLowerCase('vi') || (phoneDigits.length >= 9 && (customer.phone ?? '').replace(/\D/g, '') === phoneDigits))
        if (duplicate) {
          setMessages(previous => [...previous, { id: crypto.randomUUID(), role: 'assistant', content: 'Em phát hiện hồ sơ có thể đã tồn tại: ' + duplicate.fullName + (duplicate.phone ? ' · ' + duplicate.phone : '') + '. Em không tạo trùng. Anh có thể yêu cầu cập nhật hồ sơ hiện có.' }])
          return
        }
        setPendingCustomerSave({ kind: 'create', input })
        setMessages(previous => [...previous, { id: crypto.randomUUID(), role: 'assistant', content: 'Em chuẩn bị thêm khách hàng mới:\nTên: ' + input.fullName + '\nSố điện thoại: ' + (input.phone || 'Chưa cung cấp') + '\nEmail: ' + (input.email || 'Chưa cung cấp') + '\nGhi chú: ' + (input.notes || 'Không có') + '\n\nAnh kiểm tra thông tin. Gõ “XÁC NHẬN” để lưu hoặc “HỦY” để dừng. Chưa có dữ liệu nào được ghi.' }])
        return
      }

      const archiveIntent = /(xoa|luu tru|loai bo|dua ra khoi he thong)/.test(normalizedPrompt) && /(khach hang|khach)/.test(normalizedPrompt)
      if (archiveIntent) {
        const customers = await listCustomers(actor)
        const allRequested = /(tat ca|toan bo|het danh sach|toan danh sach)/.test(normalizedPrompt)
        const digits = prompt.replace(/\D/g, '')
        const matched = allRequested ? customers : customers.filter(customer => {
          const name = customer.fullName.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')
          const phone = (customer.phone ?? '').replace(/\D/g, '')
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
        const preview = matched.slice(0, 12).map((customer, index) => (index + 1) + '. ' + customer.fullName + (customer.phone ? ' · ' + customer.phone : '')).join('\n')
        setMessages(previous => [...previous, { id: crypto.randomUUID(), role: 'assistant', content: 'Em tìm thấy ' + matched.length + ' hồ sơ sẽ được lưu trữ:\n' + preview + (matched.length > 12 ? '\n… và ' + (matched.length - 12) + ' hồ sơ khác.' : '') + '\n\nĐây là thao tác lưu trữ, không xóa lịch sử hóa đơn/thanh toán. Để tiếp tục, anh gõ “XÁC NHẬN LƯU TRỮ”. Gõ “HỦY” để dừng.', source: 'local' }])
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
          if (pendingProductAction.kind === 'archive') {
            const product = pendingProductAction.product
            const saved = await saveProduct(actor, { name: product.name, sku: product.sku ?? '', category: product.category, unit: product.unit, salePriceVnd: product.salePriceVnd ?? 0, trackingMode: product.trackingMode, minimumStock: product.minimumStock, active: false, customFields: product.customFields ?? {} }, product.id)
            await recordAssistantEpisode(actor, 'product_archived', 'Đã ngừng kinh doanh sản phẩm ' + saved.name + ' · SKU ' + (saved.sku ?? ''), 4)
            setPendingProductAction(null)
            setMessages(previous => [...previous, { id: crypto.randomUUID(), role: 'assistant', content: 'Đã ngừng kinh doanh sản phẩm ' + saved.name + '. Hồ sơ và lịch sử tồn kho vẫn được giữ nguyên.' }])
            return
          }
          if (pendingProductAction.kind === 'create') {
            if (pendingProductAction.quantity === null || pendingProductAction.unitCostVnd === null) {
              setMessages(previous => [...previous, { id: crypto.randomUUID(), role: 'assistant', content: 'Em còn thiếu số lượng nhập và giá vốn mỗi đơn vị. Vui lòng cung cấp hai thông tin đó trước khi xác nhận.', source: 'local' }])
              return
            }
            const product = await createProductWithOpeningStock(actor, pendingProductAction.input, pendingProductAction.quantity, pendingProductAction.unitCostVnd)
            await recordAssistantEpisode(actor, 'product_created', 'Đã thêm sản phẩm ' + product.name + ' · SKU ' + (product.sku ?? 'chưa có') + ' · giá vốn ' + pendingProductAction.unitCostVnd.toLocaleString('vi-VN') + ' ₫/đơn vị · giá bán ' + (product.salePriceVnd ?? 0).toLocaleString('vi-VN') + ' ₫ · tồn đầu ' + pendingProductAction.quantity + ' ' + product.unit, 5)
            setPendingProductAction(null)
            setMessages(previous => [...previous, { id: crypto.randomUUID(), role: 'assistant', content: 'Đã tạo sản phẩm và ghi nhận tồn đầu kỳ thành công.\n' + product.name + ' · SKU ' + (product.sku ?? '') + ' · Giá bán ' + (product.salePriceVnd ?? 0).toLocaleString('vi-VN') + ' ₫ · Tồn ' + pendingProductAction.quantity + ' ' + product.unit + '. Giao dịch đã được ghi lịch sử kiểm kê.', source: 'local' }])
            return
          }
          const product = pendingProductAction.product
          const saved = await saveProduct(actor, { name: product.name, sku: product.sku ?? '', category: product.category, unit: product.unit, salePriceVnd: pendingProductAction.salePriceVnd, trackingMode: product.trackingMode, minimumStock: product.minimumStock, active: product.active, customFields: product.customFields ?? {} }, product.id)
          await recordAssistantEpisode(actor, 'product_updated', 'Đã cập nhật giá bán sản phẩm ' + saved.name + ' · SKU ' + (saved.sku ?? '') + ' · giá bán mới ' + (saved.salePriceVnd ?? 0).toLocaleString('vi-VN') + ' ₫', 4)
          setPendingProductAction(null)
          setMessages(previous => [...previous, { id: crypto.randomUUID(), role: 'assistant', content: 'Đã cập nhật giá bán sản phẩm ' + saved.name + ' · SKU ' + (saved.sku ?? '') + ' thành ' + (saved.salePriceVnd ?? 0).toLocaleString('vi-VN') + ' ₫.', source: 'local' }])
          return
        }
        setMessages(previous => [...previous, { id: crypto.randomUUID(), role: 'assistant', content: 'Em đang chờ xác nhận thao tác sản phẩm. Gõ “XÁC NHẬN” để thực hiện hoặc “HỦY” để dừng.', source: 'local' }])
        return
      }

      const archiveProductIntent = /(?:^|\s)(?:xoa|luu tru|ngung kinh doanh|an)(?:\s|$)/.test(normalizedPrompt) && /(san pham|mat hang)/.test(normalizedPrompt)
      if (archiveProductIntent) {
        const skuMatch = prompt.match(/(?:mã|sku)\s+([a-z0-9-]+)/i)
        if (!skuMatch) {
          setMessages(previous => [...previous, { id: crypto.randomUUID(), role: 'assistant', content: 'Để tránh ngừng nhầm sản phẩm, anh vui lòng cung cấp mã SKU chính xác. ENA sẽ lưu trữ bằng cách ngừng kinh doanh, không xóa lịch sử kho.' }])
          return
        }
        const products = await listProducts(actor)
        const product = products.find(item => (item.sku ?? '').toUpperCase() === skuMatch[1].toUpperCase())
        if (!product) {
          setMessages(previous => [...previous, { id: crypto.randomUUID(), role: 'assistant', content: 'Em không tìm thấy sản phẩm có mã SKU ' + skuMatch[1].toUpperCase() + ' trong salon hiện tại. Không có dữ liệu nào thay đổi.' }])
          return
        }
        if (!product.active) {
          setMessages(previous => [...previous, { id: crypto.randomUUID(), role: 'assistant', content: 'Sản phẩm ' + product.name + ' đã được ngừng kinh doanh trước đó.' }])
          return
        }
        setPendingProductAction({ kind: 'archive', phase: 'confirm', product })
        setMessages(previous => [...previous, { id: crypto.randomUUID(), role: 'assistant', content: 'Anh xác nhận ngừng kinh doanh sản phẩm này?\nTên: ' + product.name + '\nSKU: ' + (product.sku ?? '') + '\nTồn kho và lịch sử giao dịch được giữ nguyên; sản phẩm sẽ không còn được chọn cho giao dịch mới.\n\nGõ “XÁC NHẬN” để tiếp tục hoặc “HỦY” để dừng.' }])
        return
      }

      const createProductIntent = /(them|tao|nhap|bo sung)/.test(normalizedPrompt) && /(san pham|mat hang)/.test(normalizedPrompt) && /(?:ma|sku)/.test(normalizedPrompt)
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

      if (isMemoryRecallQuestion(prompt) || isAssistantEpisodeRecallQuestion(prompt)) {
        const rows = await refreshLongTermMemories()
        const episodes = await searchAssistantEpisodes(actor, prompt, 6)
        const answer = answerFromMemories(rows) + '\n\n' + formatAssistantEpisodes(episodes)
        setMessages(previous => [...previous, { id: crypto.randomUUID(), role: 'assistant', content: answer, source: 'local' }])
        return
      }

      const intent = detectAssistantIntent(prompt)
      const route = classifyAssistantRoute(prompt, intent)
      if (route === 'chat') {
        setBusyLabel('ENA đang trò chuyện cùng Gemini…')
        if (!geminiReady) {
          setAdviserNotice('Gemini chưa sẵn sàng. Em chưa thể trả lời câu hỏi trò chuyện bằng AI; các chức năng tra cứu nội bộ vẫn dùng được.')
          setMessages(previous => [...previous, { id: crypto.randomUUID(), role: 'assistant', content: 'Hiện Gemini chưa kết nối nên em chưa thể trò chuyện hoặc sáng tác bằng AI. Anh vẫn có thể dùng các chức năng tra cứu dữ liệu tiệm trên thiết bị.', source: 'local' }])
          return
        }
        try {
          const recentQuestions = messages.filter(message => message.role === 'user').slice(-3).map(message => sanitizeQuestionForGemini(message.content).slice(0, 300)).join('\n').slice(-700)
          const remembered = await searchAssistantEpisodes(actor, prompt, 4)
          const memoryContext = remembered.length ? '\n\nKý ức nội bộ liên quan (đã được lọc, chỉ để tham khảo):\n' + remembered.map(item => '• ' + item.summary).join('\n').slice(0, 900) : ''
          const answer = await askGeminiConversation(sanitizeQuestionForGemini(prompt), 'owner', (recentQuestions + memoryContext).slice(-1400))
          setMessages(previous => [...previous, { id: crypto.randomUUID(), role: 'assistant', content: answer, source: 'gemini' }])
        } catch (cause) {
          const detail = getGeminiErrorDetails(cause)
          setAdviserNotice('Gemini chưa phản hồi: ' + detail + '. Anh có thể thử gửi lại sau; dữ liệu nội bộ không bị ảnh hưởng.')
          setMessages(previous => [...previous, { id: crypto.randomUUID(), role: 'assistant', content: 'Em chưa nhận được phản hồi từ Gemini lần này. Anh thử gửi lại sau ít phút nhé. Các dữ liệu trong tiệm vẫn an toàn và không bị thay đổi.', source: 'local' }])
        }
        return
      }

      if (route === 'hybrid') setBusyLabel('ENA đang kết hợp dữ liệu tiệm với Gemini…')
      else setBusyLabel('ENA đang đọc dữ liệu của salon…')

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
      const geminiReadableIntent = ['finance', 'inventory', 'appointments', 'services', 'overview', 'general'].includes(local.intent)
      if (!trainedShortcut && geminiReadableIntent && !isGuideQuestion(prompt)) {
        if (geminiReady) {
          try {
            const safeQuestion = await redactQuestionForGemini(actor.salonId, prompt)
            answer = await askGeminiAdviser(safeQuestion, local.safeContext + '\n\nKết quả nghiệp vụ đã được ứng dụng tính và xác minh:\n' + local.answer, describeAssistantMemory(nextMemory))
            source = 'gemini'
          } catch (cause) {
            const detail = getGeminiErrorDetails(cause)
            setAdviserNotice('Gemini chưa phản hồi: ' + detail + '. Em vẫn giữ câu trả lời từ dữ liệu nội bộ trên thiết bị.')
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

  async function testGemini() {
    setGeminiTestState('testing')
    setGeminiTestMessage(null)
    try {
      await testGeminiConnection()
      setGeminiTestState('success')
      setGeminiTestMessage('Gemini đã phản hồi thành công. Kết nối API đang hoạt động.')
    } catch (cause) {
      setGeminiTestState('failed')
      const detail = getGeminiErrorDetails(cause)
      const normalized = detail.toLowerCase()
      const summary = /GEMINI_API_KEY_MISSING/.test(normalized) ? 'Máy chủ Vite chưa đọc thấy GEMINI_API_KEY. Kiểm tra biến trong .env.local ở thư mục gốc rồi khởi động lại Vite.' : /GEMINI_API_KEY_REJECTED/.test(normalized) ? 'Google từ chối khóa Gemini. Kiểm tra khóa AI Studio và giới hạn API của khóa; không gửi khóa cho người khác.' : /GEMINI_ACCESS_DENIED/.test(normalized) ? 'Google từ chối quyền truy cập API cho dự án hoặc khóa hiện tại. Kiểm tra quyền Gemini API trong Google AI Studio.' : /GEMINI_MODEL_NOT_FOUND/.test(normalized) ? 'Model Gemini không được API nhận diện hoặc chưa khả dụng cho khóa này.' : /GEMINI_PROMPT_BLOCKED/.test(normalized) ? 'Yêu cầu bị bộ lọc an toàn của Gemini chặn.' : /GEMINI_NO_TEXT:MAX_TOKENS/.test(normalized) ? 'Gemini đã dùng hết giới hạn token cho suy luận trước khi tạo câu trả lời. Hãy tăng giới hạn đầu ra hoặc giảm mức suy luận.' : /429|quota|resource.exhausted|rate.limit/.test(normalized) ? 'Gemini đang hết lượt hoặc chạm giới hạn sử dụng. Bạn thử lại sau khi hạn mức được làm mới nhé.' : /GEMINI_SERVICE_UNAVAILABLE|503/.test(normalized) ? 'Dịch vụ Gemini đang quá tải tạm thời. Hãy thử lại sau ít phút.' : /GEMINI_TIMEOUT/.test(normalized) ? 'Gemini phản hồi quá chậm. Hãy thử lại sau ít phút.' : /GEMINI_LOCAL_ORIGIN_ONLY/.test(normalized) ? 'Hãy mở ứng dụng bằng địa chỉ localhost trên chính điện thoại đang chạy Termux.' : 'Gemini chưa trả về nội dung. Mã lỗi bên dưới giúp xác định bước bị lỗi.'
      setGeminiTestMessage(summary + '\nChi tiết: ' + detail)
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

  async function forgetEpisodeMemory(episodeId: string) {
    if (!window.confirm('Xóa vĩnh viễn ký ức này khỏi bộ nhớ ENA?')) return
    await deleteAssistantEpisode(actor, episodeId)
    setRecentEpisodes(await listRecentAssistantEpisodes(actor, 8))
    setMemoryStats(await pruneAssistantMemory(actor))
  }

  return <section className="work-page assistant-page">
    <div className="work-intro">
      <div><small>ENA · TRỢ LÝ ĐIỀU HÀNH SALON</small><h2>ENA – Trợ lý điều hành</h2><p>Một trợ lý duy nhất giúp anh tra cứu dữ liệu, quản lý công việc và thực hiện thao tác có xác nhận.</p></div>
      <span className="assistant-role-badge">OWNER</span>
    </div>
    <div className="assistant-status-row">
      <div><span className="assistant-status-dot"/> ENA sẵn sàng</div>
      <div className={geminiReady ? 'assistant-gemini-ready' : 'assistant-gemini-idle'}><Sparkles size={14}/> Bộ não Gemini {geminiReady ? 'đã kết nối' : 'chưa khả dụng'}</div>
      <button type="button" className="subtle-button" onClick={() => void testGemini()} disabled={!geminiReady || geminiTestState === 'testing'}><Sparkles size={14}/> {geminiTestState === 'testing' ? 'Đang kiểm tra…' : 'Kiểm tra kết nối'}</button>
    </div>
    
    {!geminiConfigStatus.expectedProject && <p className="assistant-adviser-note" role="alert">Cảnh báo: Firebase hiện đang kết nối project “{geminiConfigStatus.firebaseProjectId || 'chưa cấu hình'}”, không phải “salonquyen-f21fa”. Cảnh báo này liên quan Firebase Auth/Firestore; Gemini AI Studio dùng khóa riêng GEMINI_API_KEY nên đây không tự động là nguyên nhân lỗi Gemini.</p>}
    {geminiTestMessage && <p className={geminiTestState === 'success' ? 'assistant-gemini-test-success' : 'assistant-adviser-note'} role="status" style={{ whiteSpace: 'pre-wrap' }}>{geminiTestMessage}</p>}
    <div className="assistant-chat" aria-live="polite" aria-relevant="additions" ref={chatRef} onScroll={handleChatScroll}>
      {messages.map(message => <article className={'assistant-message ' + message.role} key={message.id}>
        <span className="assistant-message-icon">{message.role === 'assistant' ? <Bot size={17}/> : <UserRound size={17}/>}</span>
        <div className="assistant-message-body">
          <small>{message.role === 'assistant' ? 'ENA · TRỢ LÝ ĐIỀU HÀNH' : 'BẠN'}</small>
          <div className="assistant-message-content">{message.content.split('\n').map((line, index) => <p key={index}>{line.replaceAll('**', '').replaceAll('_', '') || '\u00a0'}</p>)}</div>
        </div>
      </article>)}
      {busy && <div className="assistant-thinking"><Brain size={16}/> {busyLabel}</div>}
    </div>
    
    {adviserNotice && <div className="assistant-adviser-note" role="status">{adviserNotice}</div>}
    {showLatest && <button type="button" className="assistant-latest-button" onClick={goToLatest}>↓ Tin nhắn mới</button>}
    {error && <p className="form-error" role="alert">{error}</p>}
    <form className="assistant-composer" onSubmit={submit}>
      <textarea aria-label="Nhập câu hỏi cho trợ lý" rows={3} maxLength={4000} value={question} onChange={event => setQuestion(event.target.value)} placeholder="Hỏi về công việc, cách dùng app, doanh thu, khách hàng hoặc kho…" />
      <button className="primary-button" disabled={busy || !question.trim()}><Send size={16}/> Gửi câu hỏi</button>
    </form>
    <details className="assistant-extra-panel"><summary>Gợi ý và ghi nhớ</summary>
    <div className="assistant-suggestions"><div className="assistant-section-title">Gợi ý câu hỏi</div><div>{suggestions.map(item => <button key={item} type="button" className="assistant-suggestion" onClick={() => void send(item)} disabled={busy}>{item}</button>)}</div></div>
    <div className="assistant-memory">
      <div className="assistant-memory-icon"><Brain size={19}/></div>
      <div><strong>Trí nhớ thói quen</strong><p>{describeAssistantMemory(memory)}</p><small>Thống kê lượt hỏi được lưu riêng trên thiết bị này.</small></div>
      <button type="button" className="subtle-button" onClick={resetMemory}><Eraser size={14}/> Xóa</button>
    </div>
    <div className="assistant-memory">
      <div className="assistant-memory-icon"><Brain size={19}/></div>
      <div><strong>Ký ức hội thoại và công việc · {memoryStats.episodeCount} mục</strong>
        <p>ENA tự lưu những thao tác đã xác nhận và trao đổi có ích; lời chào, xác nhận ngắn và nội dung rác được lọc. Lịch sử chat được giới hạn theo thời gian và dung lượng.</p>
        <small>Đang giữ khoảng {(memoryStats.bytes / 1024).toFixed(1)} KB · {memoryStats.chatCount} tin nhắn gần đây · lưu cục bộ trên thiết bị.</small>
        {recentEpisodes.length ? <ul>{recentEpisodes.map(item => <li key={item.id}><strong>{item.summary}</strong> <button type="button" className="subtle-button" onClick={() => void forgetEpisodeMemory(item.id)} aria-label="Xóa ký ức"><Trash2 size={13}/></button></li>)}</ul> : <small>Chưa có ký ức tự động. Khi anh xác nhận một thao tác, ENA sẽ ghi lại kết quả.</small>}
      </div>
    </div>
    <div className="assistant-memory">
      <div className="assistant-memory-icon"><Brain size={19}/></div>
      <div><strong>Điều trợ lý đã ghi nhớ · {longTermMemories.length} mục</strong>
        <p>Lưu thông tin cá nhân, sở thích và câu hỏi nghiệp vụ do chủ tiệm tự dạy. Ví dụ: “Hãy ghi nhớ thêm. Tổng hợp danh sách nhân viên xuất sắc tháng này”.</p>
        {longTermMemories.length > 0 ? <ul>{longTermMemories.map(item => <li key={item.id}><strong>{item.title}:</strong> {item.content} <button type="button" className="subtle-button" onClick={() => void forgetLongTermMemory(item.id)} aria-label="Lưu trữ trí nhớ"><Trash2 size={13}/></button></li>)}</ul> : <small>Chưa có mục nào. Hãy bắt đầu bằng “Hãy ghi nhớ…”</small>}
        <small>Những điều đã lưu chỉ có trên thiết bị này, chưa tự chuyển sang thiết bị khác.</small>
      </div>
    </div>
    </details>
  </section>
}
