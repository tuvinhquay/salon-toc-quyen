import { z } from 'zod';

const nonEmpty = z.string().trim().min(1);
const isoDateTime = z.string().datetime({ offset: true });

export const customerInputSchema = z.object({
  fullName: nonEmpty.max(120),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  email: z.email().optional().or(z.literal('')),
  notes: z.string().trim().max(2000).optional().default(''),
});

export const appointmentInputSchema = z.object({
  customerId: z.string().trim().min(1).nullable().optional(),
  customerNameSnapshot: nonEmpty.max(120),
  customerPhoneSnapshot: z.string().trim().max(30).nullable().optional(),
  startAt: isoDateTime,
  endAt: isoDateTime,
  serviceIds: z.array(nonEmpty).max(30).default([]),
  depositAmount: z.number().int().min(0).max(1_000_000_000).default(0),
  notes: z.string().trim().max(2000).optional().default(''),
}).refine((value) => Date.parse(value.endAt) > Date.parse(value.startAt), {
  message: 'Thời điểm kết thúc phải sau thời điểm bắt đầu',
  path: ['endAt'],
});

export const appointmentStatusSchema = z.enum([
  'scheduled',
  'confirmed',
  'checked_in',
  'in_service',
  'completed',
  'cancelled',
  'no_show',
]);

export type CustomerInput = z.infer<typeof customerInputSchema>;
export type AppointmentInput = z.infer<typeof appointmentInputSchema>;
