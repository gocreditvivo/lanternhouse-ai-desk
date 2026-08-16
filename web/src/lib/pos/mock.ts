import type { PosAdapter, PosCapabilities, PosMenuItem, PosOrderDraft, PosOrderResult } from './types';

const capabilities: PosCapabilities = {
  menuRead: true,
  itemAvailability: true,
  modifiers: true,
  customers: false,
  createOrder: true,
  updateOrder: false,
  orderStatus: true,
  reservations: false,
  liveAvailability: false,
  reschedule: false,
  cancellation: false,
};

const menu: PosMenuItem[] = [
  {
    id: 'mock-pho-tai',
    name: 'Synthetic Pho Tai',
    nameVi: 'Phở Tái Giả Lập',
    category: 'Synthetic Menu',
    priceCents: 1200,
    available: true,
    description: 'Fictional Test Mode item. Price is synthetic and must never be represented as a real business price.',
    modifiers: [
      {
        id: 'mock-pho-size',
        name: 'Synthetic size',
        required: true,
        minSelections: 1,
        maxSelections: 1,
        options: [
          { id: 'mock-size-regular', name: 'Regular', priceDeltaCents: 0, available: true },
          { id: 'mock-size-large', name: 'Large', priceDeltaCents: 200, available: true },
        ],
      },
      {
        id: 'mock-pho-notes',
        name: 'Synthetic requests',
        required: false,
        maxSelections: 2,
        options: [
          { id: 'mock-no-onion', name: 'No onion', priceDeltaCents: 0, available: true },
          { id: 'mock-extra-herbs', name: 'Extra herbs', priceDeltaCents: 50, available: true },
        ],
      },
    ],
  },
  {
    id: 'mock-unverified-special',
    name: 'Synthetic Unverified Special',
    category: 'Synthetic Menu',
    priceCents: 0,
    available: true,
    description: 'Deliberately unverified synthetic price for failure-path testing.',
  },
];

function calculateTotal(order: PosOrderDraft): number {
  return order.lines.reduce((total, line) => {
    const item = menu.find((entry) => entry.id === line.menuItemId);
    if (!item) throw new Error('Unknown synthetic menu item');
    const modifiers = line.modifierOptionIds ?? [];
    const modifierTotal = item.modifiers?.flatMap((group) => group.options)
      .filter((option) => modifiers.includes(option.id))
      .reduce((sum, option) => sum + (option.priceDeltaCents ?? 0), 0) ?? 0;
    return total + (item.priceCents + modifierTotal) * line.quantity;
  }, 0);
}

export const mockPosAdapter: PosAdapter = {
  provider: 'mock',
  capabilities,
  async getLocations() {
    return [{ id: 'lantern-house-falls-church', name: 'Synthetic Falls Church Pilot Location' }];
  },
  async getMenu(locationId) {
    if (locationId !== 'lantern-house-falls-church') return [];
    return menu.map((item) => structuredClone(item));
  },
  async getItemAvailability(locationId, menuItemId) {
    if (locationId !== 'lantern-house-falls-church') return false;
    return menu.find((item) => item.id === menuItemId)?.available ?? false;
  },
  async createOrder(locationId, order): Promise<PosOrderResult> {
    if (locationId !== 'lantern-house-falls-church') throw new Error('Unknown synthetic location');
    return {
      externalOrderId: `test-order-${Date.now()}`,
      status: 'received',
      totalCents: calculateTotal(order),
      currency: 'USD',
    };
  },
};
