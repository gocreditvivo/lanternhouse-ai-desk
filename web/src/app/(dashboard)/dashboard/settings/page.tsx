import { NoBusinessLinked } from '@/components/no-business-linked';
import { getOwnerBusiness, getSettingsData } from '@/lib/dashboard/queries';
import { SettingsClient } from './settings-client';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const business = await getOwnerBusiness();
  if (!business) return <NoBusinessLinked />;

  const data = await getSettingsData(business);
  return <SettingsClient data={data} />;
}
