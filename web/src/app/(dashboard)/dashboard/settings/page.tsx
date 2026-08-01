'use client';

import { useState } from 'react';
import {
  Phone, Building2, Clock, Globe, Save, Plus, Trash2,
  Check, Settings as SettingsIcon, Bell
} from 'lucide-react';

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const initialHours = [
  { day: 0, open: '10:00', close: '21:30', closed: false },
  { day: 1, open: '11:00', close: '21:30', closed: false },
  { day: 2, open: '11:00', close: '21:30', closed: false },
  { day: 3, open: '11:00', close: '21:30', closed: false },
  { day: 4, open: '11:00', close: '22:00', closed: false },
  { day: 5, open: '11:00', close: '22:00', closed: false },
  { day: 6, open: '11:00', close: '21:30', closed: false },
];

const services = [
  { id: 1, name: 'Gel Manicure', price: 35, duration: 45 },
  { id: 2, name: 'Full Set Acrylic', price: 50, duration: 60 },
  { id: 3, name: 'Pedicure', price: 30, duration: 30 },
  { id: 4, name: 'Gel Pedicure', price: 45, duration: 45 },
];

export default function SettingsPage() {
  const [tab, setTab] = useState('business');
  const [hours, setHours] = useState(initialHours);
  const [serviceList, setServiceList] = useState(services);
  const [saved, setSaved] = useState(false);

  const toggleClosed = (day: number) => {
    setHours(hours.map(h => h.day === day ? { ...h, closed: !h.closed } : h));
  };

  const updateHour = (day: number, field: string, value: string) => {
    setHours(hours.map(h => h.day === day ? { ...h, [field]: value } : h));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tabs = [
    { id: 'business', label: 'Business', icon: Building2 },
    { id: 'hours', label: 'Hours', icon: Clock },
    { id: 'services', label: 'Services', icon: SettingsIcon },
    { id: 'voice', label: 'Voice AI', icon: Phone },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto no-scrollbar border-b border-gray-200">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition ${
                tab === t.id
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Business tab */}
      {tab === 'business' && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4 max-w-2xl">
          <h2 className="font-semibold text-gray-900">Business Information</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Business Name</label>
              <input type="text" defaultValue="Lantern House Vietnamese Restaurant" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Business Type</label>
              <select className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-400">
                <option>Restaurant</option>
                <option>Nail Salon</option>
                <option>Beauty Spa</option>
                <option>Both Salon & Restaurant</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Phone Number</label>
              <input type="text" defaultValue="+1 571-749-5444" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Website</label>
              <input type="text" defaultValue="lanternhousevietbistro.com" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Timezone</label>
              <select className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-400">
                <option>America/New_York (EST)</option>
                <option>America/Chicago (CST)</option>
                <option>America/Denver (MST)</option>
                <option>America/Los_Angeles (PST)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Default Language</label>
              <select className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-400">
                <option>English + Vietnamese</option>
                <option>English only</option>
                <option>Vietnamese only</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Locations</label>
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-3 rounded-lg border border-gray-200">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Reston</p>
                  <p className="text-xs text-gray-500">12001 Creekview Rd, Reston VA 20194</p>
                </div>
                <button className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg border border-gray-200">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Falls Church</p>
                  <p className="text-xs text-gray-500">6111 Leesburg Pike, Falls Church VA 22044</p>
                </div>
                <button className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
              <button className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 font-medium">
                <Plus className="w-4 h-4" />
                Add Location
              </button>
            </div>
          </div>

          <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition">
            {saved ? <Check className="w-4 h-4 inline mr-1" /> : null}
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      )}

      {/* Hours tab */}
      {tab === 'hours' && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4 max-w-2xl">
          <h2 className="font-semibold text-gray-900">Business Hours</h2>
          <div className="space-y-2">
            {hours.map((h) => (
              <div key={h.day} className="flex items-center gap-4 p-3 rounded-lg border border-gray-100">
                <div className="w-28">
                  <span className="text-sm font-medium text-gray-900">{days[h.day]}</span>
                </div>
                <button
                  onClick={() => toggleClosed(h.day)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium ${
                    h.closed ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'
                  }`}
                >
                  {h.closed ? 'Closed' : 'Open'}
                </button>
                {!h.closed && (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={h.open}
                      onChange={(e) => updateHour(h.day, 'open', e.target.value)}
                      className="px-2 py-1 rounded border border-gray-200 text-sm focus:outline-none focus:border-brand-400"
                    />
                    <span className="text-gray-400 text-sm">to</span>
                    <input
                      type="time"
                      value={h.close}
                      onChange={(e) => updateHour(h.day, 'close', e.target.value)}
                      className="px-2 py-1 rounded border border-gray-200 text-sm focus:outline-none focus:border-brand-400"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition">
            {saved ? <Check className="w-4 h-4 inline mr-1" /> : null}
            {saved ? 'Saved!' : 'Save Hours'}
          </button>
        </div>
      )}

      {/* Services tab */}
      {tab === 'services' && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4 max-w-2xl">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Services & Pricing</h2>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition">
              <Plus className="w-4 h-4" />
              Add Service
            </button>
          </div>
          <div className="space-y-2">
            {serviceList.map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100">
                <div className="flex-1 grid grid-cols-3 gap-2">
                  <input type="text" defaultValue={s.name} className="px-2 py-1.5 rounded border border-gray-200 text-sm focus:outline-none focus:border-brand-400" />
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input type="number" defaultValue={s.price} className="w-full pl-6 pr-2 py-1.5 rounded border border-gray-200 text-sm focus:outline-none focus:border-brand-400" />
                  </div>
                  <div className="relative">
                    <input type="number" defaultValue={s.duration} className="w-full px-2 py-1.5 rounded border border-gray-200 text-sm focus:outline-none focus:border-brand-400" />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">min</span>
                  </div>
                </div>
                <button className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
          <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition">
            {saved ? <Check className="w-4 h-4 inline mr-1" /> : null}
            {saved ? 'Saved!' : 'Save Services'}
          </button>
        </div>
      )}

      {/* Voice AI tab */}
      {tab === 'voice' && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4 max-w-2xl">
          <h2 className="font-semibold text-gray-900">Voice AI Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">AI Name</label>
              <input type="text" defaultValue="Linh" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">AI Voice</label>
              <select className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-400">
                <option>Adam (Warm, Professional)</option>
                <option>Rachel (Calm, Friendly)</option>
                <option>Antoni (Deep, Confident)</option>
                <option>Bella (Soft, Welcoming)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">AI Model</label>
              <select className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-400">
                <option>GPT-4o Mini (Fast, affordable)</option>
                <option>GPT-4o (Best quality)</option>
                <option>Claude 3.5 Sonnet (Natural conversation)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Greeting (English)</label>
              <textarea defaultValue="Thank you for calling Lantern House. This is Linh. How can I help you today?" rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Greeting (Vietnamese)</label>
              <textarea defaultValue="Cảm ơn quý khách đã gọi Lantern House. Em là Linh. Em có thể giúp gì cho quý khách hôm nay?" rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Manager Transfer Number</label>
              <input type="text" defaultValue="+1 571-749-5444" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-400" />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-900">After-hours mode</p>
                <p className="text-xs text-gray-500">AI answers 24/7 even when closed</p>
              </div>
              <button className="w-11 h-6 rounded-full bg-brand-600 relative">
                <span className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-white" />
              </button>
            </div>
          </div>
          <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition">
            {saved ? <Check className="w-4 h-4 inline mr-1" /> : null}
            {saved ? 'Saved!' : 'Save Configuration'}
          </button>
        </div>
      )}

      {/* Notifications tab */}
      {tab === 'notifications' && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4 max-w-2xl">
          <h2 className="font-semibold text-gray-900">Notifications</h2>
          <div className="space-y-3">
            {[
              { label: 'New booking (SMS)', desc: 'Get a text when AI books an appointment', enabled: true },
              { label: 'New order (SMS)', desc: 'Get a text when AI takes a phone order', enabled: true },
              { label: 'Missed call alert', desc: 'Get notified when a call is missed', enabled: true },
              { label: 'Manager transfer', desc: 'Get notified when a call is transferred to you', enabled: true },
              { label: 'Daily summary (SMS)', desc: 'Daily text with call count, bookings, and revenue', enabled: false },
              { label: 'Weekly report (Email)', desc: 'Weekly email with analytics and trends', enabled: true },
              { label: 'Low battery alert', desc: 'Get notified if AI service is down', enabled: true },
            ].map((n, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-900">{n.label}</p>
                  <p className="text-xs text-gray-500">{n.desc}</p>
                </div>
                <button className={`w-11 h-6 rounded-full relative ${n.enabled ? 'bg-brand-600' : 'bg-gray-200'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition ${n.enabled ? 'right-0.5' : 'left-0.5'}`} />
                </button>
              </div>
            ))}
          </div>
          <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition">
            {saved ? <Check className="w-4 h-4 inline mr-1" /> : null}
            {saved ? 'Saved!' : 'Save Preferences'}
          </button>
        </div>
      )}
    </div>
  );
}
