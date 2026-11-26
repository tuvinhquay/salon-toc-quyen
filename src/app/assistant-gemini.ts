import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai'
import { appCheck, firebaseApp, firebaseEnvDiagnostics } from '../lib/firebase'

const MODEL = 'gemini-3.8-flash'
export function isGeminiAssistantReady() {
  return Boolean(firebaseApp && appCheck)
}
export function getGeminiConfigurationStatus() {
  return {
    ...firebaseEnvDiagnostics,
    firebaseAppCreated: Boolean(firebaseApp),
    appCheckCreated: Boolean(appCheck),
    model: MODEL,
  }
}
/** Returns actionable SDK error details while redacting any key-like strings. */
export function getGeminiErrorDetails(error: unknown): string {
  if (!(error instanceof Error)) return String(error || 'Unknown error').slice(0, 240)
  const code = 'code' in error ? String((error as Error & { code?: unknown }).code ?? '') : ''
  const message = error.message
    .replace(/AIza[0-9A-Za-z_-]{20,}/g, '[API KEY REDACTED]')
    .replace(/(key|api_key|token)=([^&\\s]+)/gi, '$1=[REDACTED]')
    .slice(0, 240)
  return [code, message].filter(Boolean).join(': ')
}
/** Makes a real, low-token model request; configuration presence alone is not a live connection. */
export async function testGeminiConnection(): Promise<void> {
  if (!firebaseApp || !appCheck) throw new Error('GEMINI_NOT_CONFIGURED')
  const ai = getAI(firebaseApp, { backend: new GoogleAIBackend() })
  const model = getGenerativeModel(ai, {
    model: MODEL,
    generationConfig: { temperature: 0, maxOutputTokens: 24 },
  })
  const result = await model.generateContent('Trả lời đúng một từ: Xin chào')
  if (!result.response.text().trim()) throw new Error('GEMINI_EMPTY_RESPONSE')
}
/** Gemini is an optional adviser. It receives only aggregate figures, never local customer/employee identifiers. */
export async function askGeminiAdviser(question: string, safeContext: string, memorySummary: string, recentQuestions = ''): Promise<string> {
  if (!firebaseApp || !appCheck) throw new Error('Gemini chưa sẵn sàng: cần cấu hình Firebase AI Logic và App Check.')
  const ai = getAI(firebaseApp, { backend: new GoogleAIBackend() })
  const model = getGenerativeModel(ai, {
    model: MODEL,
    generationConfig: { temperature: 0.35, maxOutputTokens: 1200 },
  })
  const prompt = [
    'Bạn là người trợ lý đồng hành thân thiện của salon TÓC QUYỀN. Trò chuyện tự nhiên bằng tiếng Việt, xưng em và gọi người dùng anh/chị; đừng mở đầu máy móc hoặc lặp lại câu hỏi.',
    'Trả lời như đang trò chuyện với chủ tiệm: ưu tiên đoạn văn ngắn, chỉ dùng gạch đầu dòng khi thật sự giúp dễ đọc. Nêu ý chính trước, giải thích bằng từ đời thường; tránh giọng báo cáo, thuật ngữ kỹ thuật và lời khuyên chung chung.',
    'Nếu câu hỏi còn thiếu chi tiết quan trọng, hỏi lại đúng một câu ngắn. Nếu có thể trả lời hữu ích ngay, hãy trả lời trước rồi nêu giả định rõ ràng. Không tự tạo số liệu, không tính lại tiền do hệ thống đã tính và không nói rằng đã làm thao tác khi chưa thực hiện.',
    'Nếu thiếu thông tin, nói cụ thể khoản nào chưa được nhập và điều đó ảnh hưởng ra sao. Không suy đoán doanh thu theo nhân viên khi chưa có dữ liệu gắn người thực hiện.',
    'Không yêu cầu tên, số điện thoại, email, mật khẩu, khóa API hoặc dữ liệu riêng tư.',
    'Các câu hỏi gần đây của người dùng (đã lọc thông tin nhận diện, chỉ để hiểu ngữ cảnh): ' + (recentQuestions || 'Chưa có câu hỏi trước đó.'),
    'Thói quen tổng hợp của chủ tiệm: ' + memorySummary,
    'Số liệu tổng hợp đã được tính tại thiết bị:\n' + safeContext,
    'Câu hỏi cần tư vấn: ' + question,
  ].join('\n\n')
  const result = await model.generateContent(prompt)
  const answer = result.response.text().trim()
  if (!answer) throw new Error('Gemini chưa tạo được câu trả lời.')
  return answer
}
