'use client';

import {
  Phone, CalendarCheck, PhoneMissed, Users,
  Clock, ArrowUpRight, ArrowDownRight, MoreVertical, UtensilsCrossed
} from 'lucide-react';
import type { DashboardStats } from '@/lib/dashboard/types';

const intentColors: Record<string, string> = {
  booking: 'bg-brand-100 text-brand-700',
  order: 'bg-green-100 text-green-700',
  menu_inquiry: 'bg-gray-100 text-gray-700',
  complaint: 'bg-red-100 text-red-700',
  catering: 'bg-purple-100 text-purple-700',
  manager: 'bg-orange-100 text-orange-700',
  general: 'bg-gray-100 text-gray-700',
};

const statusColors: Record<string, string> = {
  completed: 'bg-green-100 text-green-700',
  transferred: 'bg-orange-100 text-orange-700',
  missed: 'bg-red-100 text-red-700',
  failed: 'bg-red-100 text-red-700',
  in_progress: 'bg-brand-100 text-brand-700',
  confirmed: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  preparing: 'bg-orange-100 text-orange-700',
  ready: 'bg-green-100 text-green-700',
};

const colorMap: Record<string, string> = {
  brand: 'bg-brand-50 text-brand-600',
  green: 'bg-green-50 text-green-600',
  red: 'bg-red-50 text-red-600',
  purple: 'bg-purple-50 text-purple-600',
};

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function weekdayLabel(dayKey: string): string {
  const [y, m, d] = dayKey.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
}

export function OverviewClient({ stats, showOrders }: { stats: DashboardStats; showOrders: boolean }) {
  const statsCards = [
    { label: 'Calls Today', value: stats.callsToday, change: stats.callsToday > 0 ? `${stats.callsToday} today` : 'No calls', trend: 'up' as const, icon: Phone, color: 'brand' },
    { label: 'Bookings Today', value: stats.bookingsToday, change: stats.bookingsToday > 0 ? `${stats.bookingsToday} today` : 'None today', trend: 'up' as const, icon: CalendarCheck, color: 'green' },
    { label: 'Missed Calls', value: stats.missedCalls, change: stats.missedCalls === 0 ? 'Great!' : `${stats.missedCalls} missed`, trend: stats.missedCalls > 0 ? 'up' as const : 'down' as const, icon: PhoneMissed, color: 'red' },
    { label: 'New Customers', value: stats.newCustomers, change: stats.newCustomers > 0 ? `${stats.newCustomers} new` : 'No new', trend: 'up' as const, icon: Users, color: 'purple' },
  ];

  const peakCalls = Math.max(1, ...stats.callVolume.map((d) => d.count));

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white rounded-xl p-5 border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[stat.color]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className={`flex items-center gap-0.5 text-xs font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Two-column layout */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent calls */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Calls</h2>
            <a href="/dashboard/calls" className="text-xs text-brand-600 font-medium hover:text-brand-700">View all</a>
          </div>
          <div className="divide-y divide-gray-50">
            {stats.recentCalls.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">No calls yet</div>
            ) : (
              stats.recentCalls.map((call) => (
                <div key={call.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${call.language === 'vi' ? 'bg-orange-100 text-orange-600' : 'bg-brand-100 text-brand-600'}`}>
                    <span className="text-xs font-bold uppercase">{call.language}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{call.customer_name || call.phone_number}</p>
                    <p className="text-xs text-gray-500">{formatTimeAgo(call.created_at)}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2">
                    {call.intent && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${intentColors[call.intent] || intentColors.general}`}>
                        {call.intent.replace('_', ' ')}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[call.status] || statusColors.pending}`}>
                      {call.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 hidden md:block">{formatDuration(call.duration_seconds)}</div>
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming bookings */}
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Upcoming</h2>
            <a href="/dashboard/bookings" className="text-xs text-brand-600 font-medium hover:text-brand-700">View all</a>
          </div>
          <div className="divide-y divide-gray-50">
            {stats.upcomingBookings.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">No upcoming bookings</div>
            ) : (
              stats.upcomingBookings.map((booking) => (
                <div key={booking.id} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900">{booking.customer_name}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[booking.status] || statusColors.pending}`}>
                      {booking.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{booking.service_name}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {booking.preferred_date} at {booking.preferred_time.slice(0, 5)}
                    </span>
                    {booking.staff_name && booking.staff_name !== '—' && <span>· {booking.staff_name}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent orders */}
      {showOrders && (
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Orders</h2>
            <a href="/dashboard/orders" className="text-xs text-brand-600 font-medium hover:text-brand-700">View all</a>
          </div>
          <div className="divide-y divide-gray-50">
            {stats.recentOrders.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">No orders yet</div>
            ) : (
              stats.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition">
                  <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                    <UtensilsCrossed className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{order.customer_name}</p>
                    <p className="text-xs text-gray-500">
                      {order.items.reduce((s, i) => s + i.qty, 0)} items · {formatTimeAgo(order.created_at)}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status] || statusColors.pending}`}>
                    {order.status}
                  </span>
                  <p className="text-sm font-bold text-gray-900">${order.total.toFixed(2)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Call volume chart */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Call Volume (Last 7 Days)</h2>
        <div className="flex items-end justify-between gap-2 h-40">
          {stats.callVolume.map((bar) => (
            <div key={bar.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <span className="text-xs font-medium text-gray-600">{bar.count}</span>
              <div
                className="w-full bg-brand-500 rounded-t-lg min-h-[2px]"
                style={{ height: `${(bar.count / peakCalls) * 100}%` }}
              />
              <span className="text-xs text-gray-500">{weekdayLabel(bar.day)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
