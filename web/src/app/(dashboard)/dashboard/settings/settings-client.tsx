'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Phone, Building2, Clock, Save, Plus, Trash2,
  Check, Settings as SettingsIcon, Bell, Search, ChevronDown, ChevronUp
} from 'lucide-react';
import type {
  HoursRow,
  NotificationSettings,
  ServiceRow,
  SettingsData,
  VoiceSettings,
} from '@/lib/dashboard/types';
import type { MutationResult } from '@/lib/dashboard/mutations';
import {
  addLocation,
  removeLocation,
  saveBusinessProfile,
  saveHours,
  saveNotificationSettings,
  saveServices,
  saveVoiceSettings,
} from './actions';

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const timezones = [
  { value: 'America/New_York', label: 'America/New_York (EST)' },
  { value: 'America/Chicago', label: 'America/Chicago (CST)' },
  { value: 'America/Denver', label: 'America/Denver (MST)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST)' },
];

const voices = [
  'Adam (Warm, Professional)',
  'Rachel (Calm, Friendly)',
  'Antoni (Deep, Confident)',
  'Bella (Soft, Welcoming)',
];

const models = [
  'GPT-4o Mini (Fast, affordable)',
  'GPT-4o (Best quality)',
  'Claude 3.5 Sonnet (Natural conversation)',
];

// Friendly display labels for menu categories. Anything not listed here
// falls back to a title-cased version of the raw value.
const categoryLabels: Record<string, string> = {
  appetizer: 'Appetizers',
  pho: 'Phở',
  rice: 'Rice Dishes',
  entree: 'Entrées',
  noodle: 'Noodles',
  vegetarian: 'Vegetarian',
  banh_mi: 'Bánh Mì',
  addon: 'Add-Ons',
  beverage: 'Beverages',
};

function categoryLabel(cat: string | null): string {
  if (!cat) return 'Uncategorized';
  return categoryLabels[cat] || cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const notificationFields: Array<{ key: keyof NotificationSettings; label: string; desc: string }> = [
  { key: 'new_booking_sms', label: 'New booking (SMS)', desc: 'Get a text when AI books an appointment' },
  { key: 'new_order_sms', label: 'New order (SMS)', desc: 'Get a text when AI takes a phone order' },
  { key: 'missed_call_sms', label: 'Missed call alert', desc: 'Get notified when a call is missed' },
  { key: 'manager_transfer_sms', label: 'Manager transfer', desc: 'Get notified when a call is transferred to you' },
  { key: 'daily_summary_sms', label: 'Daily summary (SMS)', desc: 'Daily text with call count, bookings, and revenue' },
  { key: 'weekly_report_email', label: 'Weekly report (Email)', desc: 'Weekly email with analytics and trends' },
  { key: 'service_down_alert', label: 'Service down alert', desc: 'Get notified if AI service is down' },
];

/** Fills in the days that have no row yet so the editor always shows a full week. */
function weekFor(hours: HoursRow[], locationId: string | null): HoursRow[] {
  return days.map((_, day) => {
    const existing = hours.find((h) => h.location_id === locationId && h.day_of_week === day);
    return (
      existing || {
        id: null,
        location_id: locationId,
        day_of_week: day,
        open_time: '09:00',
        close_time: '17:00',
        is_closed: false,
      }
    );
  });
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className={`w-11 h-6 rounded-full relative flex-shrink-0 transition ${on ? 'bg-brand-600' : 'bg-gray-200'}`}
    >
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${on ? 'right-0.5' : 'left-0.5'}`} />
    </button>
  );
}

export function SettingsClient({ data }: { data: SettingsData }) {
  const [tab, setTab] = useState('business');
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedTab, setSavedTab] = useState<string | null>(null);

  const [profile, setProfile] = useState({
    name: data.business.name,
    type: data.business.type,
    language: data.business.language,
    phone_number: data.business.phone_number || '',
    website: data.business.website || '',
    timezone: data.business.timezone,
  });

  const [locationId, setLocationId] = useState<string | null>(data.locations[0]?.id ?? null);
  const [week, setWeek] = useState<HoursRow[]>(() => weekFor(data.hours, data.locations[0]?.id ?? null));
  const [serviceList, setServiceList] = useState<ServiceRow[]>(data.services);
  const [serviceSearch, setServiceSearch] = useState('');
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());
  const [voice, setVoice] = useState<VoiceSettings>(data.voice);
  const [notifications, setNotifications] = useState<NotificationSettings>(data.notifications);
  const [newLocation, setNewLocation] = useState<{ name: string; address: string } | null>(null);

  function run(key: string, action: () => Promise<MutationResult>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result?.error) {
        setError(result.error);
        return;
      }
      setSavedTab(key);
      router.refresh();
      setTimeout(() => setSavedTab((current) => (current === key ? null : current)), 2000);
    });
  }

  function selectLocation(id: string | null) {
    setLocationId(id);
    setWeek(weekFor(data.hours, id));
  }

  function updateDay(day: number, patch: Partial<HoursRow>) {
    setWeek(week.map((h) => (h.day_of_week === day ? { ...h, ...patch } : h)));
  }

  function updateService(index: number, patch: Partial<ServiceRow>) {
    setServiceList(serviceList.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function toggleCategory(cat: string) {
    setCollapsedCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  const groupedServices = useMemo(() => {
    const query = serviceSearch.trim().toLowerCase();
    const indexed = serviceList.map((s, index) => ({ s, index }));
    const filtered = query
      ? indexed.filter(
          ({ s }) =>
            s.name.toLowerCase().includes(query) ||
            (s.name_vi || '').toLowerCase().includes(query)
        )
      : indexed;
    const groups = new Map<string, { s: ServiceRow; index: number }[]>();
    for (const item of filtered) {
      const key = item.s.category || '__uncategorized__';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    }
    return Array.from(groups.entries()).sort((a, b) =>
      categoryLabel(a[0] === '__uncategorized__' ? null : a[0]).localeCompare(
        categoryLabel(b[0] === '__uncategorized__' ? null : b[0])
      )
    );
  }, [serviceList, serviceSearch]);

  const tabs = [
    { id: 'business', label: 'Business', icon: Building2 },
    { id: 'hours', label: 'Hours', icon: Clock },
    { id: 'services', label: 'Services', icon: SettingsIcon },
    { id: 'voice', label: 'Voice AI', icon: Phone },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  function SaveButton({ tabKey, label, onClick }: { tabKey: string; label: string; onClick: () => void }) {
    const saved = savedTab === tabKey;
    return (
      <button
        onClick={onClick}
        disabled={pending}
        className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition disabled:opacity-50"
      >
        {saved ? <Check className="w-4 h-4 inline mr-1" /> : <Save className="w-4 h-4 inline mr-1" />}
        {saved ? 'Saved!' : label}
      </button>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div role="alert" className="px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">
          {error}
        </div>
      )}

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
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Business Type</label>
              <select
                value={profile.type}
                onChange={(e) => setProfile({ ...profile, type: e.target.value as typeof profile.type })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-400"
              >
                <option value="restaurant">Restaurant</option>
                <option value="salon">Salon / Spa</option>
                <option value="both">Both Salon &amp; Restaurant</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Phone Number</label>
              <input
                type="text"
                value={profile.phone_number}
                onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Website</label>
              <input
                type="text"
                value={profile.website}
                onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Timezone</label>
              <select
                value={profile.timezone}
                onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-400"
              >
                {timezones.some((tz) => tz.value === profile.timezone) ? null : (
                  <option value={profile.timezone}>{profile.timezone}</option>
                )}
                {timezones.map((tz) => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Default Language</label>
              <select
                value={profile.language}
                onChange={(e) => setProfile({ ...profile, language: e.target.value as typeof profile.language })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-400"
              >
                <option value="both">English + Vietnamese</option>
                <option value="en">English only</option>
                <option value="vi">Vietnamese only</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Locations</label>
            <div className="space-y-2">
              {data.locations.map((location) => (
                <div key={location.id} className="flex items-center gap-2 p-3 rounded-lg border border-gray-200">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{location.name}</p>
                    <p className="text-xs text-gray-500">
                      {[location.address, location.city, location.state, location.zip_code]
                        .filter(Boolean)
                        .join(', ') || 'No address on file'}
                    </p>
                  </div>
                  <button
                    onClick={() => run('business', () => removeLocation(location.id))}
                    disabled={pending}
                    aria-label={`Remove ${location.name}`}
                    className="text-gray-400 hover:text-red-500 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {data.locations.length === 0 && !newLocation && (
                <p className="text-sm text-gray-500">No locations yet.</p>
              )}

              {newLocation ? (
                <div className="p-3 rounded-lg border border-brand-200 space-y-2">
                  <input
                    type="text"
                    placeholder="Location name"
                    value={newLocation.name}
                    onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-400"
                  />
                  <input
                    type="text"
                    placeholder="Street address"
                    value={newLocation.address}
                    onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-400"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        run('business', async () => {
                          const result = await addLocation({
                            name: newLocation.name,
                            address: newLocation.address,
                            phone_number: null,
                            city: null,
                            state: null,
                            zip_code: null,
                          });
                          if (!result.error) setNewLocation(null);
                          return result;
                        })
                      }
                      disabled={pending}
                      className="px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-medium hover:bg-brand-700 transition disabled:opacity-50"
                    >
                      Save Location
                    </button>
                    <button
                      onClick={() => setNewLocation(null)}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:border-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setNewLocation({ name: '', address: '' })}
                  className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Location
                </button>
              )}
            </div>
          </div>

          <SaveButton
            tabKey="business"
            label="Save Changes"
            onClick={() => run('business', () => saveBusinessProfile(profile))}
          />
        </div>
      )}

      {/* Hours tab */}
      {tab === 'hours' && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4 max-w-2xl">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-semibold text-gray-900">Business Hours</h2>
            {data.locations.length > 1 && (
              <select
                value={locationId ?? ''}
                onChange={(e) => selectLocation(e.target.value || null)}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-400"
              >
                {data.locations.map((location) => (
                  <option key={location.id} value={location.id}>{location.name}</option>
                ))}
              </select>
            )}
          </div>
          <div className="space-y-2">
            {week.map((h) => (
              <div key={h.day_of_week} className="flex items-center gap-4 p-3 rounded-lg border border-gray-100">
                <div className="w-28">
                  <span className="text-sm font-medium text-gray-900">{days[h.day_of_week]}</span>
                </div>
                <button
                  onClick={() => updateDay(h.day_of_week, { is_closed: !h.is_closed })}
                  className={`px-3 py-1 rounded-lg text-xs font-medium ${
                    h.is_closed ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'
                  }`}
                >
                  {h.is_closed ? 'Closed' : 'Open'}
                </button>
                {!h.is_closed && (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={h.open_time}
                      onChange={(e) => updateDay(h.day_of_week, { open_time: e.target.value })}
                      className="px-2 py-1 rounded border border-gray-200 text-sm focus:outline-none focus:border-brand-400"
                    />
                    <span className="text-gray-400 text-sm">to</span>
                    <input
                      type="time"
                      value={h.close_time}
                      onChange={(e) => updateDay(h.day_of_week, { close_time: e.target.value })}
                      className="px-2 py-1 rounded border border-gray-200 text-sm focus:outline-none focus:border-brand-400"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          <SaveButton tabKey="hours" label="Save Hours" onClick={() => run('hours', () => saveHours(locationId, week))} />
        </div>
      )}

      {/* Services tab */}
      {tab === 'services' && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4 max-w-3xl">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold text-gray-900">Menu &amp; Services</h2>
            <button
              onClick={() =>
                setServiceList([
                  ...serviceList,
                  { id: '', name: '', name_vi: '', price: 0, duration_minutes: null, category: null },
                ])
              }
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>

          <p className="text-sm text-gray-500">
            Linh answers calls in English and Vietnamese. Add a Vietnamese name for each item so she can say it
            correctly to Vietnamese-speaking callers — English-only items still work fine.
          </p>

          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search items by English or Vietnamese name..."
              value={serviceSearch}
              onChange={(e) => setServiceSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-400"
            />
          </div>

          <div className="space-y-3">
            {groupedServices.map(([catKey, items]) => {
              const label = categoryLabel(catKey === '__uncategorized__' ? null : catKey);
              const collapsed = collapsedCats.has(catKey);
              return (
                <div key={catKey} className="border border-gray-100 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleCategory(catKey)}
                    className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition text-left"
                  >
                    <span className="text-sm font-medium text-gray-800">
                      {label} <span className="text-gray-400 font-normal">({items.length})</span>
                    </span>
                    {collapsed ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  {!collapsed && (
                    <div className="p-3 space-y-2">
                      {items.map(({ s, index }) => (
                        <div
                          key={s.id || `new-${index}`}
                          className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-100"
                        >
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <input
                              type="text"
                              placeholder="English name"
                              value={s.name}
                              onChange={(e) => updateService(index, { name: e.target.value })}
                              className="px-2 py-1.5 rounded border border-gray-200 text-sm focus:outline-none focus:border-brand-400"
                            />
                            <input
                              type="text"
                              placeholder="Vietnamese name (optional)"
                              value={s.name_vi ?? ''}
                              onChange={(e) => updateService(index, { name_vi: e.target.value })}
                              className="px-2 py-1.5 rounded border border-gray-200 text-sm focus:outline-none focus:border-brand-400"
                            />
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                              <input
                                type="number"
                                value={s.price}
                                onChange={(e) => updateService(index, { price: Number(e.target.value) || 0 })}
                                className="w-full pl-6 pr-2 py-1.5 rounded border border-gray-200 text-sm focus:outline-none focus:border-brand-400"
                              />
                            </div>
                          </div>
                          <button
                            onClick={() => setServiceList(serviceList.filter((_, i) => i !== index))}
                            aria-label={`Remove ${s.name || 'item'}`}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {groupedServices.length === 0 && (
              <p className="text-sm text-gray-500">
                {serviceSearch
                  ? 'No items match your search.'
                  : 'No items yet. Add one so the AI can quote prices.'}
              </p>
            )}
          </div>
          <SaveButton tabKey="services" label="Save Menu" onClick={() => run('services', () => saveServices(serviceList))} />
        </div>
      )}

      {/* Voice AI tab */}
      {tab === 'voice' && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4 max-w-2xl">
          <h2 className="font-semibold text-gray-900">Voice AI Configuration</h2>
          <p className="text-xs text-gray-500">
            Saved to your business profile. The live assistant still builds its prompt from the
            business, hours, and services above — these fields are stored but not yet applied to
            in-flight calls.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">AI Name</label>
              <input
                type="text"
                value={voice.ai_name}
                onChange={(e) => setVoice({ ...voice, ai_name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">AI Voice</label>
              <select
                value={voice.voice}
                onChange={(e) => setVoice({ ...voice, voice: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-400"
              >
                {voices.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">AI Model</label>
              <select
                value={voice.model}
                onChange={(e) => setVoice({ ...voice, model: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-400"
              >
                {models.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Greeting (English)</label>
              <textarea
                value={voice.greeting_en}
                onChange={(e) => setVoice({ ...voice, greeting_en: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Greeting (Vietnamese)</label>
              <textarea
                value={voice.greeting_vi}
                onChange={(e) => setVoice({ ...voice, greeting_vi: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Manager Transfer Number</label>
              <input
                type="text"
                value={voice.manager_phone}
                onChange={(e) => setVoice({ ...voice, manager_phone: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-400"
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-900">After-hours mode</p>
                <p className="text-xs text-gray-500">AI answers 24/7 even when closed</p>
              </div>
              <Toggle on={voice.after_hours} onClick={() => setVoice({ ...voice, after_hours: !voice.after_hours })} />
            </div>
          </div>
          <SaveButton tabKey="voice" label="Save Configuration" onClick={() => run('voice', () => saveVoiceSettings(voice))} />
        </div>
      )}

      {/* Notifications tab */}
      {tab === 'notifications' && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4 max-w-2xl">
          <h2 className="font-semibold text-gray-900">Notifications</h2>
          <p className="text-xs text-gray-500">
            Preferences are saved to your business profile. Outbound alerts are not wired to these
            switches yet.
          </p>
          <div className="space-y-3">
            {notificationFields.map((field) => (
              <div key={field.key} className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-900">{field.label}</p>
                  <p className="text-xs text-gray-500">{field.desc}</p>
                </div>
                <Toggle
                  on={notifications[field.key]}
                  onClick={() => setNotifications({ ...notifications, [field.key]: !notifications[field.key] })}
                />
              </div>
            ))}
          </div>
          <SaveButton
            tabKey="notifications"
            label="Save Preferences"
            onClick={() => run('notifications', () => saveNotificationSettings(notifications))}
          />
        </div>
      )}
    </div>
  );
}
