import type { BookingAdapter, BookingCapabilities, BookingResult, BookingService, BookingStaff } from './types';

const LOCATION_ID = 'lantern-house-falls-church';
const TIMEZONE = 'America/New_York';

const capabilities: BookingCapabilities = {
  services: true,
  staff: true,
  liveAvailability: true,
  createBooking: true,
  reschedule: false,
  cancellation: false,
  groupBooking: false,
};

const services: BookingService[] = [
  {
    id: 'mock-table-reservation',
    name: 'Table Reservation',
    nameVi: 'Đặt bàn',
    durationMinutes: 90,
    staffIds: ['mock-anyone'],
    active: true,
  },
];

const staff: BookingStaff[] = [{ id: 'mock-anyone', name: 'Anyone', active: true }];

function endIso(startIso: string, durationMinutes: number): string {
  const start = new Date(startIso);
  if (Number.isNaN(start.getTime())) throw new Error('Invalid booking start time');
  return new Date(start.getTime() + durationMinutes * 60_000).toISOString();
}

function localDateParts(date: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return { year: get('year'), month: get('month'), day: get('day') };
}

function localHourToIso(year: number, month: number, day: number, hour: number): string {
  const noonUtc = new Date(Date.UTC(year, month - 1, day, 12));
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    hour12: false,
    timeZoneName: 'shortOffset',
    hour: '2-digit',
  }).formatToParts(noonUtc);
  const offsetText = parts.find((part) => part.type === 'timeZoneName')?.value ?? 'GMT-4';
  const match = offsetText.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  const sign = match?.[1] === '-' ? -1 : 1;
  const offsetMinutes = sign * ((Number(match?.[2] ?? 0) * 60) + Number(match?.[3] ?? 0));
  return new Date(Date.UTC(year, month - 1, day, hour, 0) - offsetMinutes * 60_000).toISOString();
}

export const mockBookingAdapter: BookingAdapter = {
  provider: 'mock',
  capabilities,
  async getServices(locationId) {
    if (locationId !== LOCATION_ID) return [];
    return services.map((service) => structuredClone(service));
  },
  async getStaff(locationId) {
    if (locationId !== LOCATION_ID) return [];
    return staff.map((member) => ({ ...member }));
  },
  async getAvailability(locationId, serviceId, dateIso, staffId) {
    if (locationId !== LOCATION_ID) return [];
    const service = services.find((entry) => entry.id === serviceId && entry.active);
    if (!service) return [];
    if (staffId && !staff.some((member) => member.id === staffId && member.active)) return [];
    const date = new Date(dateIso);
    if (Number.isNaN(date.getTime())) return [];
    const { year, month, day } = localDateParts(date);
    return [17, 18, 19, 20].map((hour) => {
      const startIso = localHourToIso(year, month, day, hour);
      return { startIso, endIso: endIso(startIso, service.durationMinutes), staffId: staffId || 'mock-anyone' };
    });
  },
  async createBooking(locationId, request): Promise<BookingResult> {
    if (locationId !== LOCATION_ID) throw new Error('Unknown mock location');
    const service = services.find((entry) => entry.id === request.serviceId && entry.active);
    if (!service) throw new Error('Unknown or inactive booking service');
    if (!request.customerName.trim() || !request.customerPhone.trim()) throw new Error('Customer name and phone are required');
    return {
      externalBookingId: `test-booking-${request.startIso}`,
      status: 'received',
      startIso: request.startIso,
      endIso: endIso(request.startIso, service.durationMinutes),
      staffId: request.staffId || 'mock-anyone',
    };
  },
};
