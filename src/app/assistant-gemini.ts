import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai'
import { appCheck, firebaseApp } from '../lib/firebase'

const MODEL = 'gemini-3.8-flash'
export function isGeminiAssistantReady() {
  return Boolean(firebaseApp && appCheck)
}
/** Gemini is an optional adviser. It receives only aggregate figures, never local customer/employee identifiers. */
export async function askGeminiAdviser(question: string, safeContext: string, memorySummary: string): Promise<string> {
  if (!firebaseApp || !appCheck) throw new Error('Gemini chưa sẵn sàng: cần cấu hình Firebase AI Logic và App Check.')
  const ai = getAI(firebaseApp, { backend: new GoogleAIBackend() })
  const model = getGenerativeModel(ai, {
    model: MODEL,
    generationConfig: { temperature: 0.2, maxOutputTokens: 1500 },
  })
  const prompt = [
    'Bạn là chuyên gia cố vấn vận hành salon TÓC QUYỀN. Trả lời bằng tiếng Việt rõ ràng, gần gũi, thực tế.',
    'Chỉ tư vấn, không tự nhận đã thực hiện thao tác. Không tự tạo số liệu. Không tự tính lại các số tiền đã được bộ máy nghiệp vụ tính.',
    'Nếu dữ liệu thiếu, nói rõ giới hạn. Không suy đoán doanh thu theo nhân viên vì dữ liệu hiện chưa có liên kết nhân viên thực hiện.',
    'Không yêu cầu tên, số điện thoại, email, mật khẩu, khóa API hoặc dữ liệu riêng tư.',
    'Thói quen tổng hợp của chủ tiệm: ' + memorySummary,
    'Số liệu tổng hợp đã được tính tại thiết bị:\n' + safeContext,
    'Câu hỏi cần tư vấn: ' + question,
  ].join('\n\n')
  const result = await model.generateContent(prompt)
  const answer = result.response.text().trim()
  if (!answer) throw new Error('Gemini chưa tạo được câu trả lời.')
  return answer
}
