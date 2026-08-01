'use client';

import { useState } from 'react';
import {
  Search, Filter, Download, Phone, PhoneIncoming, PhoneMissed,
  Clock, MoreVertical, ChevronLeft, ChevronRight, Play
} from 'lucide-react';

const calls = [
  { id: 1, name: 'Linda Nguyen', phone: '+1 571-555-0142', language: 'en', intent: 'booking', duration: '2:34', status: 'completed', time: '10 min ago', outcome: 'Booked gel manicure for 2pm' },
  { id: 2, name: 'Kevin Tran', phone: '+1 703-555-0198', language: 'vi', intent: 'order', duration: '4:12', status: 'completed', time: '23 min ago', outcome: 'Took pho order for pickup' },
  { id: 3, name: 'Mai Le', phone: '+1 281-555-0167', language: 'vi', intent: 'booking', duration: '1:45', status: 'completed', time: '41 min ago', outcome: 'Booked full set + pedicure' },
  { id: 4, name: 'Unknown Caller', phone: '+1 571-555-0233', language: 'en', intent: 'menu_inquiry', duration: '0:58', status: 'completed', time: '1 hr ago', outcome: 'Answered menu questions' },
  { id: 5, name: 'John Smith', phone: '+1 202-555-0189', language: 'en', intent: 'complaint', duration: '5:23', status: 'transferred', time: '2 hr ago', outcome: 'Transferred to manager' },
  { id: 6, name: 'Lisa Wang', phone: '+1 703-555-0145', language: 'en', intent: 'booking', duration: '3:01', status: 'completed', time: '3 hr ago', outcome: 'Booked pedicure tomorrow' },
  { id: 7, name: 'Quang Nguyen', phone: '+1 571-555-0178', language: 'vi', intent: 'catering', duration: '6:45', status: 'completed', time: '4 hr ago', outcome: 'Catering inquiry for 30 people' },
  { id: 8, name: 'Unknown Caller', phone: '+1 202-555-0167', language: 'en', intent: 'general', duration: '0:00', status: 'missed', time: '5 hr ago', outcome: 'No message left' },
  { id: 9, name: 'Sarah Johnson', phone: '+1 571-555-0192', language: 'en', intent: 'booking', duration: '2:15', status: 'completed', time: '6 hr ago', outcome: 'Booked pedicure tomorrow 10am' },
  { id: 10, name: 'Tom Nguyen', phone: '+1 703-555-0156', language: 'vi', intent: 'order', duration: '3:33', status: 'completed', time: '7 hr ago', outcome: 'Took bun thit nuong order' },
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
};

export default function CallsPage() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedCall, setSelectedCall] = useState<typeof calls[0] | null>(null);

  const filtered = calls.filter((c) => {
    if (filter !== 'all' && c.status !== filter) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.phone.includes(search)) return false;
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
            placeholder="Search by name or phone..."
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
                        <p className="text-sm font-medium text-gray-900">{call.name}</p>
                        <p className="text-xs text-gray-500">{call.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${call.language === 'vi' ? 'bg-orange-100 text-orange-600' : 'bg-brand-100 text-brand-600'}`}>
                      {call.language}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${intentColors[call.intent] || intentColors.general}`}>
                      {call.intent.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {call.duration}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[call.status]}`}>
                      {call.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-sm text-gray-500">{call.time}</td>
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

        {/* Pagination */}
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
                  <p className="font-semibold text-gray-900">{selectedCall.name}</p>
                  <p className="text-sm text-gray-500">{selectedCall.phone}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-gray-50">
                  <p className="text-xs text-gray-500">Language</p>
                  <p className="text-sm font-medium text-gray-900 uppercase">{selectedCall.language}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50">
                  <p className="text-xs text-gray-500">Duration</p>
                  <p className="text-sm font-medium text-gray-900">{selectedCall.duration}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50">
                  <p className="text-xs text-gray-500">Intent</p>
                  <p className="text-sm font-medium text-gray-900 capitalize">{selectedCall.intent.replace('_', ' ')}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50">
                  <p className="text-xs text-gray-500">Status</p>
                  <p className="text-sm font-medium text-gray-900 capitalize">{selectedCall.status}</p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-brand-50 border border-brand-100">
                <p className="text-xs font-medium text-brand-700 mb-1">AI Summary</p>
                <p className="text-sm text-gray-700">{selectedCall.outcome}</p>
              </div>

              {/* Audio player placeholder */}
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
                      <span>{selectedCall.duration}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transcript preview */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Transcript Preview</p>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-gray-50 text-sm">
                    <p className="text-xs text-brand-600 font-medium mb-1">Linh (AI)</p>
                    <p className="text-gray-700">Thank you for calling. This is Linh. How can I help you today?</p>
                  </div>
                  <div className="p-3 rounded-lg bg-orange-50 text-sm">
                    <p className="text-xs text-orange-600 font-medium mb-1">Caller</p>
                    <p className="text-gray-700">Hi, I'd like to book an appointment for a gel manicure.</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 text-sm">
                    <p className="text-xs text-brand-600 font-medium mb-1">Linh (AI)</p>
                    <p className="text-gray-700">Of course! What day and time works best for you?</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
