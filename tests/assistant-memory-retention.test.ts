import { describe, expect, it } from 'vitest'
import { getMemoryRetentionLimits, isAssistantEpisodeRecallQuestion, isLowValueMemoryText, sanitizeAssistantMemoryText, shouldRememberConversation } from '../src/app/assistant-memory-retention'

describe('ENA lightweight persistent memory policy', () => {
  it('uses strict bounded storage limits and tightens them under quota pressure', () => {
    expect(getMemoryRetentionLimits().chatMaxMessages).toBe(40)
    expect(getMemoryRetentionLimits(0.86 * 1000, 1000).pressure).toBe('high')
    expect(getMemoryRetentionLimits(0.96 * 1000, 1000).chatRetentionDays).toBe(3)
    expect(getMemoryRetentionLimits(0.96 * 1000, 1000).manualMaxBytes).toBe(12000)
  })

  it('filters greeting, confirmation and cancellation noise', () => {
    expect(isLowValueMemoryText('Chào ENA')).toBe(true)
    expect(isLowValueMemoryText('XÁC NHẬN')).toBe(true)
    expect(isLowValueMemoryText('Hủy thao tác')).toBe(true)
    expect(isLowValueMemoryText('Thêm sản phẩm dầu gội DG001')).toBe(false)
  })

  it('redacts email and phone from copied conversation memory', () => {
    const result = sanitizeAssistantMemoryText('Liên hệ 0901234567 hoặc quay@example.com để xác nhận')
    expect(result).not.toContain('0901234567')
    expect(result).not.toContain('quay@example.com')
    expect(result).toContain('[email ẩn]')
  })

  it('recognizes memory recall about previously completed work', () => {
    expect(isAssistantEpisodeRecallQuestion('Sản phẩm mình vừa thêm vào kho là gì?')).toBe(true)
    expect(isAssistantEpisodeRecallQuestion('ENA nhớ lúc nãy mình đã làm gì không?')).toBe(true)
  })

  it('keeps meaningful conversation but skips short, low-value or action-command turns', () => {
    expect(shouldRememberConversation('Mình muốn trao đổi cách quản lý salon hiệu quả hơn', 'Có thể bắt đầu bằng quy trình đặt lịch, theo dõi doanh thu và chăm sóc khách quay lại.')).toBe(true)
    expect(shouldRememberConversation('XÁC NHẬN', 'Đã thêm sản phẩm vào kho thành công.')).toBe(false)
    expect(shouldRememberConversation('Thêm sản phẩm dầu gội DG001', 'Đã ghi sản phẩm vào kho.')).toBe(false)
  })
})
