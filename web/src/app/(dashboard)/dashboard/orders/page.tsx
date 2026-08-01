'use client';

import { useState } from 'react';
import {
  Search, Clock, Phone, User, MoreVertical,
  UtensilsCrossed, Check, X, ChefHat, Package
} from 'lucide-react';

const orders = [
  {
    id: 1, name: 'Kevin Tran', phone: '+1 703-555-0198',
    type: 'pickup', status: 'preparing', time: '12:30 PM', ready: '12:45 PM',
    items: [
      { name: 'Pho Tai', qty: 2, modifiers: 'Extra rare beef' },
      { name: 'Bun Thit Nuong', qty: 1, modifiers: 'No peanuts' },
      { name: 'Goi Cuon (2 pcs)', qty: 1, modifiers: '' },
    ],
    total: 47.50, special: 'Extra nuoc cham please',
  },
  {
    id: 2, name: 'Quang Nguyen', phone: '+1 571-555-0178',
    type: 'pickup', status: 'confirmed', time: '1:00 PM', ready: '1:20 PM',
    items: [
      { name: 'Com Tam Suon', qty: 2, modifiers: '' },
      { name: 'Tra Da', qty: 3, modifiers: '' },
    ],
    total: 32.00, special: '',
  },
  {
    id: 3, name: 'Lisa Wang', phone: '+1 703-555-0145',
    type: 'delivery', status: 'ready', time: '11:45 AM', ready: 'Ready now',
    items: [
      { name: 'Pho Ga', qty: 1, modifiers: 'Extra onions' },
      { name: 'Cha Gio (2 pcs)', qty: 2, modifiers: '' },
    ],
    total: 28.50, special: 'Leave at front door',
  },
  {
    id: 4, name: 'Tom Nguyen', phone: '+1 703-555-0156',
    type: 'pickup', status: 'completed', time: '11:00 AM', ready: 'Picked up',
    items: [
      { name: 'Bun Bo Hue', qty: 1, modifiers: 'Spicy' },
      { name: 'Banh Mi', qty: 2, modifiers: 'No cilantro' },
    ],
    total: 24.00, special: '',
  },
  {
    id: 5, name: 'Sarah Johnson', phone: '+1 571-555-0192',
    type: 'pickup', status: 'pending', time: '1:30 PM', ready: 'TBD',
    items: [
      { name: 'Pho Tai Chin', qty: 1, modifiers: 'Well done beef' },
      { name: 'Spring Rolls (4 pcs)', qty: 1, modifiers: '' },
      { name: 'Vietnamese Iced Coffee', qty: 2, modifiers: '' },
    ],
    total: 31.50, special: 'Allergy: shellfish',
  },
];

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-brand-100 text-brand-700',
  preparing: 'bg-orange-100 text-orange-700',
  ready: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-600',
  canceled: 'bg-red-100 text-red-700',
};

const statusFlow = ['pending', 'confirmed', 'preparing', 'ready', 'completed'];

export default function OrdersPage() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = orders.filter((o) => {
    if (filter !== 'all' && o.status !== filter) return false;
    if (search && !o.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Status pipeline cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {statusFlow.map((status) => {
          const count = orders.filter((o) => o.status === status).length;
          return (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`p-4 rounded-xl border text-left transition ${
                filter === status ? 'border-brand-400 bg-brand-50' : 'border-gray-100 bg-white hover:border-gray-200'
              }`}
            >
              <div className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[status]} mb-2`}>
                {status}
              </div>
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <p className="text-xs text-gray-500">orders</p>
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
          />
        </div>
        {filter !== 'all' && (
          <button
            onClick={() => setFilter('all')}
            className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:border-gray-300"
          >
            Clear filter
          </button>
        )}
      </div>

      {/* Orders list */}
      <div className="grid gap-3">
        {filtered.map((order) => (
          <div key={order.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="p-4">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                    <UtensilsCrossed className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-900 text-sm">{order.name}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                        {order.status}
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 capitalize">
                        {order.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {order.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Ordered {order.time}
                      </span>
                      <span className="font-medium text-brand-600">{order.ready}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-gray-900">${order.total.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">{order.items.reduce((s, i) => s + i.qty, 0)} items</p>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-1.5 pl-13">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="font-mono text-xs text-gray-400 w-6">{item.qty}x</span>
                    <div className="flex-1">
                      <span className="text-gray-700">{item.name}</span>
                      {item.modifiers && <span className="text-gray-400 ml-2 text-xs">— {item.modifiers}</span>}
                    </div>
                  </div>
                ))}
              </div>

              {order.special && (
                <div className="mt-3 pl-13">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-50 text-yellow-800 text-xs">
                    <span className="font-medium">Note:</span> {order.special}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-2 mt-4 pl-13">
                {order.status === 'pending' && (
                  <button className="px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-medium hover:bg-brand-700 transition">
                    Confirm Order
                  </button>
                )}
                {order.status === 'confirmed' && (
                  <button className="px-3 py-1.5 rounded-lg bg-orange-600 text-white text-xs font-medium hover:bg-orange-700 transition">
                    <ChefHat className="w-3 h-3 inline mr-1" />
                    Start Preparing
                  </button>
                )}
                {order.status === 'preparing' && (
                  <button className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition">
                    <Package className="w-3 h-3 inline mr-1" />
                    Mark Ready
                  </button>
                )}
                {order.status === 'ready' && (
                  <button className="px-3 py-1.5 rounded-lg bg-gray-600 text-white text-xs font-medium hover:bg-gray-700 transition">
                    <Check className="w-3 h-3 inline mr-1" />
                    Mark Picked Up
                  </button>
                )}
                {(order.status === 'pending' || order.status === 'confirmed') && (
                  <button className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 transition">
                    <X className="w-3 h-3 inline mr-1" />
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <UtensilsCrossed className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No orders found</p>
        </div>
      )}
    </div>
  );
}
