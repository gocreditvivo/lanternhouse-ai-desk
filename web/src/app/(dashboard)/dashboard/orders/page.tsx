import { NoBusinessLinked } from '@/components/no-business-linked';
import { getOrders, getOwnerBusiness } from '@/lib/dashboard/queries';
import { OrdersClient } from './orders-client';

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  const business = await getOwnerBusiness();
  if (!business) return <NoBusinessLinked />;

  const orders = await getOrders(business);
  return <OrdersClient orders={orders} />;
}
