'use server';

import { setRowStatus } from '@/lib/dashboard/mutations';
import type { OrderStatus } from '@/lib/dashboard/types';

export async function updateOrderStatus(id: string, status: OrderStatus) {
  return setRowStatus('orders', id, status);
}
