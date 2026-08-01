'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Search, Mail, Users, TrendingUp, X, Clock
} from 'lucide-react';
import type { CustomerHistory, CustomerRow } from '@/lib/dashboard/types';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function CustomersClient({ customers }: { customers: CustomerRow[] }) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'ltv' | 'calls'>('name');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRow | null>(null);
  const [history, setHistory] = useState<CustomerHistory | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const openCustomer = useCallback((customer: CustomerRow) => {
    setSelectedCustomer(customer);
    setHistory(null);
    setHistoryError(null);
  }, []);

  useEffect(() => {
    if (!selectedCustomer) return;
    const controller = new AbortController();
    fetch(`/api/dashboard/customers/${selectedCustomer.id}/history`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data: CustomerHistory) => setHistory(data))
      .catch((e) => {
        if (e.name === 'AbortError') return;
        console.error('Customer history load error:', e);
        setHistoryError('Could not load this customer’s history.');
      });
    return () => controller.abort();
  }, [selectedCustomer]);

  const filtered = customers
    .filter((c) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (c.name || '').toLowerCase().includes(q) || c.phone_number.includes(q) || (c.email || '').toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortBy === 'ltv') return b.lifetime_value - a.lifetime_value;
      if (sortBy === 'calls') return b.total_calls - a.total_calls;
      return (a.name || '').localeCompare(b.name || '');
    });

  const totalCustomers = customers.length;
  const totalLTV = customers.reduce((s, c) => s + Number(c.lifetime_value), 0);
  const avgLTV = totalCustomers > 0 ? totalLTV / totalCustomers : 0;

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-brand-600" />
            <p className="text-xs text-gray-500">Total Customers</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalCustomers}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <p className="text-xs text-gray-500">Total LTV</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">${totalLTV.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            <p className="text-xs text-gray-500">Avg LTV</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">${avgLTV.toFixed(2)}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Sort by:</span>
          {[
            { key: 'name' as const, label: 'Name' },
            { key: 'ltv' as const, label: 'LTV' },
            { key: 'calls' as const, label: 'Calls' },
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSortBy(opt.key)}
              className={`px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                sortBy === opt.key
                  ? 'bg-brand-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Customer</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Language</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Calls</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Bookings</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Orders</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">LTV</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Since</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((customer) => (
                <tr
                  key={customer.id}
                  onClick={() => openCustomer(customer)}
                  className="hover:bg-gray-50 cursor-pointer transition"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold">
                        {(customer.name || customer.phone_number).slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{customer.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{customer.phone_number}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${customer.preferred_language === 'vi' ? 'bg-orange-100 text-orange-600' : 'bg-brand-100 text-brand-600'}`}>
                      {customer.preferred_language}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-sm text-gray-600">{customer.total_calls}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-sm text-gray-600">{customer.total_bookings}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-sm text-gray-600">{customer.total_orders}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">${Number(customer.lifetime_value).toFixed(2)}</td>
                  <td className="px-4 py-3 hidden sm:table-cell text-sm text-gray-500">{formatDate(customer.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No customers found</p>
          </div>
        )}
      </div>

      {/* Customer detail drawer */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelectedCustomer(null)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative bg-white w-full max-w-md h-full overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Customer Details</h2>
              <button onClick={() => setSelectedCustomer(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-lg font-bold">
                  {(selectedCustomer.name || selectedCustomer.phone_number).slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-lg">{selectedCustomer.name || 'Unknown'}</p>
                  <p className="text-sm text-gray-500">{selectedCustomer.phone_number}</p>
                </div>
              </div>

              {selectedCustomer.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  {selectedCustomer.email}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-gray-50">
                  <p className="text-xs text-gray-500">Language</p>
                  <p className="text-sm font-medium text-gray-900 uppercase">{selectedCustomer.preferred_language}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50">
                  <p className="text-xs text-gray-500">Customer Since</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(selectedCustomer.created_at)}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50">
                  <p className="text-xs text-gray-500">Total Calls</p>
                  <p className="text-sm font-medium text-gray-900">{selectedCustomer.total_calls}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50">
                  <p className="text-xs text-gray-500">Total Bookings</p>
                  <p className="text-sm font-medium text-gray-900">{selectedCustomer.total_bookings}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50">
                  <p className="text-xs text-gray-500">Total Orders</p>
                  <p className="text-sm font-medium text-gray-900">{selectedCustomer.total_orders}</p>
                </div>
                <div className="p-3 rounded-lg bg-green-50">
                  <p className="text-xs text-gray-500">Lifetime Value</p>
                  <p className="text-sm font-medium text-green-700">${Number(selectedCustomer.lifetime_value).toFixed(2)}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Recent Activity
                </p>

                {historyError && <p className="text-sm text-red-600">{historyError}</p>}

                {!history && !historyError && (
                  <div className="flex items-center justify-center py-6">
                    <div className="w-6 h-6 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
                  </div>
                )}

                {history && (
                  <div className="space-y-2">
                    {history.calls.map((call) => (
                      <div key={call.id} className="p-3 rounded-lg bg-gray-50 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm text-gray-900 capitalize">{(call.intent || 'call').replace('_', ' ')}</p>
                          <p className="text-xs text-gray-500">{formatDate(call.created_at)} · {call.status}</p>
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {Math.floor(call.duration_seconds / 60)}:{(call.duration_seconds % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                    ))}
                    {history.bookings.map((booking) => (
                      <div key={booking.id} className="p-3 rounded-lg bg-brand-50 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm text-gray-900">{booking.service_name || 'Booking'}</p>
                          <p className="text-xs text-gray-500">
                            {booking.preferred_date} at {booking.preferred_time.slice(0, 5)} · {booking.status}
                          </p>
                        </div>
                      </div>
                    ))}
                    {history.orders.map((order) => (
                      <div key={order.id} className="p-3 rounded-lg bg-green-50 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm text-gray-900 capitalize">{order.order_type} order</p>
                          <p className="text-xs text-gray-500">{formatDate(order.created_at)} · {order.status}</p>
                        </div>
                        <span className="text-sm font-medium text-gray-900 flex-shrink-0">${order.total.toFixed(2)}</span>
                      </div>
                    ))}
                    {history.calls.length === 0 && history.bookings.length === 0 && history.orders.length === 0 && (
                      <p className="text-sm text-gray-500">No activity recorded yet.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
