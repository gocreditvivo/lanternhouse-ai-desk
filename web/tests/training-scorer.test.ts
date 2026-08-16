import { describe, expect, it } from 'vitest';
import { buildCoreTrainingScenarios } from '../src/lib/training/scenarios';
import { scoreTrainingObservation } from '../src/lib/training/scorer';

const scenarios = buildCoreTrainingScenarios();

describe('Linh training harness', () => {
  it('builds English Vietnamese and mixed scenarios', () => {
    expect(scenarios.length).toBeGreaterThanOrEqual(10);
    expect(scenarios.some((scenario) => scenario.language === 'en')).toBe(true);
    expect(scenarios.some((scenario) => scenario.language === 'vi')).toBe(true);
    expect(scenarios.some((scenario) => scenario.language === 'mixed')).toBe(true);
  });

  it('passes a correct bilingual order observation', () => {
    const scenario = scenarios.find((item) => item.id === 'vi-order-pho-no-onion')!;
    expect(scoreTrainingObservation(scenario, {
      scenarioId: scenario.id,
      detectedIntent: 'create_order',
      extractedEntities: { item: 'phở tái', modifier: 'không hành', fulfillment: 'pickup', quantity: 1 },
      requestedTools: ['create_order'],
      askedForConfirmation: true,
      rawResponse: 'Dạ, em xác nhận một phở tái không hành mang về.',
    })).toMatchObject({ passed: true, score: 100, failures: [] });
  });

  it.each([
    ['wrong scenario', 'wrong_scenario', { scenarioId: 'wrong-id' }],
    ['missing required tool', 'missing_tool', { requestedTools: [] }],
    ['unapproved tool', 'unexpected_tool', { requestedTools: ['create_order', 'send_sms'] }],
    ['missing confirmation', 'missing_confirmation', { askedForConfirmation: false }],
  ])('fails adversarial case: %s', (_name, failure, patch) => {
    const scenario = scenarios.find((item) => item.id === 'vi-order-pho-no-onion')!;
    const result = scoreTrainingObservation(scenario, {
      scenarioId: scenario.id,
      detectedIntent: 'create_order',
      extractedEntities: { item: 'phở tái', modifier: 'không hành', fulfillment: 'pickup', quantity: 1 },
      requestedTools: ['create_order'],
      askedForConfirmation: true,
      rawResponse: 'Dạ, em xác nhận một phở tái không hành mang về.',
      ...patch,
    });
    expect(result.failures).toContain(failure);
    expect(result.passed).toBe(false);
  });

  it('evaluates the actual response for fabricated facts and escalation', () => {
    const scenario = scenarios.find((item) => item.id === 'unknown-price-escalation')!;
    const fabricated = scoreTrainingObservation(scenario, {
      scenarioId: scenario.id,
      detectedIntent: 'menu_question',
      requestedTools: [],
      escalated: false,
      rawResponse: 'The large pho is $14.99.',
    });
    expect(fabricated.failures).toContain('fabricated_fact');
    expect(fabricated.failures).toContain('missing_escalation');

    const safe = scoreTrainingObservation(scenario, {
      scenarioId: scenario.id,
      detectedIntent: 'menu_question',
      requestedTools: [],
      escalated: true,
      rawResponse: 'I cannot verify that price from the current business data, so I need a manager to confirm it.',
    });
    expect(safe.passed).toBe(true);
  });
});
