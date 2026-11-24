import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Bot, Brain, Eraser, Send, Sparkles, UserRound, Trash2 } from 'lucide-react'
import { useOwnerContext } from '../auth/OwnerContext'
import { useAuth } from '../auth/AuthProvider'
import type { AssistantMemoryRecord } from '../db/types'
import { answerOwnerQuestion, redactQuestionForGemini } from './assistant-local'
import { clearAssistantMemory, describeAssistantMemory, learnAssistantHabit, readAssistantMemory } from './assistant-memory'
import { answerAssistantAbout, answerFromMemories, findMatchingAssistantShortcut, isAssistantGreeting, isMemoryRecallQuestion, parseMemoryInstruction, selectRelevantMemories } from './assistant-brain'
import { archiveOwnerMemory, listOwnerMemories, saveOwnerMemory } from './assistant-brain-store'
import { askGeminiAdviser, isGeminiAssistantReady } from './assistant-gemini'

type Message = { id: string; role: 'assistant' | 'user'; content: string; source?: 'local' | 'gemini' }
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
  'Ai đã tạo ra bạn?',
]
const needsAdviser = (question: string, intent: string) => intent === 'general' || intent === 'staff' || /(tu van|giai thich|de xuat|nen lam gi|lam sao|chien luoc|ke hoach|vi sao)/i.test(question.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd'))

export function AssistantPage() {
  const actor = useOwnerContext()
  const { user } = useAuth()
  const ownerName = (user?.displayName ?? '').trim().split(/\\s+/)[0]
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<Message[]>([{
    id: 'welcome',
    role: 'assistant',
    content: ownerName ? 'Dạ, em chào anh ' + ownerName + '! Hôm nay anh cần em hỗ trợ gì ạ? Em có thể tra cứu nhân viên, khách hàng, sản phẩm, lịch hẹn và thống kê doanh thu. Anh cứ nói ngắn gọn; nếu chưa hiểu rõ, em sẽ hỏi lại nhé.' : 'Dạ, em chào anh/chị! Hôm nay mình cần em hỗ trợ gì ạ? Em có thể tra cứu nhân viên, khách hàng, sản phẩm, lịch hẹn và thống kê doanh thu. Anh/chị cứ nói ngắn gọn; nếu chưa hiểu rõ, em sẽ hỏi lại nhé.',
    source: 'local',
  }])
  const [memory, setMemory] = useState(() => readAssistantMemory(actor.salonId, actor.actorId))
  const [longTermMemories, setLongTermMemories] = useState<AssistantMemoryRecord[]>([])
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
      const local = await answerOwnerQuestion(actor.salonId, trainedShortcut?.content ?? prompt)
      const nextMemory = learnAssistantHabit(actor.salonId, actor.actorId, local.intent, local.period)
      setMemory(nextMemory)
      const relevant = selectRelevantMemories(longTermMemories, prompt)
      let answer = trainedShortcut ? 'Theo câu hỏi nghiệp vụ bạn đã dạy (“' + trainedShortcut.content.replace(/^\.\s*/, '') + '”):\n\n' + local.answer : local.answer
      let source: Message['source'] = 'local'
      if (relevant.length && /(ke hoach|lap ke hoach|nen lam gi|thoi quen|uu tien|buoi sang|hang ngay)/i.test(prompt.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd'))) {
        answer += '\n\n**Điều mình đã ghi nhớ có liên quan**\n' + relevant.map(item => '• ' + item.content).join('\n')
      }
      if (!trainedShortcut && needsAdviser(prompt, local.intent)) {
        if (geminiReady) {
          try {
            const safeQuestion = await redactQuestionForGemini(actor.salonId, prompt)
            answer += '\n\n**Góc nhìn cố vấn Gemini**\n' + await askGeminiAdviser(safeQuestion, local.safeContext, describeAssistantMemory(nextMemory))
            source = 'gemini'
          } catch {
            setAdviserNotice('Gemini hiện chưa kết nối được. Câu trả lời vẫn sử dụng dữ liệu nội bộ trên thiết bị.')
          }
        } else {
          setAdviserNotice('Gemini chưa được cấu hình App Check. Trợ lý nội bộ vẫn hoạt động bình thường.')
        }
      }
      setMessages(previous => [...previous, { id: crypto.randomUUID(), role: 'assistant', content: answer, source }])
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
      <div><small>TRỢ LÝ ĐỒNG HÀNH TÓC QUYỀN</small><h2>Bộ não trợ lý của chủ tiệm</h2><p>Trí nhớ dài hạn được lưu cục bộ. Gemini chỉ là cố vấn tùy chọn, không điều khiển quyền của trợ lý.</p></div>
      <span className="assistant-role-badge">OWNER</span>
    </div>
    <div className="assistant-status-row">
      <div><span className="assistant-status-dot"/> Trợ lý nội bộ sẵn sàng</div>
      <div className={geminiReady ? 'assistant-gemini-ready' : 'assistant-gemini-idle'}><Sparkles size={14}/> Cố vấn Gemini {geminiReady ? 'sẵn sàng' : 'chưa kết nối'}</div>
    </div>
    <div className="assistant-chat" aria-live="polite" aria-relevant="additions" ref={chatRef} onScroll={handleChatScroll}>
      {messages.map(message => <article className={'assistant-message ' + message.role} key={message.id}>
        <span className="assistant-message-icon">{message.role === 'assistant' ? <Bot size={17}/> : <UserRound size={17}/>}</span>
        <div className="assistant-message-body">
          <small>{message.role === 'assistant' ? (message.source === 'gemini' ? 'TRỢ LÝ · GEMINI CỐ VẤN' : 'TRỢ LÝ TÓC QUYỀN') : 'BẠN'}</small>
          <div className="assistant-message-content">{message.content.split('\n').map((line, index) => <p key={index}>{line.replaceAll('**', '').replaceAll('_', '') || '\u00a0'}</p>)}</div>
        </div>
      </article>)}
      {busy && <div className="assistant-thinking"><Brain size={16}/> Mình đang tìm trong dữ liệu và trí nhớ nội bộ…</div>}
    </div>
    <div className="assistant-chat-meta">Dữ liệu phân tích: IndexedDB trên thiết bị hiện tại · Chưa đồng bộ sang thiết bị khác.</div>
    {adviserNotice && <div className="assistant-adviser-note" role="status">{adviserNotice}</div>}
    {showLatest && <button type="button" className="assistant-latest-button" onClick={goToLatest}>↓ Tin nhắn mới</button>}
    {error && <p className="form-error" role="alert">{error}</p>}
    <form className="assistant-composer" onSubmit={submit}>
      <textarea aria-label="Nhập câu hỏi cho trợ lý" rows={3} maxLength={4000} value={question} onChange={event => setQuestion(event.target.value)} placeholder="Hỏi doanh thu, nhân viên, sản phẩm… hoặc: Hãy ghi nhớ thêm. Tổng hợp danh sách nhân viên xuất sắc tháng này" />
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
      <div><strong>Trí nhớ dài hạn · {longTermMemories.length} mục</strong>
        <p>Lưu thông tin cá nhân, sở thích và câu hỏi nghiệp vụ do chủ tiệm tự dạy. Ví dụ: “Hãy ghi nhớ thêm. Tổng hợp danh sách nhân viên xuất sắc tháng này”.</p>
        {longTermMemories.length > 0 ? <ul>{longTermMemories.map(item => <li key={item.id}><strong>{item.title}:</strong> {item.content} <button type="button" className="subtle-button" onClick={() => void forgetLongTermMemory(item.id)} aria-label="Lưu trữ trí nhớ"><Trash2 size={13}/></button></li>)}</ul> : <small>Chưa có mục nào. Hãy bắt đầu bằng “Hãy ghi nhớ…”</small>}
        <small>Dữ liệu chỉ nằm trong IndexedDB trên thiết bị hiện tại. P2P chưa được triển khai nên chưa thể xuất hiện trên thiết bị khác.</small>
      </div>
    </div>
    <p className="assistant-privacy-note">Trợ lý chỉ lưu trí nhớ dài hạn khi chủ tiệm chủ động yêu cầu. Mục đã lưu có thể được xem và lưu trữ. Không có dữ liệu trí nhớ nào được gửi lên Firebase hoặc Gemini. Trợ lý chưa có quyền tự sửa dữ liệu nghiệp vụ.</p>
  </section>
}
