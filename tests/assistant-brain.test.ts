import { describe, expect, it } from 'vitest'
import { answerFromMemories, isMemoryRecallQuestion, parseMemoryInstruction, selectRelevantMemories } from '../src/app/assistant-brain'
import type { AssistantMemoryRecord } from '../src/db/types'

describe('owner assistant long-term memory', () => {
  it('parses explicit owner instructions and classifies profile/routine/preferences', () => {
    expect(parseMemoryInstruction('Hãy ghi nhớ tên tôi là Quay')?.category).toBe('profile')
    expect(parseMemoryInstruction('Từ nay hãy lập kế hoạch công việc mỗi sáng')?.category).toBe('routine')
    expect(parseMemoryInstruction('Hãy nhớ tôi ưu tiên việc quan trọng trước')?.category).toBe('preference')
  })
  it('does not store an ordinary question as a memory instruction', () => {
    expect(parseMemoryInstruction('Hôm nay doanh thu bao nhiêu?')).toBeNull()
  })
  it('recognizes recall requests and finds relevant memories', () => {
    expect(isMemoryRecallQuestion('Bạn nhớ gì về tôi?')).toBe(true)
    const memory = { id: 'm1', salonId: 's1', ownerId: 'o1', category: 'profile', title: 'Thông tin cá nhân', content: 'Tên tôi là Quay', keywords: ['quay'], status: 'active', syncState: 'local_only', createdAt: '', updatedAt: '', revision: 1, createdBy: 'o1', updatedBy: 'o1', deviceId: 'd1' } as AssistantMemoryRecord
    expect(selectRelevantMemories([memory], 'Tên tôi là gì?')).toHaveLength(1)
    expect(answerFromMemories([memory])).toContain('Tên tôi là Quay')
  })
})
