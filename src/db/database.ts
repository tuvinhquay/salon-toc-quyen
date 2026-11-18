import Dexie, { type Table } from 'dexie';
import type { Appointment, AuditEvent, Customer, Service } from './types';

export class SalonDatabase extends Dexie {
  customers!: Table<Customer, string>;
  appointments!: Table<Appointment, string>;
  services!: Table<Service, string>;
  auditEvents!: Table<AuditEvent, string>;

  constructor() {
    super('salon-toc-quyen');
    this.version(1).stores({
      customers: 'id, salonId, normalizedName, normalizedPhone, updatedAt, [salonId+normalizedPhone]',
      appointments: 'id, salonId, customerId, startAt, endAt, status, updatedAt, [salonId+startAt], [salonId+customerId]',
      services: 'id, salonId, name, active, updatedAt',
      auditEvents: 'id, salonId, entityType, entityId, occurredAt, [salonId+occurredAt]',
    });
  }
}

export const salonDb = new SalonDatabase();

export async function closeSalonDatabase(): Promise<void> {
  salonDb.close();
}
