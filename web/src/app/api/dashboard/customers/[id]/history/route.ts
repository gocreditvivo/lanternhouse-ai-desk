import { NextResponse } from 'next/server';
import { getCustomerHistory, getOwnerBusiness } from '@/lib/dashboard/queries';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const business = await getOwnerBusiness();
  if (!business) {
    return NextResponse.json({ error: 'No business linked to this account.' }, { status: 403 });
  }

  const history = await getCustomerHistory(business, params.id);
  if (!history) {
    return NextResponse.json({ error: 'Customer not found.' }, { status: 404 });
  }

  return NextResponse.json(history);
}
