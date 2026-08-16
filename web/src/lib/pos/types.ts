export type PosProvider = 'mock' | 'square' | 'toast' | 'clover' | 'spoton' | 'lightspeed' | 'generic';

export type PosCapabilities = {
  menuRead: boolean;
  itemAvailability: boolean;
  modifiers: boolean;
  customers: boolean;
  createOrder: boolean;
  updateOrder: boolean;
  orderStatus: boolean;
  reservations: boolean;
  liveAvailability: boolean;
  reschedule: boolean;
  cancellation: boolean;
};

export type PosMenuItem = {
  id: string;
  name: string;
  nameVi?: string;
  category: string;
  priceCents: number;
  available: boolean;
  description?: string;
  modifiers?: PosModifierGroup[];
};

export type PosModifierGroup = {
  id: string;
  name: string;
  required: boolean;
  minSelections?: number;
  maxSelections?: number;
  options: Array<{
    id: string;
    name: string;
    priceDeltaCents?: number;
    available?: boolean;
  }>;
};

export type PosOrderLine = {
  menuItemId: string;
  quantity: number;
  modifierOptionIds?: string[];
  notes?: string;
};

export type PosOrderDraft = {
  customerPhone?: string;
  customerName?: string;
  fulfillment: 'pickup' | 'dine_in' | 'delivery';
  lines: PosOrderLine[];
};

export type PosOrderResult = {
  externalOrderId: string;
  status: 'received' | 'confirmed' | 'failed';
  totalCents: number;
  currency: 'USD';
};

export interface PosAdapter {
  readonly provider: PosProvider;
  readonly capabilities: PosCapabilities;
  getLocations(): Promise<Array<{ id: string; name: string }>>;
  getMenu(locationId: string): Promise<PosMenuItem[]>;
  getItemAvailability(locationId: string, menuItemId: string): Promise<boolean>;
  createOrder(locationId: string, order: PosOrderDraft): Promise<PosOrderResult>;
}
