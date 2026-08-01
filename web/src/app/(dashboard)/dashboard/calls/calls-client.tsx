'use client';

import { useState } from 'react';
import {
  Search, Phone, PhoneMissed, Clock, MoreVertical,
  ChevronLeft, ChevronRight, Play
} from 'lucide-react';
import type { CallRow } from '@/lib/dashboard/types';

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
};

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.floor(hrs / 24)} day(s) ago`;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function CallsClient({ calls }: { calls: CallRow[] }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedCall, setSelectedCall] = useState<CallRow | null>(null);

  const filtered = calls.filter((c) => {
    if (filter !== 'all' && c.status !== filter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.phone_number.includes(search) ||
      (c.outcome || '').toLowerCase().includes(q) ||
      (c.customer_name || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, phone, or outcome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
          />
        </div>
        <div className="flex items-center gap-2">
          {['all', 'completed', 'transferred', 'missed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2.5 rounded-lg text-sm font-medium transition capitalize ${
                filter === f
                  ? 'bg-brand-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-300'
              }`}
            >
              {f}
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
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Caller</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Lang</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Intent</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Duration</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Time</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((call) => (
                <tr
                  key={call.id}
                  onClick={() => setSelectedCall(call)}
                  className="hover:bg-gray-50 cursor-pointer transition"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${call.status === 'missed' ? 'bg-red-50' : 'bg-brand-50'}`}>
                        {call.status === 'missed' ? <PhoneMissed className="w-4 h-4 text-red-500" /> : <Phone className="w-4 h-4 text-brand-600" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{call.customer_name || call.phone_number}</p>
                        <p className="text-xs text-gray-500">{call.customer_name ? call.phone_number : formatTimeAgo(call.created_at)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${call.language === 'vi' ? 'bg-orange-100 text-orange-600' : 'bg-brand-100 text-brand-600'}`}>
                      {call.language}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {call.intent && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${intentColors[call.intent] || intentColors.general}`}>
                        {call.intent.replace('_', ' ')}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(call.duration_seconds)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[call.status]}`}>
                      {call.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-sm text-gray-500">{formatTimeAgo(call.created_at)}</td>
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

        {filtered.length === 0 && (
          <div className="p-12 text-center">
            <Phone className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No calls found</p>
          </div>
        )}

        <div className="flex items-center justify-between p-4 border-t border-gray-100">
          <p className="text-xs text-gray-500">Showing {filtered.length} of {calls.length} calls</p>
          <div className="flex items-center gap-2">
            <button className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Call detail drawer */}
      {selectedCall && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelectedCall(null)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative bg-white w-full max-w-md h-full overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Call Details</h2>
              <button onClick={() => setSelectedCall(null)} className="text-gray-400 hover:text-gray-600 text-sm">Close</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${selectedCall.language === 'vi' ? 'bg-orange-100 text-orange-600' : 'bg-brand-100 text-brand-600'}`}>
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{selectedCall.customer_name || selectedCall.phone_number}</p>
                  <p className="text-sm text-gray-500">
                    {selectedCall.customer_name ? `${selectedCall.phone_number} · ` : ''}
                    {formatTimeAgo(selectedCall.created_at)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-gray-50">
                  <p className="text-xs text-gray-500">Language</p>
                  <p className="text-sm font-medium text-gray-900 uppercase">{selectedCall.language}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50">
                  <p className="text-xs text-gray-500">Duration</p>
                  <p className="text-sm font-medium text-gray-900">{formatDuration(selectedCall.duration_seconds)}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50">
                  <p className="text-xs text-gray-500">Intent</p>
                  <p className="text-sm font-medium text-gray-900 capitalize">{(selectedCall.intent || 'general').replace('_', ' ')}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50">
                  <p className="text-xs text-gray-500">Status</p>
                  <p className="text-sm font-medium text-gray-900 capitalize">{selectedCall.status}</p>
                </div>
              </div>

              {selectedCall.summary && (
                <div className="p-4 rounded-lg bg-brand-50 border border-brand-100">
                  <p className="text-xs font-medium text-brand-700 mb-1">AI Summary</p>
                  <p className="text-sm text-gray-700">{selectedCall.summary}</p>
                </div>
              )}

              {selectedCall.outcome && (
                <div className="p-4 rounded-lg bg-gray-50">
                  <p className="text-xs font-medium text-gray-500 mb-1">Outcome</p>
                  <p className="text-sm text-gray-700">{selectedCall.outcome}</p>
                </div>
              )}

              {selectedCall.duration_seconds > 0 && (
                <div className="p-4 rounded-lg bg-gray-50">
                  <p className="text-xs font-medium text-gray-500 mb-3">Recording</p>
                  <div className="flex items-center gap-3">
                    <button className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center hover:bg-brand-700 transition">
                      <Play className="w-4 h-4 text-white ml-0.5" />
                    </button>
                    <div className="flex-1">
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full w-0 bg-brand-500 rounded-full" />
                      </div>
                      <div className="flex justify-between mt-1 text-xs text-gray-400">
                        <span>0:00</span>
                        <span>{formatDuration(selectedCall.duration_seconds)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
