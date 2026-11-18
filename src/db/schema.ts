import {z} from 'zod'
const text=z.string().trim().min(1)
const phone=z.string().trim().max(30).optional().or(z.literal(''))
const email=z.email().optional().or(z.literal(''))
const iso=z.string().datetime({offset:true})
export const customerInputSchema=z.object({fullName:text.max(120),phone,email,notes:z.string().trim().max(2000).optional().default('')})
export const appointmentInputSchema=z.object({customerId:z.string().trim().min(1).nullable().optional(),customerNameSnapshot:text.max(120),customerPhoneSnapshot:z.string().trim().max(30).nullable().optional(),startAt:iso,endAt:iso,serviceIds:z.array(text).max(30).default([]),depositAmount:z.number().int().min(0).max(1_000_000_000).default(0),notes:z.string().trim().max(2000).optional().default('')}).refine(v=>Date.parse(v.endAt)>Date.parse(v.startAt),{message:'Thời điểm kết thúc phải sau thời điểm bắt đầu',path:['endAt']})
export const appointmentStatusSchema=z.enum(['scheduled','confirmed','checked_in','in_service','completed','cancelled','no_show'])
export const serviceInputSchema=z.object({name:text.max(120),description:z.string().trim().max(2000).optional().default(''),durationMinutes:z.number().int().min(5).max(1440),priceVnd:z.number().int().min(0).max(10_000_000_000),active:z.boolean().default(true)})
export const hairFormulaSchema=z.object({category:z.enum(['color','bleach','treatment','other']),products:z.array(z.object({productName:text.max(120),amount:text.max(40),unit:text.max(20)})).max(30),developer:z.string().trim().max(120).default(''),processingMinutes:z.number().int().min(0).max(600).nullable().default(null),targetResult:z.string().trim().max(500).default(''),notes:z.string().trim().max(2000).default('')})
export const workflowEventInputSchema=z.object({appointmentId:text,serviceId:text.nullable().optional(),eventType:z.enum(['consultation','formula_recorded','step_started','step_paused','step_completed','handover','note']),note:z.string().trim().max(2000).default(''),formula:hairFormulaSchema.nullable().optional()}).superRefine((v,c)=>{if(v.eventType==='formula_recorded'&&!v.formula)c.addIssue({code:'custom',message:'Cần lưu công thức tóc',path:['formula']})})
export const employeeInputSchema=z.object({fullName:text.max(120),phone,email,role:z.enum(['manager','stylist','assistant','cashier']),status:z.enum(['active','inactive']).default('active'),joinedAt:iso,notes:z.string().trim().max(2000).optional().default('')})
export const shiftInputSchema=z.object({employeeId:text,startAt:iso,endAt:iso,status:z.enum(['scheduled','checked_in','completed','cancelled']).default('scheduled'),notes:z.string().trim().max(1000).optional().default('')}).refine(v=>Date.parse(v.endAt)>Date.parse(v.startAt),{message:'Ca làm phải kết thúc sau khi bắt đầu',path:['endAt']})
export const commissionPolicyInputSchema=z.object({employeeId:text.nullable().optional(),serviceId:text.nullable().optional(),mode:z.enum(['percent','fixed_vnd']),value:z.number().int().min(0),effectiveFrom:iso,effectiveTo:iso.nullable().optional(),active:z.boolean().default(true)}).refine(v=>v.mode!=='percent'||v.value<=100,{message:'Tỷ lệ hoa hồng không vượt quá 100%',path:['value']}).refine(v=>!v.effectiveTo||Date.parse(v.effectiveTo)>Date.parse(v.effectiveFrom),{message:'Ngày kết thúc phải sau ngày bắt đầu',path:['effectiveTo']})
export const productInputSchema=z.object({name:text.max(160),sku:z.string().trim().max(80).optional().or(z.literal('')),category:text.max(80),unit:text.max(30),trackingMode:z.enum(['simple','lot']),minimumStock:z.number().min(0).max(1_000_000),active:z.boolean().default(true)})
export const supplierInputSchema=z.object({name:text.max(160),phone,email,address:z.string().trim().max(500).optional().default(''),notes:z.string().trim().max(2000).optional().default('')})
export const purchaseOrderInputSchema=z.object({supplierId:text,orderNumber:text.max(80),orderedAt:iso,expectedAt:iso.nullable().optional(),notes:z.string().trim().max(2000).optional().default(''),lines:z.array(z.object({productId:text,quantity:z.number().positive().max(1_000_000),unitCostVnd:z.number().int().min(0).max(10_000_000_000)})).min(1).max(200)})
export const receivePurchaseOrderInputSchema=z.object({purchaseOrderId:text,lines:z.array(z.object({productId:text,quantity:z.number().positive().max(1_000_000),lotCode:z.string().trim().max(100).optional().default(''),expiresAt:iso.nullable().optional()})).min(1).max(200)})
export type CustomerInput=z.infer<typeof customerInputSchema>
export type AppointmentInput=z.infer<typeof appointmentInputSchema>
export type ServiceInput=z.infer<typeof serviceInputSchema>
export type WorkflowEventInput=z.infer<typeof workflowEventInputSchema>
export type EmployeeInput=z.infer<typeof employeeInputSchema>
export type ShiftInput=z.infer<typeof shiftInputSchema>
export type CommissionPolicyInput=z.infer<typeof commissionPolicyInputSchema>
export type ProductInput=z.infer<typeof productInputSchema>
export type SupplierInput=z.infer<typeof supplierInputSchema>
export type PurchaseOrderInput=z.infer<typeof purchaseOrderInputSchema>
export type ReceivePurchaseOrderInput=z.infer<typeof receivePurchaseOrderInputSchema>
