export type AiAdvisorErrorCode =
  | 'AI_MODALITY_MISMATCH'
  | 'AI_ADVISOR_PROVIDER_UNAVAILABLE'
  | 'AI_ADVISOR_SCHEMA_MISMATCH'
  | 'AI_ADVISOR_INVALID_INPUT';

export class AiAdvisorError extends Error {
  readonly code: AiAdvisorErrorCode;

  constructor(code: AiAdvisorErrorCode, message: string) {
    super(message);
    this.name = 'AiAdvisorError';
    this.code = code;
  }
}
