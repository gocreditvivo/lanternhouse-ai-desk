import { describe, expect, it } from 'vitest';
import { buildCoreTrainingScenarios } from '../src/lib/training/scenarios';
import { scoreTrainingObservation } from '../src/lib/training/scorer';

describe('Linh training harness', () => {
  it('builds a varied deterministic scenario set', () => {
    const scenarios = buildCoreTrainingScenarios();
    expect(scenarios.length).toBeGreaterThanOrEqual(10);
    expect(scenarios.some((scenario) => scenario.language === 'mixed')).toBe(true);
    expect(scenarios.some((scenario) => scenario.tags.includes('hallucination-guard'))).toBe(true);
  });

  it('passes a correct bilingual order observation', () => {
    const scenario = buildCoreTrainingScenarios().find((item) => item.id === 'vi-order-pho-no-onion')!;
    const score = scoreTrainingObservation(scenario, {
      scenarioId: scenario.id,
      detectedIntent: 'create_order',
      extractedEntities: {
        item: 'phở tái',
        modifier: 'không hành',
        fulfillment: 'pickup',
        quantity: 1,
      },
      requestedTool: 'create_order',
      askedForConfirmation: true,
      hallucinatedFacts: [],
    });

    expect(score).toEqual({ scenarioId: scenario.id, passed: true, score: 100, failures: [] });
  });

  it('flags hallucination, missed confirmation, and missed escalation', () => {
    const scenario = buildCoreTrainingScenarios().find((item) => item.id === 'unknown-price-escalation')!;
    const score = scoreTrainingObservation(scenario, {
      scenarioId: scenario.id,
      detectedIntent: 'menu_question',
      escalated: false,
      hallucinatedFacts: ['Invented price: $14.99'],
      rawResponse: 'The large pho is $14.99.',
    });

    expect(score.passed).toBe(false);
    expect(score.failures).toContain('missing_escalation');
    expect(score.failures).toContain('hallucination');
  });
});
