import { describe, expect, it } from 'vitest'
import { commissionPolicyInputSchema, employeeInputSchema, productInputSchema, purchaseOrderInputSchema, receivePurchaseOrderInputSchema, shiftInputSchema, supplierInputSchema } from '../src/db/schema'
const start='2026-11-19T09:00:00+07:00'
describe('employee and shift schemas',()=>{
 it('accepts a valid employee profile and rejects a blank name',()=>{
  expect(employeeInputSchema.safeParse({fullName:'Nguyễn An',role:'stylist',joinedAt:start}).success).toBe(true)
  expect(employeeInputSchema.safeParse({fullName:' ',role:'stylist',joinedAt:start}).success).toBe(false)
 })
 it('requires a positive shift interval',()=>{
  expect(shiftInputSchema.safeParse({employeeId:'e1',startAt:start,endAt:'2026-11-19T18:00:00+07:00'}).success).toBe(true)
  expect(shiftInputSchema.safeParse({employeeId:'e1',startAt:start,endAt:start}).success).toBe(false)
 })
 it('limits percentage commission to 100 and requires whole VND for fixed commission',()=>{
  expect(commissionPolicyInputSchema.safeParse({mode:'percent',value:100,effectiveFrom:start}).success).toBe(true)
  expect(commissionPolicyInputSchema.safeParse({mode:'percent',value:101,effectiveFrom:start}).success).toBe(false)
  expect(commissionPolicyInputSchema.safeParse({mode:'fixed_vnd',value:1500.5,effectiveFrom:start}).success).toBe(false)
 })
})
describe('inventory and purchase schemas',()=>{
 it('validates product tracking mode and supplier data',()=>{
  expect(productInputSchema.safeParse({name:'Dầu gội',category:'care',unit:'chai',trackingMode:'lot',minimumStock:2}).success).toBe(true)
  expect(productInputSchema.safeParse({name:'Dầu gội',category:'care',unit:'chai',trackingMode:'unknown',minimumStock:2}).success).toBe(false)
  expect(supplierInputSchema.safeParse({name:'Nhà phân phối A'}).success).toBe(true)
 })
 it('rejects duplicate products in purchase and receipt batches',()=>{
  const po={supplierId:'s1',orderNumber:'PO-001',orderedAt:start,lines:[{productId:'p1',quantity:2,unitCostVnd:1000},{productId:'p1',quantity:1,unitCostVnd:1000}]}
  expect(purchaseOrderInputSchema.safeParse(po).success).toBe(false)
  expect(receivePurchaseOrderInputSchema.safeParse({purchaseOrderId:'po1',lines:[{productId:'p1',quantity:1},{productId:'p1',quantity:1}]}).success).toBe(false)
 })
})
