import { describe, expect, it } from 'vitest';
import { appointmentInputSchema, customerInputSchema } from '../src/db/schema';

describe('customerInputSchema', () => {
  it('normalizes surrounding whitespace through validation', () => {
    const result = customerInputSchema.parse({ fullName: '  Nguyễn An  ', phone: ' 0901 ' });
    expect(result.fullName).toBe('Nguyễn An');
    expect(result.phone).toBe('0901');
  });

  it('rejects an empty customer name', () => {
    expect(customerInputSchema.safeParse({ fullName: '   ' }).success).toBe(false);
  });

  it('rejects invalid email addresses', () => {
    expect(customerInputSchema.safeParse({ fullName: 'An', email: 'not-an-email' }).success).toBe(false);
  });
});

describe('appointmentInputSchema', () => {
  const base = {
    customerNameSnapshot: 'Khách vãng lai',
    startAt: '2026-11-19T09:00:00+07:00',
    endAt: '2026-11-19T10:00:00+07:00',
  };

  it('accepts a valid appointment and applies safe defaults', () => {
    const result = appointmentInputSchema.parse(base);
    expect(result.depositAmount).toBe(0);
    expect(result.serviceIds).toEqual([]);
    expect(result.notes).toBe('');
  });

  it('rejects an end time that is not after the start time', () => {
    expect(appointmentInputSchema.safeParse({ ...base, endAt: base.startAt }).success).toBe(false);
  });

  it('rejects negative deposits', () => {
    expect(appointmentInputSchema.safeParse({ ...base, depositAmount: -1 }).success).toBe(false);
  });
});
