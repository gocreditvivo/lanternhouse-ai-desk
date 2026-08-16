import type { BookingAdapter, BookingCapabilities, BookingResult, BookingService, BookingStaff } from './types';

const LOCATION_ID = 'lantern-house-falls-church';

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
    active: true,
  },
];

const staff: BookingStaff[] = [
  { id: 'mock-anyone', name: 'Anyone', active: true },
];

function endIso(startIso: string, durationMinutes: number): string {
  const start = new Date(startIso);
  if (Number.isNaN(start.getTime())) throw new Error('Invalid booking start time');
  return new Date(start.getTime() + durationMinutes * 60_000).toISOString();
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

    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    const candidateHours = [17, 18, 19, 20];

    return candidateHours.map((hour) => {
      const start = new Date(Date.UTC(year, month, day, hour, 0, 0));
      return {
        startIso: start.toISOString(),
        endIso: endIso(start.toISOString(), service.durationMinutes),
        staffId: staffId || 'mock-anyone',
      };
    });
  },

  async createBooking(locationId, request): Promise<BookingResult> {
    if (locationId !== LOCATION_ID) throw new Error('Unknown mock location');
    const service = services.find((entry) => entry.id === request.serviceId && entry.active);
    if (!service) throw new Error('Unknown or inactive booking service');
    if (!request.customerName.trim() || !request.customerPhone.trim()) {
      throw new Error('Customer name and phone are required');
    }

    return {
      externalBookingId: `mock-booking-${Date.now()}`,
      status: 'received',
      startIso: request.startIso,
      endIso: endIso(request.startIso, service.durationMinutes),
      staffId: request.staffId || 'mock-anyone',
    };
  },
};
