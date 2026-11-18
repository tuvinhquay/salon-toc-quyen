import { describe, expect, it } from 'vitest'
import { normalizeCustomerName, normalizePhone } from '../src/db/repositories'

describe('customer search normalization', () => {
  it('removes punctuation from phone numbers', () => {
    expect(normalizePhone('+84 901-234-567')).toBe('84901234567')
    expect(normalizePhone(undefined)).toBeNull()
  })
  it('normalizes Vietnamese accents for lookup without changing display names', () => {
    expect(normalizeCustomerName('Đặng Thị Ánh')).toBe('dang thi anh')
  })
})
