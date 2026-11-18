export type EntityId = string;

export interface BaseEntity {
  id: EntityId;
  salonId: EntityId;
  createdAt: string;
  updatedAt: string;
  revision: number;
  createdBy: string;
  updatedBy: string;
  deviceId: string;
}

export type Customer = BaseEntity & {
  fullName: string;
  normalizedName: string;
  phone: string | null;
  normalizedPhone: string | null;
  email: string | null;
  notes: string;
  archivedAt: string | null;
};

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'checked_in' | 'in_service' | 'completed' | 'cancelled' | 'no_show';

export type Appointment = BaseEntity & {
  customerId: EntityId | null;
  customerNameSnapshot: string;
  customerPhoneSnapshot: string | null;
  startAt: string;
  endAt: string;
  status: AppointmentStatus;
  serviceIds: EntityId[];
  depositAmount: number;
  notes: string;
  cancelledAt: string | null;
};

export type Service = BaseEntity & {
  name: string;
  description: string;
  durationMinutes: number;
  priceVnd: number;
  active: boolean;
};

export type AuditEvent = {
  id: EntityId;
  salonId: EntityId;
  entityType: 'customer' | 'appointment' | 'service';
  entityId: EntityId;
  action: 'created' | 'updated' | 'archived' | 'status_changed';
  occurredAt: string;
  actorId: string;
  deviceId: string;
  summary: string;
};

export type ActorContext = {
  salonId: EntityId;
  actorId: string;
  deviceId: string;
};
