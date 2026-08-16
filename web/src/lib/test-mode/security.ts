import { createHash, randomUUID } from 'crypto';
import type { PilotActionPayload, PilotConfirmation, PilotDeploymentConfig } from './types';

const confirmations = new Map<string, PilotConfirmation>();
const idempotencyKeys = new Set<string>();

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, stable(item)]),
    );
  }
  return value;
}

export function hashPilotPayload(payload: PilotActionPayload): string {
  return createHash('sha256').update(JSON.stringify(stable(payload))).digest('hex');
}

export function issuePilotConfirmation(
  payload: PilotActionPayload,
  config: PilotDeploymentConfig,
  ttlMs = 5 * 60_000,
  now = new Date(),
): PilotConfirmation {
  const confirmation: PilotConfirmation = {
    id: randomUUID(),
    actionType: payload.type,
    businessId: config.businessId,
    locationId: config.locationId,
    payloadHash: hashPilotPayload(payload),
    expiresAt: new Date(now.getTime() + ttlMs).toISOString(),
  };
  confirmations.set(confirmation.id, confirmation);
  return confirmation;
}

export function consumePilotConfirmation(
  confirmationId: string,
  payload: PilotActionPayload,
  config: PilotDeploymentConfig,
  now = new Date(),
): { ok: true } | { ok: false; code: 'missing_confirmation' | 'confirmation_expired' | 'confirmation_mismatch' | 'confirmation_replayed' } {
  const confirmation = confirmations.get(confirmationId);
  if (!confirmation) return { ok: false, code: 'missing_confirmation' };
  if (confirmation.usedAt) return { ok: false, code: 'confirmation_replayed' };
  if (new Date(confirmation.expiresAt).getTime() <= now.getTime()) return { ok: false, code: 'confirmation_expired' };
  if (
    confirmation.actionType !== payload.type ||
    confirmation.businessId !== config.businessId ||
    confirmation.locationId !== config.locationId ||
    confirmation.payloadHash !== hashPilotPayload(payload)
  ) {
    return { ok: false, code: 'confirmation_mismatch' };
  }
  confirmation.usedAt = now.toISOString();
  return { ok: true };
}

export function claimIdempotencyKey(key: string): boolean {
  const normalized = key.trim();
  if (!normalized || idempotencyKeys.has(normalized)) return false;
  idempotencyKeys.add(normalized);
  return true;
}

export function resetPilotSecurityStateForTests(): void {
  confirmations.clear();
  idempotencyKeys.clear();
}

export function normalizeUsPhone(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return null;
}
