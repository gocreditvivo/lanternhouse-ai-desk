import { describe, expect, it } from 'vitest';
import { mockBookingAdapter } from '../src/lib/booking/mock';

describe('mockBookingAdapter', () => {
  it('exposes the Falls Church reservation capability safely', async () => {
    expect(mockBookingAdapter.provider).toBe('mock');
    expect(mockBookingAdapter.capabilities.createBooking).toBe(true);
    expect(mockBookingAdapter.capabilities.reschedule).toBe(false);

    const services = await mockBookingAdapter.getServices('lantern-house-falls-church');
    expect(services).toEqual([
      expect.objectContaining({
        id: 'mock-table-reservation',
        name: 'Table Reservation',
        nameVi: 'Đặt bàn',
        durationMinutes: 90,
      }),
    ]);
  });

  it('returns 5-8 PM America/New_York synthetic availability without a real calendar', async () => {
    const slots = await mockBookingAdapter.getAvailability(
      'lantern-house-falls-church',
      'mock-table-reservation',
      '2026-08-16T16:00:00.000Z',
    );
    expect(slots).toHaveLength(4);
    expect(slots[0]).toEqual(
      expect.objectContaining({
        startIso: '2026-08-16T21:00:00.000Z',
        endIso: '2026-08-16T22:30:00.000Z',
      }),
    );
  });

  it('fails closed on bad customer data', async () => {
    await expect(
      mockBookingAdapter.createBooking('lantern-house-falls-church', {
        serviceId: 'mock-table-reservation',
        customerName: '',
        customerPhone: '',
        startIso: '2026-08-16T21:00:00.000Z',
      }),
    ).rejects.toThrow('Customer name and phone are required');
  });
});
