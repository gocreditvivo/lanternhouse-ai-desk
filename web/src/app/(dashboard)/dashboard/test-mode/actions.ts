'use server';

import { runSyntheticScenario } from '@/lib/test-mode/runner';

export async function runTestModeScenarioAction(scenarioId: string, confirmed: boolean) {
  return runSyntheticScenario(scenarioId, confirmed);
}
