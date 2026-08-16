import { describe, expect, it } from 'vitest';
import { confirmSyntheticScenario, listTestModeScenarios, prepareSyntheticScenario } from '../src/lib/test-mode/runner';

const scenarios = listTestModeScenarios();

describe('Linh user-visible synthetic Test Mode flow', () => {
  it('offers English Vietnamese and mixed-language scenarios', () => {
    expect(scenarios.some((scenario) => scenario.language === 'en')).toBe(true);
    expect(scenarios.some((scenario) => scenario.language === 'vi')).toBe(true);
    expect(scenarios.some((scenario) => scenario.language === 'mixed')).toBe(true);
  });

  it('walks a Vietnamese order through observation scoring confirmation and simulated execution', async () => {
    const prepared = await prepareSyntheticScenario('vi-order-pho-no-onion');
    expect(prepared.score).toMatchObject({ passed: true, score: 100 });
    expect(prepared.audit).toMatchObject({ source: 'synthetic_test_mode', verificationState: 'blocked_unverified', result: 'blocked' });
    expect(prepared.confirmationRequired).toBe(true);
    expect(prepared.proposedAction?.type).toBe('create_order');
    expect(prepared.confirmationId).toBeTruthy();

    const confirmed = await confirmSyntheticScenario(prepared.scenario.id, prepared.confirmationId!, prepared.proposedAction!);
    expect(confirmed.toolResult).toMatchObject({ ok: true, type: 'create_order', simulated: true });
    expect(confirmed.audit).toMatchObject({ verificationState: 'verified_synthetic', result: 'passed', humanEscalationRequired: false });
  });

  it('walks a mixed-language booking through exact synthetic confirmation', async () => {
    const prepared = await prepareSyntheticScenario('mixed-reservation');
    expect(prepared.scenario.language).toBe('mixed');
    expect(prepared.proposedAction?.type).toBe('book_appointment');
    const confirmed = await confirmSyntheticScenario(prepared.scenario.id, prepared.confirmationId!, prepared.proposedAction!);
    expect(confirmed.toolResult).toMatchObject({ ok: true, type: 'book_appointment', simulated: true });
  });

  it('shows English unknown-price escalation without inventing a tool action', async () => {
    const result = await prepareSyntheticScenario('unknown-price-escalation');
    expect(result.scenario.language).toBe('en');
    expect(result.score.passed).toBe(true);
    expect(result.proposedAction).toBeUndefined();
    expect(result.audit).toMatchObject({ verificationState: 'verified_synthetic', result: 'passed', humanEscalationRequired: true });
    expect(result.observation.rawResponse).toContain('cannot verify');
  });

  it('rejects a changed action sent from the confirmation screen', async () => {
    const prepared = await prepareSyntheticScenario('vi-order-pho-no-onion');
    const original = prepared.proposedAction!;
    if (original.type !== 'create_order') throw new Error('Expected order action');
    const changed = { ...original, order: { ...original.order, lines: [{ ...original.order.lines[0], quantity: 9 }] } };
    const result = await confirmSyntheticScenario(prepared.scenario.id, prepared.confirmationId!, changed);
    expect(result.toolResult).toMatchObject({ ok: false, code: 'confirmation_mismatch' });
    expect(result.audit).toMatchObject({ verificationState: 'failed', result: 'failed' });
  });
});
