import type { LinhTrainingObservation, LinhTrainingScenario, LinhTrainingScore } from './types';

function entityMatches(expected: unknown, actual: unknown): boolean {
  if (Array.isArray(expected)) return Array.isArray(actual) && expected.every((value) => actual.includes(value));
  return String(actual ?? '').toLowerCase() === String(expected ?? '').toLowerCase();
}

function responseContains(response: string, needle: string): boolean {
  return response.toLocaleLowerCase().includes(needle.toLocaleLowerCase());
}

export function scoreTrainingObservation(
  scenario: LinhTrainingScenario,
  observation: LinhTrainingObservation,
): LinhTrainingScore {
  const failures: LinhTrainingScore['failures'] = [];
  const rawResponse = observation.rawResponse ?? '';
  const requestedTools = observation.requestedTools ?? [];

  if (observation.scenarioId !== scenario.id) failures.push('wrong_scenario');
  if (observation.detectedIntent !== scenario.expectedIntent) failures.push('intent_mismatch');

  for (const [key, expected] of Object.entries(scenario.expectedEntities ?? {})) {
    if (!entityMatches(expected, observation.extractedEntities?.[key])) {
      failures.push('entity_mismatch');
      break;
    }
  }

  if (scenario.requiresConfirmation && !observation.askedForConfirmation) failures.push('missing_confirmation');
  if (scenario.mustEscalate && !observation.escalated) failures.push('missing_escalation');

  const requiredTools = scenario.requiredTools ?? [];
  if (requiredTools.some((tool) => !requestedTools.includes(tool))) failures.push('missing_tool');

  const allowedTools = new Set(scenario.allowedTools ?? requiredTools);
  if (requestedTools.some((tool) => !allowedTools.has(tool))) failures.push('unexpected_tool');

  if ((scenario.requiredResponseIncludes ?? []).some((claim) => !responseContains(rawResponse, claim))) {
    failures.push('fabricated_fact');
  }
  if ((scenario.forbiddenResponseClaims ?? []).some((claim) => responseContains(rawResponse, claim))) {
    failures.push('fabricated_fact');
  }

  const uniqueFailures = [...new Set(failures)];
  return {
    scenarioId: scenario.id,
    passed: uniqueFailures.length === 0,
    score: Math.max(0, 100 - uniqueFailures.length * 20),
    failures: uniqueFailures,
  };
}
