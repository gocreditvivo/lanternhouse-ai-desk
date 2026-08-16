'use server';

import type { PilotActionPayload } from '@/lib/test-mode/types';
import { confirmSyntheticScenario, prepareSyntheticScenario } from '@/lib/test-mode/runner';

export async function runTestModeScenarioAction(scenarioId: string) {
  return prepareSyntheticScenario(scenarioId);
}

export async function confirmTestModeScenarioAction(
  scenarioId: string,
  confirmationId: string,
  exactDisplayedAction: PilotActionPayload,
) {
  return confirmSyntheticScenario(scenarioId, confirmationId, exactDisplayedAction);
}
