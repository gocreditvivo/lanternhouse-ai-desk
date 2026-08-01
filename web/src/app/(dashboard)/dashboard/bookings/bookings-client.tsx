'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Calendar, Clock, User, Phone, MapPin, Check, X, MoreVertical
} from 'lucide-react';
import type { BookingRow } from '@/lib/dashboard/types';
import { updateBookingStatus } from './actions';

const statusColors: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-gray-100 text-gray-600',
  canceled: 'bg-red-100 text-red-700',
  no_show: 'bg-red-100 text-red-700',
};

const sourceColors: Record<string, string> = {
  ai: 'bg-brand-100 text-brand-700',
  staff: 'bg-gray-100 text-gray-600',
  customer_online: 'bg-purple-100 text-purple-700',
};

export function BookingsClient({ bookings }: { bookings: BookingRow[] }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const filtered = bookings.filter((b) => {
    if (filter !== 'all' && b.status !== filter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return b.customer_name.toLowerCase().includes(q) || b.customer_phone.includes(search);
  });

  function setStatus(id: string, status: 'confirmed' | 'canceled') {
    setError(null);
    startTransition(async () => {
      const result = await updateBookingStatus(id, status);
      if (result?.error) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {error && (
        <div role="alert" className="px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by customer name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {['all', 'pending', 'confirmed', 'completed', 'canceled'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2.5 rounded-lg text-sm font-medium transition capitalize whitespace-nowrap ${
                filter === f
                  ? 'bg-brand-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-300'
              }`}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3">
        {filtered.map((booking) => (
          <div key={booking.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:border-brand-200 transition">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-brand-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-gray-900 text-sm">{booking.customer_name}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[booking.status]}`}>
                      {booking.status.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${sourceColors[booking.created_by] || sourceColors.staff}`}>
                      {booking.created_by === 'ai' ? 'AI Booked' : booking.created_by === 'staff' ? 'Staff' : 'Online'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{booking.service_name || 'Service'}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {booking.preferred_date} at {booking.preferred_time.slice(0, 5)}
                    </span>
                    {booking.staff_name && booking.staff_name !== '—' && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {booking.staff_name}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {booking.customer_phone}
                    </span>
                    {booking.location_name && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {booking.location_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {booking.status === 'pending' && (
                  <>
                    <button
                      onClick={() => setStatus(booking.id, 'confirmed')}
                      disabled={pending}
                      className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition disabled:opacity-50"
                      title="Confirm"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setStatus(booking.id, 'canceled')}
                      disabled={pending}
                      className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition disabled:opacity-50"
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                )}
                <button className="p-2 rounded-lg text-gray-400 hover:bg-gray-100">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No bookings found</p>
        </div>
      )}
    </div>
  );
}
