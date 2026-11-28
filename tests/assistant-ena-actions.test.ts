import { describe, expect, it } from 'vitest'
import { parseCustomerCreateCommand, parseCustomerPhoneUpdate } from '../src/app/assistant-ena-actions'

describe('ENA customer command parsing', () => {
  it('extracts only explicitly supplied customer fields', () => {
    expect(parseCustomerCreateCommand('Thêm khách hàng Nguyễn Văn A, số điện thoại 0901234567, email a@example.com, ghi chú khách quen')).toEqual({
      fullName: 'Nguyễn Văn A', phone: '0901234567', email: 'a@example.com', notes: 'khách quen', groupIds: [], customFields: {},
    })
  })
  it('rejects missing names and malformed phone numbers', () => {
    expect(parseCustomerCreateCommand('Thêm khách hàng')).toBeNull()
    expect(parseCustomerCreateCommand('Thêm khách hàng Nguyễn Văn A, số điện thoại 123')).toBeNull()
  })
  it('parses an explicit phone update without guessing the customer', () => {
    expect(parseCustomerPhoneUpdate('Sửa khách hàng Nguyễn Văn A, đổi số điện thoại thành 0987654321')).toEqual({ name: 'Nguyễn Văn A', phone: '0987654321' })
  })
  it('rejects incomplete or malformed updates', () => {
    expect(parseCustomerPhoneUpdate('Sửa khách hàng Nguyễn Văn A')).toBeNull()
    expect(parseCustomerPhoneUpdate('Sửa khách hàng Nguyễn Văn A, đổi số điện thoại thành 123')).toBeNull()
  })
})
