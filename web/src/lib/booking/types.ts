export type BookingProvider = 'mock' | 'square' | 'acuity' | 'calendly' | 'google_calendar' | 'generic';

export type BookingCapabilities = {
  services: boolean;
  staff: boolean;
  liveAvailability: boolean;
  createBooking: boolean;
  reschedule: boolean;
  cancellation: boolean;
  groupBooking: boolean;
};

export type BookingService = {
  id: string;
  name: string;
  nameVi?: string;
  durationMinutes: number;
  priceCents?: number;
  staffIds?: string[];
  active: boolean;
};

export type BookingStaff = {
  id: string;
  name: string;
  active: boolean;
};

export type BookingSlot = {
  startIso: string;
  endIso: string;
  staffId?: string;
};

export type BookingRequest = {
  serviceId: string;
  customerName: string;
  customerPhone: string;
  startIso: string;
  staffId?: string;
  notes?: string;
};

export type BookingResult = {
  externalBookingId: string;
  status: 'received' | 'confirmed' | 'failed';
  startIso: string;
  endIso: string;
  staffId?: string;
};

export interface BookingAdapter {
  readonly provider: BookingProvider;
  readonly capabilities: BookingCapabilities;
  getServices(locationId: string): Promise<BookingService[]>;
  getStaff(locationId: string): Promise<BookingStaff[]>;
  getAvailability(locationId: string, serviceId: string, dateIso: string, staffId?: string): Promise<BookingSlot[]>;
  createBooking(locationId: string, request: BookingRequest): Promise<BookingResult>;
}
