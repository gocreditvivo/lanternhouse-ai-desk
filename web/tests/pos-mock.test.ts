import { describe, expect, it } from 'vitest';
import { mockPosAdapter } from '../src/lib/pos/mock';

describe('mockPosAdapter', () => {
  it('exposes a safe provider-neutral capability contract', () => {
    expect(mockPosAdapter.provider).toBe('mock');
    expect(mockPosAdapter.capabilities.menuRead).toBe(true);
    expect(mockPosAdapter.capabilities.createOrder).toBe(true);
    expect(mockPosAdapter.capabilities.reservations).toBe(false);
  });

  it('returns the Falls Church pilot location and bilingual synthetic menu', async () => {
    const locations = await mockPosAdapter.getLocations();
    expect(locations).toEqual([{ id: 'lantern-house-falls-church', name: 'Lantern House Falls Church' }]);

    const menu = await mockPosAdapter.getMenu('lantern-house-falls-church');
    expect(menu.length).toBeGreaterThan(0);
    expect(menu.some((item) => item.nameVi?.includes('Phở'))).toBe(true);
    expect(menu.some((item) => item.priceCents > 0)).toBe(true);
    expect(menu.some((item) => item.priceCents === 0)).toBe(true);
  });

  it('fails closed for unknown locations and empty orders', async () => {
    expect(await mockPosAdapter.getMenu('unknown')).toEqual([]);
    await expect(mockPosAdapter.createOrder('lantern-house-falls-church', { fulfillment: 'pickup', lines: [] }))
      .rejects.toThrow('Order must contain at least one item');
  });

  it('accepts a verified-price synthetic order with a deterministic total', async () => {
    const result = await mockPosAdapter.createOrder('lantern-house-falls-church', {
      fulfillment: 'pickup',
      customerName: 'Synthetic Customer',
      lines: [{ menuItemId: 'mock-pho-tai', quantity: 2, modifierOptionIds: ['mock-size-regular', 'mock-no-onion'] }],
    });

    expect(result.status).toBe('received');
    expect(result.totalCents).toBe(2400);
    expect(result.externalOrderId).toMatch(/^mock-test-/);
  });
});
