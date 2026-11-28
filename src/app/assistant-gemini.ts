const MODEL = 'gemini-3.8-flash'
const CONNECTION_TIMEOUT_MS = 15_000
const CHAT_TIMEOUT_MS = 30_000
const ADVISER_TIMEOUT_MS = 25_000
const LOCAL_GEMINI_ENDPOINT = '/__local-api/gemini'

async function withTimeout<T>(request: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      request,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error('GEMINI_TIMEOUT')), timeoutMs)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

type GeminiProxyResponse = { text?: string; error?: string }

async function requestGemini(prompt: string, timeoutMs: number, temperature: number, maxOutputTokens: number): Promise<string> {
  if (!import.meta.env.DEV) throw new Error('GEMINI_LOCAL_PROXY_DEV_ONLY')
  const response = await withTimeout(fetch(LOCAL_GEMINI_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, temperature, maxOutputTokens }),
  }), timeoutMs)
  const payload = await response.json().catch(() => ({})) as GeminiProxyResponse
  if (!response.ok) throw new Error(payload.error || 'GEMINI_PROXY_HTTP_' + response.status)
  const answer = payload.text?.trim()
  if (!answer) throw new Error('GEMINI_EMPTY_RESPONSE')
  return answer
}

export function isGeminiAssistantReady() {
  return Boolean(import.meta.env.DEV)
}

export function getGeminiConfigurationStatus() {
  return {
    provider: 'Gemini Developer API · Google AI Studio',
    keyStorage: 'GEMINI_API_KEY trong .env.local (chỉ máy chủ Termux đọc)',
    runtimeMode: import.meta.env.DEV ? 'Termux/Vite local' : 'Không khả dụng trong production build',
    model: MODEL,
  }
}

export function getGeminiErrorDetails(error: unknown): string {
  if (!(error instanceof Error)) return String(error || 'Unknown error').slice(0, 240)
  const code = 'code' in error ? String((error as Error & { code?: unknown }).code ?? '') : ''
  const message = error.message
    .replace(/AIza[0-9A-Za-z_-]{20,}/g, '[API KEY REDACTED]')
    .replace(/(key|api_key|token)=([^&\\s]+)/gi, '$1=[REDACTED]')
    .replace(/https?:\\/\\/[^\\s]+/g, '[URL REDACTED]')
    .slice(0, 240)
  return [code, message].filter(Boolean).join(': ')
}

export async function testGeminiConnection(): Promise<void> {
  const answer = await requestGemini('Trả lời đúng một từ: Xin chào', CONNECTION_TIMEOUT_MS, 0, 24)
  if (!answer) throw new Error('GEMINI_EMPTY_RESPONSE')
}

export async function askGeminiAdviser(question: string, safeContext: string, memorySummary: string, recentQuestions = ''): Promise<string> {
  const prompt = [
    'Bạn là người trợ lý đồng hành thân thiện của salon TÓC QUYỀN. Trò chuyện tự nhiên bằng tiếng Việt, xưng em và gọi người dùng anh/chị; đừng mở đầu máy móc hoặc lặp lại câu hỏi.',
    'Trả lời như đang trò chuyện với chủ tiệm: ưu tiên đoạn văn ngắn, chỉ dùng gạch đầu dòng khi thật sự giúp dễ đọc. Nêu ý chính trước, giải thích bằng từ đời thường; tránh giọng báo cáo, thuật ngữ kỹ thuật và lời khuyên chung chung.',
    'Nếu câu hỏi còn thiếu chi tiết quan trọng, hỏi lại đúng một câu ngắn. Nếu có thể trả lời hữu ích ngay, hãy trả lời trước rồi nêu giả định rõ ràng. Không tự tạo số liệu, không tính lại tiền do hệ thống đã tính và không nói rằng đã làm thao tác khi chưa thực hiện.',
    'Nếu thiếu thông tin, nói cụ thể khoản nào chưa được nhập và điều đó ảnh hưởng ra sao. Không suy đoán doanh thu theo nhân viên khi chưa có dữ liệu gắn người thực hiện.',
    'Không yêu cầu tên, số điện thoại, email, mật khẩu, khóa API hoặc dữ liệu riêng tư.',
    'Các câu hỏi gần đây của người dùng (đã lọc thông tin nhận diện, chỉ để hiểu ngữ cảnh): ' + (recentQuestions || 'Chưa có câu hỏi trước đó.'),
    'Thói quen tổng hợp của chủ tiệm: ' + memorySummary,
    'Số liệu tổng hợp đã được tính tại thiết bị:\\n' + safeContext,
    'Câu hỏi cần tư vấn: ' + question,
  ].join('\\n\\n')
  return requestGemini(prompt, ADVISER_TIMEOUT_MS, 0.35, 1200)
}

export async function askGeminiConversation(question: string, role: 'owner' | 'employee', recentQuestions = ''): Promise<string> {
  const trustedRole = role === 'owner' ? 'CHỦ TIỆM (Owner)' : 'NHÂN VIÊN (Employee)'
  const prompt = [
    'Bạn là trợ lý AI đồng hành của salon TÓC QUYỀN. Trả lời tự nhiên, thông minh và hữu ích bằng tiếng Việt; xưng em, gọi người dùng anh/chị; không mở đầu máy móc.',
    'Vai trò đã được ứng dụng xác thực trước khi gọi AI: ' + trustedRole + '. Không tự suy đoán hoặc thay đổi vai trò này.',
    'Có thể trò chuyện, sáng tác thơ, viết nội dung, giải thích kiến thức, lập ý tưởng và tư vấn chung. Nếu câu hỏi cần dữ liệu thực tế của salon mà chưa được ứng dụng cung cấp, hãy nói rõ chưa có dữ liệu thay vì bịa số liệu.',
    'Không yêu cầu mật khẩu, khóa API, mã đăng nhập hoặc thông tin cá nhân không cần thiết. Không tuyên bố đã đọc dữ liệu nội bộ, đã thực hiện thao tác hay đã thay đổi dữ liệu.',
    'Một vài câu hỏi gần nhất để giữ mạch hội thoại (đã giới hạn và che email/số điện thoại; không truy cập dữ liệu salon): ' + (recentQuestions || 'Chưa có.'),
    'Câu hỏi hiện tại: ' + question.slice(0, 4000),
  ].join('\\n\\n')
  return requestGemini(prompt, CHAT_TIMEOUT_MS, 0.65, 1000)
}
