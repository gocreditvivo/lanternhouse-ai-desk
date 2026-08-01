import { NoBusinessLinked } from '@/components/no-business-linked';
import { getCalls, getOwnerBusiness } from '@/lib/dashboard/queries';
import { CallsClient } from './calls-client';

export const dynamic = 'force-dynamic';

export default async function CallsPage() {
  const business = await getOwnerBusiness();
  if (!business) return <NoBusinessLinked />;

  const calls = await getCalls(business);
  return <CallsClient calls={calls} />;
}
