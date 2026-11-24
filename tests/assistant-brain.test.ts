import { describe, expect, it } from 'vitest'
import { answerFromMemories, isMemoryRecallQuestion, parseMemoryInstruction, selectRelevantMemories } from '../src/app/assistant-brain'
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
    expect(parseMemoryInstruction('Từ nay hãy lập kế hoạch công việc mỗi sáng')?.category).toBe('routine')
    expect(parseMemoryInstruction('Hãy nhớ dự án Q-BizOS đang phát triển')?.category).toBe('project')
    expect(parseMemoryInstruction('Hãy ghi nhớ mã quy trình nội bộ là QT-01')?.category).toBe('knowledge')
  })
  it('does not store an ordinary question as a memory instruction', () => {
    expect(parseMemoryInstruction('Hôm nay doanh thu bao nhiêu?')).toBeNull()
    expect(parseMemoryInstruction('Mình thích giao diện sáng')).toBeNull()
  })
  it('recognizes natural recall requests and finds relevant memories', () => {
    expect(isMemoryRecallQuestion('Bạn nhớ gì về tôi?')).toBe(true)
    expect(isMemoryRecallQuestion('Bạn còn nhớ tôi thích gì không?')).toBe(true)
    const memory = { id: 'm1', salonId: 's1', ownerId: 'o1', category: 'profile', title: 'Thông tin cá nhân', content: 'Tên tôi là Quay', keywords: ['quay'], status: 'active', syncState: 'local_only', createdAt: '', updatedAt: '', revision: 1, createdBy: 'o1', updatedBy: 'o1', deviceId: 'd1' } as AssistantMemoryRecord
    expect(selectRelevantMemories([memory], 'Tên tôi là gì?')).toHaveLength(1)
    expect(answerFromMemories([memory])).toContain('Tên tôi là Quay')
  })
})
