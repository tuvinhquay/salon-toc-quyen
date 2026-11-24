import { describe, expect, it } from 'vitest'
import { answerAssistantAbout, answerFromMemories, applyLearnedVocabulary, findMatchingAssistantShortcut, isAssistantCreatorQuestion, isAssistantGreeting, isMemoryRecallQuestion, parseMemoryInstruction, selectRelevantMemories } from '../src/app/assistant-brain'
import type { AssistantMemoryRecord } from '../src/db/types'

describe('owner assistant long-term memory', () => {
  it('parses natural Vietnamese identity and preference statements', () => {
    expect(parseMemoryInstruction('Hãy ghi nhớ tên tôi là Quay')?.category).toBe('profile')
    expect(parseMemoryInstruction('Tên tôi là Quay')?.category).toBe('profile')
    expect(parseMemoryInstruction('Mình tên là Quay')?.category).toBe('profile')
    expect(parseMemoryInstruction('Từ nay gọi mình là Quay nhé')?.category).toBe('profile')
  })
  it('parses explicit preference, routine, project and knowledge instructions', () => {
    expect(parseMemoryInstruction('Hãy nhớ mình thích giao diện sáng')?.category).toBe('preference')
    expect(parseMemoryInstruction('Nhớ giúp mình rằng tôi thích câu trả lời ngắn gọn nhé')?.category).toBe('preference')
    expect(parseMemoryInstruction('Mình muốn bạn nhớ rằng mình thích giao diện sáng')?.category).toBe('preference')
    expect(parseMemoryInstruction('Từ nay hãy lập kế hoạch công việc mỗi sáng')?.category).toBe('routine')
    expect(parseMemoryInstruction('Hãy nhớ dự án Q-BizOS đang phát triển')?.category).toBe('project')
    expect(parseMemoryInstruction('Hãy ghi nhớ mã quy trình nội bộ là QT-01')?.category).toBe('knowledge')
  })
  it('stores taught business questions as reusable shortcuts', () => {
    const parsed = parseMemoryInstruction('Hãy ghi nhớ thêm. Tổng hợp danh sách nhân viên xuất sắc tháng này')
    expect(parsed?.category).toBe('shortcut')
    const shortcut = { id: 's1', salonId: 'salon-a', ownerId: 'owner-a', category: 'shortcut', title: 'Câu hỏi nghiệp vụ đã dạy', content: parsed?.content ?? '', keywords: [], status: 'active', syncState: 'local_only', createdAt: '', updatedAt: '', revision: 1, createdBy: 'owner-a', updatedBy: 'owner-a', deviceId: 'device-a' } as AssistantMemoryRecord
    expect(findMatchingAssistantShortcut([shortcut], 'Nhân viên nào làm việc tốt nhất tháng này?')?.id).toBe('s1')
  })
  it('learns owner-defined Vietnamese aliases and applies them to later questions', () => {
    const parsed = parseMemoryInstruction('Hãy ghi nhớ từ "tinh dầu" nghĩa là dầu dưỡng tóc')
    expect(parsed?.category).toBe('knowledge')
    const memory = { id: 'v1', salonId: 's1', ownerId: 'o1', category: 'knowledge', title: 'Từ vựng', content: parsed?.content ?? '', keywords: ['tinh', 'dau', 'duong', 'toc'], status: 'active', syncState: 'local_only', createdAt: '', updatedAt: '', revision: 1, createdBy: 'o1', updatedBy: 'o1', deviceId: 'd1' } as AssistantMemoryRecord
    expect(applyLearnedVocabulary([memory], 'Tìm sản phẩm tinh dầu trong kho')).toBe('Tìm sản phẩm dầu dưỡng tóc trong kho')
  })
  it('answers capability and creator questions without requiring Gemini', () => {
    expect(answerAssistantAbout('Bạn có thể làm được gì?')).toContain('doanh thu')
    expect(isAssistantCreatorQuestion('Bạn có biết ai đã tạo ra mình hay không?')).toBe(true)
    expect(answerAssistantAbout('Ai đã tạo ra mình?')).toContain('TÓC QUYỀN')
  })
  it('recognizes short Vietnamese greetings as normal conversation', () => {
    expect(isAssistantGreeting('Xin chào')).toBe(true)
    expect(isAssistantGreeting('Chào bot!')).toBe(true)
    expect(isAssistantGreeting('hello')).toBe(true)
    expect(isAssistantGreeting('Hôm nay doanh thu bao nhiêu?')).toBe(false)
  })
  it('does not store an ordinary question as a memory instruction', () => {
    expect(parseMemoryInstruction('Hôm nay doanh thu bao nhiêu?')).toBeNull()
    expect(parseMemoryInstruction('Mình thích giao diện sáng')).toBeNull()
  })
  it('recognizes natural recall requests and finds relevant memories', () => {
    expect(isMemoryRecallQuestion('Bạn nhớ gì về tôi?')).toBe(true)
    expect(isMemoryRecallQuestion('Bạn còn nhớ tôi thích gì không?')).toBe(true)
    expect(isMemoryRecallQuestion('Mình tên gì nhỉ?')).toBe(true)
    const memory = { id: 'm1', salonId: 's1', ownerId: 'o1', category: 'profile', title: 'Thông tin cá nhân', content: 'Tên tôi là Quay', keywords: ['quay'], status: 'active', syncState: 'local_only', createdAt: '', updatedAt: '', revision: 1, createdBy: 'o1', updatedBy: 'o1', deviceId: 'd1' } as AssistantMemoryRecord
    expect(selectRelevantMemories([memory], 'Tên tôi là gì?')).toHaveLength(1)
    expect(answerFromMemories([memory])).toContain('Tên tôi là Quay')
  })
})
