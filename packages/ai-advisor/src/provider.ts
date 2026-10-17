import { AiAdvisorError } from './errors';
import { AdvisorModelOutputSchema, type AdvisorModelOutput } from './model-output';

export type AdvisorProviderRequest = {
  system: string;
  prompt: string;
  schema: typeof AdvisorModelOutputSchema;
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
 * Se carga en diferido para que los tests con fake no arrastren peer deps de `ai`.
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
      const model = createGroq({
        apiKey: process.env.GROQ_API_KEY ?? process.env.AI_GATEWAY_API_KEY,
      })(options.modelId ?? process.env.AI_ADVISOR_MODEL_ID ?? 'llama-3.3-70b-versatile');

      try {
        const { object } = await generateObject({
          model,
          schema: request.schema,
          system: request.system,
          prompt: request.prompt,
        });
        return AdvisorModelOutputSchema.parse(object);
      } catch (error) {
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
