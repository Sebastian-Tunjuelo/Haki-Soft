import { AiAdvisorError } from './errors';
import type { AdvisorImagePayload } from './image-payload';
import { AdvisorModelOutputSchema, type AdvisorModelOutput } from './model-output';
import { resolveAdvisorModelId } from './vision-models';

export type AdvisorProviderRequest = {
  system: string;
  prompt: string;
  schema: typeof AdvisorModelOutputSchema;
  /** Payload visual opcional (solo IMAGE). No debe loguearse. */
  image?: AdvisorImagePayload | null;
};

export interface AiAdvisorProvider {
  generateAdvisory(request: AdvisorProviderRequest): Promise<AdvisorModelOutput>;
}

/** Proveedor determinista para tests / demos sin red. */
export function createFakeAiAdvisorProvider(
  output: AdvisorModelOutput | ((request: AdvisorProviderRequest) => AdvisorModelOutput),
): AiAdvisorProvider {
  return {
    async generateAdvisory(request) {
      const value = typeof output === 'function' ? output(request) : output;
      return AdvisorModelOutputSchema.parse(value);
    },
  };
}

export type CreateDefaultProviderOptions = {
  modelId?: string;
};

/**
 * Proveedor por defecto (Groq + generateObject).
 * IMAGE con payload → mensajes multimodales; exige modelo vision-capable.
 */
export async function createDefaultAiAdvisorProvider(
  options: CreateDefaultProviderOptions = {},
): Promise<AiAdvisorProvider> {
  const [{ generateObject }, { createGroq }, { z }] = await Promise.all([
    import('ai'),
    import('@ai-sdk/groq'),
    import('zod'),
  ]);

  return {
    async generateAdvisory(request) {
      const needsVision = Boolean(request.image);
      const resolved = resolveAdvisorModelId({
        needsVision,
        explicitModelId: options.modelId,
      });

      if (needsVision && !resolved.visionCapable) {
        throw new AiAdvisorError(
          'AI_ADVISOR_PROVIDER_UNAVAILABLE',
          `El modelo configurado "${resolved.modelId}" no admite entrada de imágenes. ` +
            'Defina AI_ADVISOR_VISION_MODEL_ID (p. ej. qwen/qwen3.8-27b o meta-llama/llama-4-scout-17b-16e-instruct). ' +
            'No se simula análisis visual.',
        );
      }

      const model = createGroq({
        apiKey: process.env.GROQ_API_KEY ?? process.env.AI_GATEWAY_API_KEY,
      })(resolved.modelId);

      try {
        if (request.image) {
          const bytes = Buffer.from(request.image.base64, 'base64');
          const { object } = await generateObject({
            model,
            schema: request.schema,
            system: request.system,
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: request.prompt },
                  {
                    type: 'image',
                    image: bytes,
                    mimeType: request.image.mimeType,
                  },
                ],
              },
            ],
          });
          return AdvisorModelOutputSchema.parse(object);
        }

        const { object } = await generateObject({
          model,
          schema: request.schema,
          system: request.system,
          prompt: request.prompt,
        });
        return AdvisorModelOutputSchema.parse(object);
      } catch (error) {
        if (error instanceof AiAdvisorError) throw error;
        if (error instanceof z.ZodError) {
          throw new AiAdvisorError(
            'AI_ADVISOR_SCHEMA_MISMATCH',
            'La salida del proveedor no cumple AdvisorModelOutputSchema.',
          );
        }
        throw new AiAdvisorError(
          'AI_ADVISOR_PROVIDER_UNAVAILABLE',
          error instanceof Error ? error.message : 'Proveedor de IA no disponible.',
        );
      }
    },
  };
}
