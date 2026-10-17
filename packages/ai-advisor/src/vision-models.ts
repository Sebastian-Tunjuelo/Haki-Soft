/**
 * Modelos Groq con entrada de imagen (Vision docs / AI SDK).
 * Texto-only conocidos: `llama-3.3-70b-versatile`, `openai/gpt-oss-*` — NO admiten visión.
 *
 * Nota de cuenta: no todos los proyectos Groq exponen Llama 4 Scout/Maverick.
 * `qwen/qwen3.8-27b` es multimodal y está disponible en el catálogo actual del proyecto.
 */
const GROQ_VISION_MODEL_IDS = new Set([
  'qwen/qwen3.8-27b',
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'meta-llama/llama-4-maverick-17b-128e-instruct',
]);

/** Default vision cuando se configura `AI_ADVISOR_VISION_MODEL_ID` en plantillas. */
export const DEFAULT_GROQ_VISION_MODEL_ID = 'qwen/qwen3.8-27b';

export function isGroqVisionModel(modelId: string): boolean {
  return GROQ_VISION_MODEL_IDS.has(modelId.trim());
}

/**
 * Resuelve el model id para una petición del consejero.
 * - TEXT: `AI_ADVISOR_MODEL_ID` o default texto.
 * - IMAGE con payload: `AI_ADVISOR_VISION_MODEL_ID` si existe; si no, el modelo principal
 *   solo si es vision-capable. No se inventa un fallback silencioso.
 */
export function resolveAdvisorModelId(params: {
  needsVision: boolean;
  explicitModelId?: string;
}): { modelId: string; visionRequired: boolean; visionCapable: boolean } {
  const textDefault = 'llama-3.3-70b-versatile';
  const primary =
    params.explicitModelId?.trim() ||
    process.env.AI_ADVISOR_MODEL_ID?.trim() ||
    textDefault;

  if (!params.needsVision) {
    return { modelId: primary, visionRequired: false, visionCapable: isGroqVisionModel(primary) };
  }

  const visionEnv = process.env.AI_ADVISOR_VISION_MODEL_ID?.trim();
  const modelId = visionEnv || primary;
  return {
    modelId,
    visionRequired: true,
    visionCapable: isGroqVisionModel(modelId),
  };
}
