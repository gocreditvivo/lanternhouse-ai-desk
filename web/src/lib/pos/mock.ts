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
    name: 'Pho Tai',
    nameVi: 'Phở Tái',
    category: 'Pho',
    priceCents: 0,
    available: true,
    description: 'Synthetic pilot item. Price intentionally unset until owner verification.',
    modifiers: [
      {
        id: 'mock-pho-size',
        name: 'Size',
        required: true,
        minSelections: 1,
        maxSelections: 1,
        options: [
          { id: 'mock-size-regular', name: 'Regular', priceDeltaCents: 0, available: true },
          { id: 'mock-size-large', name: 'Large', priceDeltaCents: 0, available: true },
        ],
      },
      {
        id: 'mock-pho-notes',
        name: 'Common requests',
        required: false,
        maxSelections: 2,
        options: [
          { id: 'mock-no-onion', name: 'No onion', priceDeltaCents: 0, available: true },
          { id: 'mock-extra-herbs', name: 'Extra herbs', priceDeltaCents: 0, available: true },
        ],
      },
    ],
  },
  {
    id: 'mock-spring-rolls',
    name: 'Spring Rolls',
    nameVi: 'Gỏi Cuốn',
    category: 'Appetizers',
    priceCents: 0,
    available: true,
    description: 'Synthetic pilot item. Price intentionally unset until owner verification.',
  },
];

function calculateTotal(order: PosOrderDraft): number {
  return order.lines.reduce((total, line) => {
    const item = menu.find((entry) => entry.id === line.menuItemId);
    if (!item) throw new Error(`Unknown mock menu item: ${line.menuItemId}`);
    if (!item.available) throw new Error(`Unavailable mock menu item: ${line.menuItemId}`);

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
    return [{ id: 'lantern-house-falls-church', name: 'Lantern House Falls Church' }];
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
    if (locationId !== 'lantern-house-falls-church') {
      throw new Error('Unknown mock location');
    }
    if (order.lines.length === 0) throw new Error('Order must contain at least one item');

    const totalCents = calculateTotal(order);
    return {
      externalOrderId: `mock-${Date.now()}`,
      status: 'received',
      totalCents,
      currency: 'USD',
    };
  },
};
