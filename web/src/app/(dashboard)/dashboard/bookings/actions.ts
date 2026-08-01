'use server';

import { setRowStatus } from '@/lib/dashboard/mutations';

export async function updateBookingStatus(id: string, status: 'confirmed' | 'canceled') {
  return setRowStatus('bookings', id, status);
}
