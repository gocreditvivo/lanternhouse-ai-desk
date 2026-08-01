import type { OrderItemRow } from './types';

/**
 * Coercions applied to every row before it reaches a component.
 *
 * Postgres `numeric` columns arrive over PostgREST as strings, so a raw
 * `order.total.toFixed(2)` in the UI would throw.
 */
export function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** The Vapi webhook writes `quantity`; older rows and the UI use `qty`. Accept both. */
export function normalizeItems(raw: unknown): OrderItemRow[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item: any) => ({
    name: typeof item?.name === 'string' ? item.name : 'Item',
    qty: Math.max(1, Math.round(toNumber(item?.qty ?? item?.quantity) || 1)),
    modifiers: typeof item?.modifiers === 'string' ? item.modifiers : undefined,
  }));
}

/** PostgREST embeds a to-one relation as an object, but arrays show up too. */
export function embeddedName(relation: unknown): string | null {
  const row = Array.isArray(relation) ? relation[0] : relation;
  const name = (row as any)?.name;
  return typeof name === 'string' ? name : null;
}
