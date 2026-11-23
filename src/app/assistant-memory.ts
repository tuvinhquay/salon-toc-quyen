export type AssistantMemory = {
  version: 1
  questionCount: number
  intentCounts: Record<string, number>
  periodCounts: Record<string, number>
  lastUsedAt: string | null
}
const emptyMemory = (): AssistantMemory => ({ version: 1, questionCount: 0, intentCounts: {}, periodCounts: {}, lastUsedAt: null })
const storageKey = (salonId: string) => 'salon-assistant-memory-v1:' + encodeURIComponent(salonId)
export function readAssistantMemory(salonId: string): AssistantMemory {
  if (!salonId.trim() || typeof window === 'undefined') return emptyMemory()
  try {
    const raw = window.localStorage.getItem(storageKey(salonId))
    if (!raw) return emptyMemory()
    const parsed = JSON.parse(raw) as AssistantMemory
    if (parsed.version !== 1 || typeof parsed.questionCount !== 'number' || !parsed.intentCounts || !parsed.periodCounts) return emptyMemory()
    return parsed
  } catch { return emptyMemory() }
}
/** Learns aggregate usage patterns only; never stores raw prompts, names, or business records. */
export function learnAssistantHabit(salonId: string, intent: string, period: string): AssistantMemory {
  const current = readAssistantMemory(salonId)
  const next: AssistantMemory = {
    version: 1,
    questionCount: current.questionCount + 1,
    intentCounts: { ...current.intentCounts, [intent]: (current.intentCounts[intent] ?? 0) + 1 },
    periodCounts: { ...current.periodCounts, [period]: (current.periodCounts[period] ?? 0) + 1 },
    lastUsedAt: new Date().toISOString(),
  }
  if (typeof window !== 'undefined' && salonId.trim()) window.localStorage.setItem(storageKey(salonId), JSON.stringify(next))
  return next
}
export function describeAssistantMemory(memory: AssistantMemory): string {
  const topIntent = Object.entries(memory.intentCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
  const topPeriod = Object.entries(memory.periodCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
  const intentNames: Record<string, string> = { finance: 'tài chính', staff: 'nhân viên', customers: 'khách hàng', services: 'dịch vụ', appointments: 'lịch hẹn', inventory: 'kho', overview: 'tổng quan', general: 'câu hỏi tư vấn' }
  const periodNames: Record<string, string> = { today: 'hằng ngày', month: 'theo tháng', year: 'theo năm' }
  if (!memory.questionCount) return 'Mình chưa có đủ tương tác để nhận ra thói quen của bạn.'
  return 'Mình đã học từ ' + memory.questionCount + ' câu hỏi. Bạn thường quan tâm ' + (intentNames[topIntent ?? ''] ?? 'nhiều chủ đề') + ' và thường xem báo cáo ' + (periodNames[topPeriod ?? ''] ?? 'theo nhiều khoảng thời gian') + '. Mình chỉ lưu thống kê thói quen, không lưu nội dung câu hỏi.'
}
export function clearAssistantMemory(salonId: string) {
  if (typeof window !== 'undefined' && salonId.trim()) window.localStorage.removeItem(storageKey(salonId))
}
