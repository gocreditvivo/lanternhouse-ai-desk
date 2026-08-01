import { NoBusinessLinked } from '@/components/no-business-linked';
import { getCustomers, getOwnerBusiness } from '@/lib/dashboard/queries';
import { CustomersClient } from './customers-client';

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  const business = await getOwnerBusiness();
  if (!business) return <NoBusinessLinked />;

  const customers = await getCustomers(business);
  return <CustomersClient customers={customers} />;
}
