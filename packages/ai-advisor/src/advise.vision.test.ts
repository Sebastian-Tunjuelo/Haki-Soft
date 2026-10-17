import { afterEach, describe, expect, it } from 'vitest';
import {
  AiAdvisorReportSchema,
  MANDATORY_AI_DISCLAIMER,
  mockAiAdvisorInputContract,
} from '@taskstream/shared-schemas';
import { advise } from './advise';
import { AiAdvisorError } from './errors';
import { createDefaultAiAdvisorProvider, createFakeAiAdvisorProvider } from './provider';
import { buildArtifactBody } from './prompt';
import { pngDataUrl } from './synthetic-png';
import { isGroqVisionModel, resolveAdvisorModelId } from './vision-models';

/** Groq vision exige ≥32px por lado; azul ancho = 64×32 (no cuadrado). */
const RED_SQUARE = pngDataUrl(32, 32, [220, 20, 20]);
const BLUE_WIDE = pngDataUrl(64, 32, [30, 80, 220]);

function imageInput(dataUrl: string, widthPx: number, heightPx: number) {
  return mockAiAdvisorInputContract({
    category: 'GRAPHICS_AND_DESIGN',
    auditableModality: 'IMAGE',
    orderContext: {
      title: 'Figura sintética',
      scopeDescription: 'Evaluar color dominante y proporción.',
      acceptanceCriteria: [
        {
          criterionId: 'dominant-red',
          description: 'El color dominante de la imagen es rojo.',
          isMandatory: true,
        },
        {
          criterionId: 'is-square',
          description: 'La imagen es cuadrada (ancho ≈ alto).',
          isMandatory: true,
        },
      ],
    },
    deliverableArtifact: {
      fileName: 'synthetic.png',
      mimeType: 'image/png',
      fileExtension: '.png',
      fileSizeBytes: 256,
      sha256Checksum: 'c'.repeat(64),
      imageDimensions: { widthPx, heightPx },
      imageSignedUrlOrBase64: dataUrl,
    },
  });
}

describe('análisis visual IMAGE (unitario)', () => {
  const prevModel = process.env.AI_ADVISOR_MODEL_ID;
  const prevVision = process.env.AI_ADVISOR_VISION_MODEL_ID;

  afterEach(() => {
    if (prevModel === undefined) delete process.env.AI_ADVISOR_MODEL_ID;
    else process.env.AI_ADVISOR_MODEL_ID = prevModel;
    if (prevVision === undefined) delete process.env.AI_ADVISOR_VISION_MODEL_ID;
    else process.env.AI_ADVISOR_VISION_MODEL_ID = prevVision;
  });

  it('envía bytes al proveedor y no incrusta el data URL en el texto del artefacto', async () => {
    const input = imageInput(RED_SQUARE, 32, 32);
    const artifact = buildArtifactBody(input);
    expect(artifact.includes(RED_SQUARE)).toBe(false);
    expect(artifact).toContain('[image attached as multimodal part');

    let sawImage = false;
    let promptHadDataUrl = false;
    const provider = createFakeAiAdvisorProvider((req) => {
      sawImage = Boolean(req.image?.base64 && req.image.base64.length > 20);
      promptHadDataUrl = req.prompt.includes('data:image/png;base64,');
      return {
        advisoryScore: 70,
        advisoryLabel: 'PARTIAL_COMPLIANCE',
        executiveSummaryForBuyer:
          'Probe: imagen recibida. La decisión de pago sigue siendo del Buyer.',
        suggestionsForFreelancer: ['N/A'],
        criteriaEvaluation: [
          { criterionId: 'dominant-red', status: 'MET', evidence: 'Rojo en adjunto.' },
          { criterionId: 'is-square', status: 'MET', evidence: '32x32.' },
        ],
        promptInjectionDetected: false,
      };
    });

    const report = await advise(input, { provider });
    expect(sawImage).toBe(true);
    expect(promptHadDataUrl).toBe(false);
    expect(AiAdvisorReportSchema.safeParse(report).success).toBe(true);
    expect(report.mandatoryDisclaimer).toBe(MANDATORY_AI_DISCLAIMER);
  });

  it('rechaza IMAGE sin payload visual', async () => {
    const base = mockAiAdvisorInputContract();
    await expect(
      advise(
        {
          ...base,
          deliverableArtifact: {
            ...base.deliverableArtifact,
            imageSignedUrlOrBase64: undefined,
          },
        },
        { provider: createFakeAiAdvisorProvider(() => {
          throw new Error('no debe llamarse');
        }) },
      ),
    ).rejects.toMatchObject({ code: 'AI_ADVISOR_INVALID_INPUT' } satisfies Partial<AiAdvisorError>);
  });

  it('rechaza URLs http(s) (no reenvío de enlaces privados)', async () => {
    await expect(
      advise(imageInput('https://example.invalid/private.png?sig=secret', 32, 32), {
        provider: createFakeAiAdvisorProvider(() => {
          throw new Error('no debe llamarse');
        }),
      }),
    ).rejects.toMatchObject({ code: 'AI_ADVISOR_INVALID_INPUT' } satisfies Partial<AiAdvisorError>);
  });

  it('resolveAdvisorModelId: gpt-oss / llama-3.3 no son vision; scout sí', () => {
    expect(isGroqVisionModel('openai/gpt-oss-20b')).toBe(false);
    expect(isGroqVisionModel('llama-3.3-70b-versatile')).toBe(false);
    expect(isGroqVisionModel('meta-llama/llama-4-scout-17b-16e-instruct')).toBe(true);

    process.env.AI_ADVISOR_MODEL_ID = 'openai/gpt-oss-20b';
    delete process.env.AI_ADVISOR_VISION_MODEL_ID;
    const blocked = resolveAdvisorModelId({ needsVision: true });
    expect(blocked.visionCapable).toBe(false);

    process.env.AI_ADVISOR_VISION_MODEL_ID = 'qwen/qwen3.8-27b';
    const ok = resolveAdvisorModelId({ needsVision: true });
    expect(ok.visionCapable).toBe(true);
    expect(ok.modelId).toBe('qwen/qwen3.8-27b');
  });

  it('createDefaultAiAdvisorProvider falla cerrado si IMAGE y modelo sin visión', async () => {
    process.env.AI_ADVISOR_MODEL_ID = 'openai/gpt-oss-20b';
    delete process.env.AI_ADVISOR_VISION_MODEL_ID;
    const provider = await createDefaultAiAdvisorProvider();
    const redB64 = RED_SQUARE.replace(/^data:image\/png;base64,/i, '');

    await expect(
      provider.generateAdvisory({
        system: 'test',
        prompt: 'describe',
        schema: (
          await import('./model-output')
        ).AdvisorModelOutputSchema,
        image: { mimeType: 'image/png', base64: redB64 },
      }),
    ).rejects.toMatchObject({
      code: 'AI_ADVISOR_PROVIDER_UNAVAILABLE',
    } satisfies Partial<AiAdvisorError>);
  });

  it('payloads sintéticos rojo cuadrado vs azul ancho son distintos', () => {
    expect(RED_SQUARE).not.toBe(BLUE_WIDE);
    const redInput = imageInput(RED_SQUARE, 32, 32);
    const blueInput = imageInput(BLUE_WIDE, 64, 32);
    expect(redInput.deliverableArtifact.imageSignedUrlOrBase64).not.toBe(
      blueInput.deliverableArtifact.imageSignedUrlOrBase64,
    );
  });
});
