import { describe, expect, it } from 'vitest'
import { parseCustomerCreateCommand, parseCustomerPhoneUpdate, parseProductCreateCommand } from '../src/app/assistant-ena-actions'

describe('ENA customer command parsing', () => {
  it('extracts only explicitly supplied customer fields', () => {
    expect(parseCustomerCreateCommand('Thêm khách hàng Nguyễn Văn A, số điện thoại 0901234567, email a@example.com, ghi chú khách quen')).toEqual({
      fullName: 'Nguyễn Văn A', phone: '0901234567', email: 'a@example.com', notes: 'khách quen', groupIds: [], customFields: {},
    })
  })
  it('accepts the common phrase customer mới after khách hàng', () => {
    expect(parseCustomerCreateCommand('Thêm khách hàng mới Nguyễn Văn B, số điện thoại 0912345678')?.fullName).toBe('Nguyễn Văn B')
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

describe('ENA product create command parsing', () => {
  it('parses a fully specified Vietnamese product command without mixing sale price and cost', () => {
    const parsed = parseProductCreateCommand('Thêm sản phẩm mới tên Dầu gội phục hồi tóc hư tổn, mã SKU DG001, đơn vị chai, giá vốn 120000 đồng, giá bán 180000 đồng, số lượng nhập ban đầu 20 chai')
    expect(parsed).not.toBeNull()
    expect(parsed?.input.name).toBe('Dầu gội phục hồi tóc hư tổn')
    expect(parsed?.input.sku).toBe('DG001')
    expect(parsed?.input.unit).toBe('chai')
    expect(parsed?.input.salePriceVnd).toBe(180000)
    expect(parsed?.unitCostVnd).toBe(120000)
    expect(parsed?.quantity).toBe(20)
  })

  it('requires an explicit sale price and SKU', () => {
    expect(parseProductCreateCommand('Thêm sản phẩm dầu gội, giá vốn 120000')).toBeNull()
    expect(parseProductCreateCommand('Thêm sản phẩm dầu gội, mã SKU DG002')).toBeNull()
  })
})
