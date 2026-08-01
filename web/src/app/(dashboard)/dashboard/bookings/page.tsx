'use client';

import { useState } from 'react';
import {
  Search, Filter, Calendar, Clock, User, Phone, Check, X,
  ChevronLeft, ChevronRight, MoreVertical, Plus
} from 'lucide-react';

const bookings = [
  { id: 1, name: 'Linda Nguyen', phone: '+1 571-555-0142', service: 'Gel Manicure', date: '2026-08-01', time: '14:00', staff: 'Amy', status: 'confirmed', source: 'ai' },
  { id: 2, name: 'Mai Le', phone: '+1 281-555-0167', service: 'Full Set + Pedicure', date: '2026-08-01', time: '15:30', staff: 'Lisa', status: 'confirmed', source: 'ai' },
  { id: 3, name: 'Kevin Tran', phone: '+1 703-555-0198', service: 'Pickup Order (2 items)', date: '2026-08-01', time: '17:00', staff: '—', status: 'confirmed', source: 'ai' },
  { id: 4, name: 'Sarah Johnson', phone: '+1 571-555-0192', service: 'Pedicure', date: '2026-08-02', time: '10:00', staff: 'Amy', status: 'pending', source: 'ai' },
  { id: 5, name: 'David Kim', phone: '+1 202-555-0189', service: 'Haircut + Wash', date: '2026-08-02', time: '11:30', staff: 'Tony', status: 'pending', source: 'ai' },
  { id: 6, name: 'Lisa Wang', phone: '+1 703-555-0145', service: 'Manicure', date: '2026-08-02', time: '14:00', staff: 'Lisa', status: 'confirmed', source: 'staff' },
  { id: 7, name: 'Quang Nguyen', phone: '+1 571-555-0178', service: 'Catering (30 people)', date: '2026-08-03', time: '12:00', staff: '—', status: 'pending', source: 'ai' },
  { id: 8, name: 'Emily Davis', phone: '+1 202-555-0144', service: 'Gel Pedicure', date: '2026-08-03', time: '15:00', staff: 'Amy', status: 'confirmed', source: 'ai' },
];

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

export default function BookingsPage() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = bookings.filter((b) => {
    if (filter !== 'all' && b.status !== filter) return false;
    if (search && !b.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by customer name..."
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

      {/* Bookings grid */}
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
                    <p className="font-medium text-gray-900 text-sm">{booking.name}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[booking.status]}`}>
                      {booking.status.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${sourceColors[booking.source]}`}>
                      {booking.source === 'ai' ? 'AI Booked' : booking.source === 'staff' ? 'Staff' : 'Online'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{booking.service}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {booking.date} at {booking.time}
                    </span>
                    {booking.staff !== '—' && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {booking.staff}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {booking.phone}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {booking.status === 'pending' && (
                  <>
                    <button className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition" title="Confirm">
                      <Check className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition" title="Cancel">
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
