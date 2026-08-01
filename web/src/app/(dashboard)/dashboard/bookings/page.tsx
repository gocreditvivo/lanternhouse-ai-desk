import { NoBusinessLinked } from '@/components/no-business-linked';
import { getBookings, getOwnerBusiness } from '@/lib/dashboard/queries';
import { BookingsClient } from './bookings-client';

export const dynamic = 'force-dynamic';

export default async function BookingsPage() {
  const business = await getOwnerBusiness();
  if (!business) return <NoBusinessLinked />;

  const bookings = await getBookings(business);
  return <BookingsClient bookings={bookings} />;
}
