import { describe, expect, it } from 'vitest'
import { cashSessionCloseSchema, cashSessionOpenSchema, expenseInputSchema, invoiceInputSchema, paymentInputSchema, refundInputSchema, taxPolicyInputSchema } from '../src/db/schema'
const at='2026-11-19T10:00:00+07:00'
describe('tax and invoice schemas',()=>{
 it('validates effective tax policy ranges',()=>{
  expect(taxPolicyInputSchema.safeParse({name:'VAT',ratePercent:10,inclusive:false,effectiveFrom:at}).success).toBe(true)
  expect(taxPolicyInputSchema.safeParse({name:'VAT',ratePercent:101,inclusive:false,effectiveFrom:at}).success).toBe(false)
 })
 it('accepts an optional employee assignment on each invoice line',()=>{
  const assigned={invoiceNumber:'HD-002',issuedAt:at,lines:[{lineType:'service',referenceId:'service-1',description:'Cắt tóc',quantity:1,unitPriceVnd:200000,employeeId:'employee-1'}]}
  expect(invoiceInputSchema.safeParse(assigned).success).toBe(true)
  expect(invoiceInputSchema.safeParse({...assigned,lines:[{...assigned.lines[0],employeeId:''}]}).success).toBe(false)
 })
 it('rejects invalid invoice discounts and missing referenced items',()=>{
  const base={invoiceNumber:'HD-001',issuedAt:at,lines:[{lineType:'custom',description:'Dịch vụ khác',quantity:1,unitPriceVnd:100000}]}
  expect(invoiceInputSchema.safeParse(base).success).toBe(true)
  expect(invoiceInputSchema.safeParse({...base,lines:[{lineType:'custom',description:'Dịch vụ',quantity:1,unitPriceVnd:100000,discountVnd:120000}]}).success).toBe(false)
  expect(invoiceInputSchema.safeParse({...base,lines:[{lineType:'product',description:'Dầu gội',quantity:1,unitPriceVnd:100000}]}).success).toBe(false)
 })
})
describe('payments and cash sessions',()=>{
 it('requires positive integer payment and refund values',()=>{
  expect(paymentInputSchema.safeParse({invoiceId:'i1',method:'cash',amountVnd:10000,paidAt:at}).success).toBe(true)
  expect(paymentInputSchema.safeParse({invoiceId:'i1',method:'cash',amountVnd:0,paidAt:at}).success).toBe(false)
  expect(refundInputSchema.safeParse({paymentId:'p1',amountVnd:5000,method:'cash',reason:'Khách đổi ý',refundedAt:at}).success).toBe(true)
 })
 it('validates cash counts and expenses',()=>{
  expect(cashSessionOpenSchema.safeParse({openingFloatVnd:200000,openedAt:at}).success).toBe(true)
  expect(cashSessionCloseSchema.safeParse({cashSessionId:'c1',countedCashVnd:250000,closedAt:at}).success).toBe(true)
  expect(expenseInputSchema.safeParse({category:'Vệ sinh',amountVnd:10000,method:'cash',paidAt:at}).success).toBe(true)
 })
})
