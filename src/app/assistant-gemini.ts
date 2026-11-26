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
    'Bạn là trợ lý tư vấn vận hành salon TÓC QUYỀN. Trả lời bằng tiếng Việt đời thường, ấm áp, ngắn gọn và dễ hiểu với chủ tiệm, nhân viên không chuyên công nghệ.',
    'Nói kết quả quan trọng trước, giải thích sau. Tránh thuật ngữ kế toán/kỹ thuật; nếu buộc phải dùng thì giải thích ngay bằng lời đơn giản. Chỉ tư vấn, không tự nhận đã thực hiện thao tác. Không tự tạo số liệu hoặc tính lại các số tiền hệ thống đã tính.',
    'Nếu thiếu thông tin, nói cụ thể khoản nào chưa được nhập và điều đó ảnh hưởng ra sao. Không suy đoán doanh thu theo nhân viên khi chưa có dữ liệu gắn người thực hiện.',
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
