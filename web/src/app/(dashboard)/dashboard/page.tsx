'use client';

import { useState } from 'react';
import {
  Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed,
  Calendar, CalendarCheck, Users, TrendingUp, Clock,
  ArrowUpRight, ArrowDownRight, MoreVertical
} from 'lucide-react';

// Mock data — will be replaced with Supabase queries
const stats = [
  { label: 'Calls Today', value: '24', change: '+12%', trend: 'up', icon: Phone, color: 'brand' },
  { label: 'Bookings Today', value: '8', change: '+25%', trend: 'up', icon: CalendarCheck, color: 'green' },
  { label: 'Missed Calls', value: '2', change: '-50%', trend: 'down', icon: PhoneMissed, color: 'red' },
  { label: 'New Customers', value: '5', change: '+3', trend: 'up', icon: Users, color: 'purple' },
];

const recentCalls = [
  { id: 1, name: 'Linda Nguyen', phone: '+1 571-555-0142', language: 'en', intent: 'booking', duration: '2:34', status: 'completed', time: '10 min ago' },
  { id: 2, name: 'Kevin Tran', phone: '+1 703-555-0198', language: 'vi', intent: 'order', duration: '4:12', status: 'completed', time: '23 min ago' },
  { id: 3, name: 'Mai Le', phone: '+1 281-555-0167', language: 'vi', intent: 'booking', duration: '1:45', status: 'completed', time: '41 min ago' },
  { id: 4, name: 'Unknown', phone: '+1 571-555-0233', language: 'en', intent: 'menu_inquiry', duration: '0:58', status: 'completed', time: '1 hr ago' },
  { id: 5, name: 'John Smith', phone: '+1 202-555-0189', language: 'en', intent: 'complaint', duration: '5:23', status: 'transferred', time: '2 hr ago' },
];

const upcomingBookings = [
  { id: 1, name: 'Linda Nguyen', service: 'Gel Manicure', date: 'Today', time: '2:00 PM', staff: 'Amy', status: 'confirmed' },
  { id: 2, name: 'Mai Le', service: 'Full Set + Pedicure', date: 'Today', time: '3:30 PM', staff: 'Lisa', status: 'confirmed' },
  { id: 3, name: 'Kevin Tran', service: 'Pickup Order (2 items)', date: 'Today', time: '5:00 PM', staff: '—', status: 'confirmed' },
  { id: 4, name: 'Sarah Johnson', service: 'Pedicure', date: 'Tomorrow', time: '10:00 AM', staff: 'Amy', status: 'pending' },
  { id: 5, name: 'David Kim', service: 'Haircut + Wash', date: 'Tomorrow', time: '11:30 AM', staff: 'Tony', status: 'pending' },
];

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
};

const colorMap: Record<string, string> = {
  brand: 'bg-brand-50 text-brand-600',
  green: 'bg-green-50 text-green-600',
  red: 'bg-red-50 text-red-600',
  purple: 'bg-purple-50 text-purple-600',
};

export default function DashboardOverview() {
  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white rounded-xl p-5 border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[stat.color]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className={`flex items-center gap-0.5 text-xs font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {stat.change}
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
            {recentCalls.map((call) => (
              <div key={call.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${call.language === 'vi' ? 'bg-orange-100 text-orange-600' : 'bg-brand-100 text-brand-600'}`}>
                  <span className="text-xs font-bold uppercase">{call.language}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{call.name}</p>
                  <p className="text-xs text-gray-500">{call.phone} · {call.time}</p>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${intentColors[call.intent] || intentColors.general}`}>
                    {call.intent.replace('_', ' ')}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[call.status] || statusColors.pending}`}>
                    {call.status}
                  </span>
                </div>
                <div className="text-xs text-gray-400 hidden md:block">{call.duration}</div>
                <button className="p-1 text-gray-400 hover:text-gray-600">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming bookings */}
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Upcoming</h2>
            <a href="/dashboard/bookings" className="text-xs text-brand-600 font-medium hover:text-brand-700">View all</a>
          </div>
          <div className="divide-y divide-gray-50">
            {upcomingBookings.map((booking) => (
              <div key={booking.id} className="p-4 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between mb-1">
                  <p className="text-sm font-medium text-gray-900">{booking.name}</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[booking.status]}`}>
                    {booking.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{booking.service}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {booking.date} · {booking.time}
                  </span>
                  {booking.staff !== '—' && <span>· {booking.staff}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Call volume chart placeholder */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Call Volume (Last 7 Days)</h2>
        <div className="flex items-end justify-between gap-2 h-40">
          {[
            { day: 'Mon', height: 45 },
            { day: 'Tue', height: 60 },
            { day: 'Wed', height: 75 },
            { day: 'Thu', height: 55 },
            { day: 'Fri', height: 90 },
            { day: 'Sat', height: 100 },
            { day: 'Sun', height: 65 },
          ].map((bar, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full bg-brand-100 rounded-t-lg relative" style={{ height: `${bar.height}%` }}>
                <div className="absolute bottom-0 left-0 right-0 bg-brand-500 rounded-t-lg" style={{ height: '60%' }} />
              </div>
              <span className="text-xs text-gray-500">{bar.day}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
