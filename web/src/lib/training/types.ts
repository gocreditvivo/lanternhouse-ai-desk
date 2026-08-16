export type TrainingLanguage = 'en' | 'vi' | 'mixed';

export type TrainingDifficulty = 'easy' | 'medium' | 'hard';

export type LinhTrainingScenario = {
  id: string;
  language: TrainingLanguage;
  difficulty: TrainingDifficulty;
  callerText: string;
  expectedIntent: 'menu_question' | 'hours_question' | 'create_order' | 'book_appointment' | 'transfer_call' | 'send_sms' | 'unknown';
  expectedEntities?: Record<string, string | number | boolean | string[]>;
  requiresConfirmation?: boolean;
  mustEscalate?: boolean;
  tags: string[];
};

export type LinhTrainingObservation = {
  scenarioId: string;
  detectedIntent?: string;
  extractedEntities?: Record<string, unknown>;
  requestedTool?: string;
  askedForConfirmation?: boolean;
  escalated?: boolean;
  hallucinatedFacts?: string[];
  rawResponse?: string;
};

export type LinhTrainingScore = {
  scenarioId: string;
  passed: boolean;
  score: number;
  failures: Array<
    | 'intent_mismatch'
    | 'entity_mismatch'
    | 'missing_confirmation'
    | 'missing_escalation'
    | 'hallucination'
    | 'unexpected_tool'
  >;
};
