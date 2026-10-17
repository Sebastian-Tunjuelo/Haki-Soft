export { advise, type AdviseOptions } from './advise';
export { AiAdvisorError, type AiAdvisorErrorCode } from './errors';
export { AdvisorModelOutputSchema, type AdvisorModelOutput } from './model-output';
export {
  createDefaultAiAdvisorProvider,
  createFakeAiAdvisorProvider,
  type AiAdvisorProvider,
  type AdvisorProviderRequest,
  type CreateDefaultProviderOptions,
} from './provider';

export {
  SYSTEM_PROMPT,
  wrapUntrustedArtifact,
  buildArtifactBody,
  buildUserPrompt,
} from './prompt';
export { detectPromptInjectionSignals } from './prompt-injection';
export {
  extractAdvisorImagePayload,
  MAX_ADVISOR_IMAGE_BYTES,
  type AdvisorImagePayload,
} from './image-payload';
export {
  DEFAULT_GROQ_VISION_MODEL_ID,
  isGroqVisionModel,
  resolveAdvisorModelId,
} from './vision-models';
export { pngDataUrl, solidRgbPng } from './synthetic-png';
