import { NoBusinessLinked } from '@/components/no-business-linked';
import { getDashboardStats, getOwnerBusiness, servesFood } from '@/lib/dashboard/queries';
import { OverviewClient } from './overview-client';

export const dynamic = 'force-dynamic';

export default async function DashboardOverview() {
  const business = await getOwnerBusiness();
  if (!business) return <NoBusinessLinked />;

  const stats = await getDashboardStats(business);
  return <OverviewClient stats={stats} showOrders={servesFood(business)} />;
}
