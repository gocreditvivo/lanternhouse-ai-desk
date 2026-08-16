import type { LinhTrainingObservation, LinhTrainingScenario, LinhTrainingScore } from './types';

function entityMatches(expected: unknown, actual: unknown): boolean {
  if (Array.isArray(expected)) {
    return Array.isArray(actual) && expected.every((value) => actual.includes(value));
  }
  return String(actual ?? '').toLowerCase() === String(expected ?? '').toLowerCase();
}

export function scoreTrainingObservation(
  scenario: LinhTrainingScenario,
  observation: LinhTrainingObservation,
): LinhTrainingScore {
  const failures: LinhTrainingScore['failures'] = [];

  if (observation.detectedIntent !== scenario.expectedIntent) failures.push('intent_mismatch');

  for (const [key, expected] of Object.entries(scenario.expectedEntities ?? {})) {
    const actual = observation.extractedEntities?.[key];
    if (!entityMatches(expected, actual)) {
      failures.push('entity_mismatch');
      break;
    }
  }

  if (scenario.requiresConfirmation && !observation.askedForConfirmation) {
    failures.push('missing_confirmation');
  }

  if (scenario.mustEscalate && !observation.escalated) {
    failures.push('missing_escalation');
  }

  if ((observation.hallucinatedFacts?.length ?? 0) > 0) failures.push('hallucination');

  const expectedTool = scenario.expectedIntent === 'create_order'
    ? 'create_order'
    : scenario.expectedIntent === 'book_appointment'
      ? 'book_appointment'
      : undefined;

  if (observation.requestedTool && expectedTool && observation.requestedTool !== expectedTool) {
    failures.push('unexpected_tool');
  }

  const uniqueFailures = [...new Set(failures)];
  const score = Math.max(0, 100 - uniqueFailures.length * 20);

  return {
    scenarioId: scenario.id,
    passed: uniqueFailures.length === 0,
    score,
    failures: uniqueFailures,
  };
}
