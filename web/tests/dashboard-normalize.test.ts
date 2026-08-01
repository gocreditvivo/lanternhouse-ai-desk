import { describe, expect, it } from 'vitest';
import { embeddedName, normalizeItems, toNumber } from '@/lib/dashboard/normalize';

describe('toNumber', () => {
  it('parses the strings PostgREST returns for numeric columns', () => {
    expect(toNumber('42.50')).toBe(42.5);
  });

  it('returns 0 rather than NaN for null or unparseable input', () => {
    expect(toNumber(null)).toBe(0);
    expect(toNumber(undefined)).toBe(0);
    expect(toNumber('not a number')).toBe(0);
  });
});

describe('normalizeItems', () => {
  it('reads the `quantity` key the voice webhook writes', () => {
    expect(normalizeItems([{ name: 'Pho Tai', quantity: 3 }])).toEqual([
      { name: 'Pho Tai', qty: 3, modifiers: undefined },
    ]);
  });

  it('still reads the legacy `qty` key', () => {
    expect(normalizeItems([{ name: 'Banh Mi', qty: 2 }])).toEqual([
      { name: 'Banh Mi', qty: 2, modifiers: undefined },
    ]);
  });

  it('defaults a missing or invalid quantity to 1', () => {
    expect(normalizeItems([{ name: 'Spring Rolls' }])[0].qty).toBe(1);
    expect(normalizeItems([{ name: 'Spring Rolls', quantity: 'two' }])[0].qty).toBe(1);
  });

  it('returns an empty array when items is not an array', () => {
    expect(normalizeItems(null)).toEqual([]);
    expect(normalizeItems({ name: 'Pho' })).toEqual([]);
  });

  it('keeps modifiers only when they are a string', () => {
    expect(normalizeItems([{ name: 'Pho', qty: 1, modifiers: 'no onion' }])[0].modifiers).toBe('no onion');
    expect(normalizeItems([{ name: 'Pho', qty: 1, modifiers: ['no onion'] }])[0].modifiers).toBeUndefined();
  });
});

describe('embeddedName', () => {
  it('reads a to-one embed returned as an object', () => {
    expect(embeddedName({ name: 'Reston' })).toBe('Reston');
  });

  it('reads a to-one embed returned as a single-element array', () => {
    expect(embeddedName([{ name: 'Falls Church' }])).toBe('Falls Church');
  });

  it('returns null when the relation is absent', () => {
    expect(embeddedName(null)).toBeNull();
    expect(embeddedName([])).toBeNull();
  });
});
