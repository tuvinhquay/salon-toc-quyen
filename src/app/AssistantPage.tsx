import { useState, type FormEvent } from 'react'
import { Bot, Brain, Eraser, Send, Sparkles, UserRound } from 'lucide-react'
import { useOwnerContext } from '../auth/OwnerContext'
import { answerOwnerQuestion, redactQuestionForGemini } from './assistant-local'
import { clearAssistantMemory, describeAssistantMemory, learnAssistantHabit, readAssistantMemory } from './assistant-memory'
import { askGeminiAdviser, isGeminiAssistantReady } from './assistant-gemini'

type Message = { id: string; role: 'assistant' | 'user'; content: string; source?: 'local' | 'gemini' }
const suggestions = [
  'Hôm nay tiệm kiếm được bao nhiêu tiền?',
  'Tình hình doanh thu tháng này thế nào?',
  'Khách hàng nào đặt lịch nhiều nhất năm nay?',
  'Dịch vụ nào được làm nhiều nhất tháng này?',
  'Kho có mặt hàng nào sắp hết không?',
  'Tư vấn giúp mình cải thiện hoạt động tiệm.',
]
const needsAdviser = (question: string, intent: string) => intent === 'general' || /(tu van|giai thich|de xuat|nen lam gi|lam sao|chien luoc|ke hoach|vi sao)/i.test(question.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd'))

export function AssistantPage() {
  const actor = useOwnerContext()
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<Message[]>([{
    id: 'welcome',
    role: 'assistant',
    content: 'Chào chủ tiệm! Mình là trợ lý TÓC QUYỀN. Mình có thể xem số liệu ngay trên thiết bị, ghi nhớ những chủ đề bạn thường quan tâm và gọi Gemini khi cần tư vấn chuyên sâu.',
    source: 'local',
  }])
  const [memory, setMemory] = useState(() => readAssistantMemory(actor.salonId, actor.actorId))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const geminiReady = isGeminiAssistantReady()

  async function send(value = question) {
    const prompt = value.trim()
    if (!prompt || busy) return
    setQuestion('')
    setError(null)
    setMessages(previous => [...previous, { id: crypto.randomUUID(), role: 'user', content: prompt }])
    setBusy(true)
    try {
      const local = await answerOwnerQuestion(actor.salonId, prompt)
      const nextMemory = learnAssistantHabit(actor.salonId, actor.actorId, local.intent, local.period)
      setMemory(nextMemory)
      let answer = local.answer
      let source: Message['source'] = 'local'
      if (needsAdviser(prompt, local.intent)) {
        if (geminiReady) {
          try {
            answer += '\n\n**Góc nhìn cố vấn Gemini**\n' + await askGeminiAdviser(prompt, local.safeContext, describeAssistantMemory(nextMemory))
            source = 'gemini'
          } catch {
            answer += '\n\n_Gemini hiện chưa kết nối được. Mình vẫn trả lời bằng số liệu nội bộ; bạn có thể thử lại sau._'
          }
        } else {
          answer += '\n\n_Gemini chưa được bật trong Firebase AI Logic hoặc App Check chưa sẵn sàng. Trợ lý nội bộ vẫn hoạt động bình thường._'
        }
      }
      setMessages(previous => [...previous, { id: crypto.randomUUID(), role: 'assistant', content: answer, source }])
    } catch {
      setError('Mình chưa đọc được dữ liệu trên thiết bị. Bạn kiểm tra lại ứng dụng và thử gửi câu hỏi lần nữa nhé.')
    } finally {
      setBusy(false)
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    void send()
  }

  function resetMemory() {
    if (!window.confirm('Xóa phần ghi nhớ thói quen của trợ lý trên thiết bị này? Dữ liệu kinh doanh không bị ảnh hưởng.')) return
    clearAssistantMemory(actor.salonId, actor.actorId)
    setMemory(readAssistantMemory(actor.salonId))
  }

  return <section className="work-page assistant-page">
    <div className="work-intro">
      <div><small>TRỢ LÝ ĐỒNG HÀNH TÓC QUYỀN</small><h2>Trợ lý của chủ tiệm</h2><p>Trợ lý nội bộ xử lý số liệu; Gemini là chuyên gia được gọi đến khi cần tư vấn sâu.</p></div>
      <span className="assistant-role-badge">OWNER</span>
    </div>
    <div className="assistant-status-row">
      <div><span className="assistant-status-dot"/> Trợ lý nội bộ đang hoạt động</div>
      <div className={geminiReady ? 'assistant-gemini-ready' : 'assistant-gemini-idle'}><Sparkles size={14}/> Gemini {geminiReady ? 'đã có App Check' : 'chưa cấu hình App Check'}</div>
    </div>
    <div className="assistant-chat" aria-live="polite">
      {messages.map(message => <article className={'assistant-message ' + message.role} key={message.id}>
        <span className="assistant-message-icon">{message.role === 'assistant' ? <Bot size={17}/> : <UserRound size={17}/>}</span>
        <div className="assistant-message-body">
          <small>{message.role === 'assistant' ? (message.source === 'gemini' ? 'TRỢ LÝ · GEMINI CỐ VẤN' : 'TRỢ LÝ TÓC QUYỀN') : 'BẠN'}</small>
          <div className="assistant-message-content">{message.content.split('\n').map((line, index) => <p key={index}>{line.replaceAll('**', '').replaceAll('_', '') || '\u00a0'}</p>)}</div>
        </div>
      </article>)}
      {busy && <div className="assistant-thinking"><Brain size={16}/> Mình đang xem dữ liệu và chuẩn bị câu trả lời…</div>}
    </div>
    {error && <p className="form-error" role="alert">{error}</p>}
    <form className="assistant-composer" onSubmit={submit}>
      <textarea aria-label="Nhập câu hỏi cho trợ lý" rows={2} maxLength={2000} value={question} onChange={event => setQuestion(event.target.value)} placeholder="Bạn muốn hỏi điều gì về tiệm hôm nay?" />
      <button className="primary-button" disabled={busy || !question.trim()}><Send size={16}/> Gửi câu hỏi</button>
    </form>
    <div className="assistant-suggestions"><div className="assistant-section-title">Gợi ý câu hỏi</div><div>{suggestions.map(item => <button key={item} type="button" className="assistant-suggestion" onClick={() => void send(item)} disabled={busy}>{item}</button>)}</div></div>
    <div className="assistant-memory">
      <div className="assistant-memory-icon"><Brain size={19}/></div>
      <div><strong>Trợ lý đang học thói quen sử dụng</strong><p>{describeAssistantMemory(memory)}</p><small>Chỉ lưu số lần hỏi theo chủ đề và khoảng thời gian; không lưu nội dung câu hỏi, tên khách hàng hay dữ liệu kinh doanh.</small></div>
      <button type="button" className="subtle-button" onClick={resetMemory}><Eraser size={14}/> Xóa ghi nhớ</button>
    </div>
    <p className="assistant-privacy-note">Dữ liệu phân tích được đọc từ IndexedDB của salon hiện tại trên thiết bị này. Gemini chỉ nhận số liệu tổng hợp đã loại bỏ thông tin định danh; Gemini không được quyền sửa hóa đơn, lịch hẹn, nhân sự hoặc kho.</p>
  </section>
}
