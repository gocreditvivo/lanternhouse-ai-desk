import { mockBookingAdapter } from '@/lib/booking/mock';
import { mockPosAdapter } from '@/lib/pos/mock';
import { buildCoreTrainingScenarios } from '@/lib/training/scenarios';
import { scoreTrainingObservation } from '@/lib/training/scorer';
import type { LinhTrainingObservation, LinhTrainingScenario } from '@/lib/training/types';
import { issuePilotConfirmation } from './security';
import type { PilotActionPayload, PilotAuditRecord, PilotDeploymentConfig } from './types';
import { executeLinhTool } from '@/lib/voice-core/tool-router';

export const pilotConfig: PilotDeploymentConfig = {
  businessId: 'lantern-house-test',
  locationId: 'lantern-house-falls-church',
  timezone: 'America/New_York',
  transferDestinationKeys: ['manager'],
  smsMaxLength: 320,
};

const noOpSideEffects = {
  async transferCall() {},
  async sendSms() {},
};

export type TestModeRun = {
  scenario: LinhTrainingScenario;
  observation: LinhTrainingObservation;
  score: ReturnType<typeof scoreTrainingObservation>;
  confirmationRequired: boolean;
  proposedAction?: PilotActionPayload;
  confirmationId?: string;
  toolResult?: Awaited<ReturnType<typeof executeLinhTool>>;
  audit: PilotAuditRecord;
};

function syntheticObservation(scenario: LinhTrainingScenario): LinhTrainingObservation {
  const base: LinhTrainingObservation = {
    scenarioId: scenario.id,
    detectedIntent: scenario.expectedIntent,
    extractedEntities: scenario.expectedEntities ?? {},
    requestedTools: scenario.requiredTools ?? [],
    askedForConfirmation: Boolean(scenario.requiresConfirmation),
    escalated: Boolean(scenario.mustEscalate),
  };
  if (scenario.id === 'unknown-price-escalation') return { ...base, rawResponse: 'I cannot verify that price from the current business data, so I need a manager to confirm it.' };
  if (scenario.language === 'vi') return { ...base, rawResponse: 'Dạ, em đã hiểu yêu cầu và sẽ xác nhận trước khi thực hiện trong Test Mode.' };
  if (scenario.language === 'mixed') return { ...base, rawResponse: 'Dạ, I got it. Em sẽ confirm the details before any simulated action.' };
  return { ...base, rawResponse: 'I understand the request and will confirm the details before any simulated action.' };
}

function actionForScenario(scenario: LinhTrainingScenario): PilotActionPayload | undefined {
  if (scenario.expectedIntent === 'create_order') {
    const quantity = typeof scenario.expectedEntities?.quantity === 'number' ? scenario.expectedEntities.quantity : 1;
    return {
      type: 'create_order',
      order: {
        fulfillment: 'pickup',
        customerName: 'Synthetic Customer',
        customerPhone: '+17035550198',
        lines: [{ menuItemId: 'mock-pho-tai', quantity, modifierOptionIds: ['mock-size-regular', 'mock-no-onion'] }],
      },
    };
  }
  if (scenario.expectedIntent === 'transfer_call') return { type: 'transfer_call', destinationKey: 'manager' };
  if (scenario.expectedIntent === 'send_sms') return { type: 'send_sms', to: '+17035550198', body: 'Synthetic Test Mode confirmation.', transactional: true, consentRecorded: false };
  return undefined;
}

export function listTestModeScenarios(): LinhTrainingScenario[] {
  return buildCoreTrainingScenarios();
}

export async function runSyntheticScenario(scenarioId: string, confirmed = false): Promise<TestModeRun> {
  const scenario = listTestModeScenarios().find((item) => item.id === scenarioId);
  if (!scenario) throw new Error('Unknown synthetic scenario');
  const observation = syntheticObservation(scenario);
  const score = scoreTrainingObservation(scenario, observation);
  let proposedAction = actionForScenario(scenario);

  if (scenario.expectedIntent === 'book_appointment') {
    const target = new Date(Date.now() + 3 * 24 * 60 * 60_000);
    const slots = await mockBookingAdapter.getAvailability(pilotConfig.locationId, 'mock-table-reservation', target.toISOString());
    if (slots[0]) {
      proposedAction = {
        type: 'book_appointment',
        booking: {
          serviceId: 'mock-table-reservation',
          customerName: 'Synthetic Customer',
          customerPhone: '+17035550198',
          startIso: slots[0].startIso,
          staffId: 'mock-anyone',
        },
      };
    }
  }

  let confirmationId: string | undefined;
  let toolResult: TestModeRun['toolResult'];
  if (proposedAction && confirmed) {
    confirmationId = issuePilotConfirmation(proposedAction, pilotConfig).id;
    toolResult = await executeLinhTool(
      proposedAction,
      {
        businessId: pilotConfig.businessId,
        locationId: pilotConfig.locationId,
        callerPhone: '+17035550199',
        language: scenario.language,
        confirmationId,
        idempotencyKey: `${scenario.id}-${confirmationId}`,
      },
      { pos: mockPosAdapter, booking: mockBookingAdapter, sideEffects: noOpSideEffects, config: pilotConfig },
    );
  }

  const blockedForConfirmation = Boolean(proposedAction && !confirmed);
  const failed = !score.passed || Boolean(toolResult && !toolResult.ok);
  const audit: PilotAuditRecord = {
    id: `${scenario.id}-${Date.now()}`,
    scenarioId: scenario.id,
    source: 'synthetic_test_mode',
    verificationState: failed ? 'failed' : blockedForConfirmation ? 'blocked_unverified' : 'verified_synthetic',
    action: proposedAction?.type,
    result: failed ? 'failed' : blockedForConfirmation ? 'blocked' : 'passed',
    failureReason: !score.passed ? score.failures.join(', ') : toolResult && !toolResult.ok ? toolResult.message : undefined,
    humanEscalationRequired: Boolean(scenario.mustEscalate || (toolResult && !toolResult.ok && toolResult.escalationRequired)),
    timestamp: new Date().toISOString(),
  };

  return { scenario, observation, score, confirmationRequired: blockedForConfirmation, proposedAction, confirmationId, toolResult, audit };
}
