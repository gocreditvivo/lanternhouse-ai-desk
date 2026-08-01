'use client';

import { useState } from 'react';
import {
  Search, Phone, Mail, Clock, TrendingUp, Users, MoreVertical,
  X, Calendar, MessageSquare
} from 'lucide-react';

const customers = [
  { id: 1, name: 'Linda Nguyen', phone: '+1 571-555-0142', email: 'linda@email.com', language: 'vi', calls: 12, bookings: 8, orders: 0, ltv: 420.00, lastVisit: '2 days ago' },
  { id: 2, name: 'Kevin Tran', phone: '+1 703-555-0198', email: 'ktran@email.com', language: 'vi', calls: 5, bookings: 0, orders: 5, ltv: 187.50, lastVisit: '1 day ago' },
  { id: 3, name: 'Mai Le', phone: '+1 281-555-0167', email: '', language: 'vi', calls: 3, bookings: 3, orders: 0, ltv: 215.00, lastVisit: '5 days ago' },
  { id: 4, name: 'Sarah Johnson', phone: '+1 571-555-0192', email: 'sarah.j@email.com', language: 'en', calls: 4, bookings: 2, orders: 0, ltv: 95.00, lastVisit: '1 week ago' },
  { id: 5, name: 'David Kim', phone: '+1 202-555-0189', email: 'dkim@email.com', language: 'en', calls: 2, bookings: 1, orders: 0, ltv: 55.00, lastVisit: '1 week ago' },
  { id: 6, name: 'Lisa Wang', phone: '+1 703-555-0145', email: 'lisa.w@email.com', language: 'en', calls: 6, bookings: 4, orders: 2, ltv: 312.00, lastVisit: '3 days ago' },
  { id: 7, name: 'Quang Nguyen', phone: '+1 571-555-0178', email: 'quang@email.com', language: 'vi', calls: 2, bookings: 0, orders: 1, ltv: 280.00, lastVisit: '2 weeks ago' },
  { id: 8, name: 'Tom Nguyen', phone: '+1 703-555-0156', email: '', language: 'vi', calls: 8, bookings: 0, orders: 6, ltv: 198.00, lastVisit: '4 days ago' },
  { id: 9, name: 'Emily Davis', phone: '+1 202-555-0144', email: 'emily@email.com', language: 'en', calls: 3, bookings: 3, orders: 0, ltv: 165.00, lastVisit: '1 week ago' },
  { id: 10, name: 'John Smith', phone: '+1 202-555-0189', email: 'jsmith@email.com', language: 'en', calls: 1, bookings: 0, orders: 0, ltv: 0, lastVisit: 'Today' },
];

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<typeof customers[0] | null>(null);

  const filtered = customers.filter((c) =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-brand-600" />
            <span className="text-xs text-gray-500">Total Customers</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{customers.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-gray-500">Vietnamese Speakers</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{customers.filter(c => c.language === 'vi').length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-xs text-gray-500">Total Revenue</span>
          </div>
          <p className="text-xl font-bold text-gray-900">${customers.reduce((s, c) => s + c.ltv, 0).toFixed(0)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-orange-600" />
            <span className="text-xs text-gray-500">Avg. LTV</span>
          </div>
          <p className="text-xl font-bold text-gray-900">${(customers.reduce((s, c) => s + c.ltv, 0) / customers.length).toFixed(0)}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search customers by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Customer</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Lang</th>
                <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Calls</th>
                <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Bookings</th>
                <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Orders</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">LTV</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Last Visit</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((customer) => (
                <tr
                  key={customer.id}
                  onClick={() => setSelected(customer)}
                  className="hover:bg-gray-50 cursor-pointer transition"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
                        <span className="text-xs font-bold text-brand-700">
                          {customer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                        <p className="text-xs text-gray-500">{customer.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${customer.language === 'vi' ? 'bg-orange-100 text-orange-600' : 'bg-brand-100 text-brand-600'}`}>
                      {customer.language}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600 hidden md:table-cell">{customer.calls}</td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600 hidden md:table-cell">{customer.bookings}</td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600 hidden lg:table-cell">{customer.orders}</td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">${customer.ltv.toFixed(0)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 hidden sm:table-cell">{customer.lastVisit}</td>
                  <td className="px-4 py-3">
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative bg-white w-full max-w-md h-full overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Customer Profile</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center">
                  <span className="text-lg font-bold text-brand-700">
                    {selected.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{selected.name}</p>
                  <p className="text-sm text-gray-500">{selected.phone}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-gray-50">
                  <p className="text-xs text-gray-500">Language</p>
                  <p className="text-sm font-medium text-gray-900 uppercase">{selected.language}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50">
                  <p className="text-xs text-gray-500">Last Visit</p>
                  <p className="text-sm font-medium text-gray-900">{selected.lastVisit}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-brand-50 text-center">
                  <Phone className="w-4 h-4 text-brand-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-gray-900">{selected.calls}</p>
                  <p className="text-xs text-gray-500">Calls</p>
                </div>
                <div className="p-3 rounded-lg bg-green-50 text-center">
                  <Calendar className="w-4 h-4 text-green-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-gray-900">{selected.bookings}</p>
                  <p className="text-xs text-gray-500">Bookings</p>
                </div>
                <div className="p-3 rounded-lg bg-orange-50 text-center">
                  <MessageSquare className="w-4 h-4 text-orange-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-gray-900">{selected.orders}</p>
                  <p className="text-xs text-gray-500">Orders</p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-green-50 border border-green-100">
                <p className="text-xs text-gray-500">Lifetime Value</p>
                <p className="text-2xl font-bold text-green-700">${selected.ltv.toFixed(2)}</p>
              </div>

              {selected.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {selected.email}
                </div>
              )}

              <div className="flex gap-2">
                <button className="flex-1 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition">
                  Send SMS
                </button>
                <button className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition">
                  View Call History
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
