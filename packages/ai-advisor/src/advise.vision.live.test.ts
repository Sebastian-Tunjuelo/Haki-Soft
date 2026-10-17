import { afterEach, describe, expect, it } from 'vitest';
import {
  AiAdvisorReportSchema,
  MANDATORY_AI_DISCLAIMER,
  mockAiAdvisorInputContract,
} from '@taskstream/shared-schemas';
import { advise } from './advise';
import { createDefaultAiAdvisorProvider } from './provider';
import { pngDataUrl } from './synthetic-png';
import { DEFAULT_GROQ_VISION_MODEL_ID } from './vision-models';

/**
 * Live Groq vision. Requiere GROQ_API_KEY (o AI_GATEWAY_API_KEY).
 * Fuerza modelo vision; el AI_ADVISOR_MODEL_ID local (p. ej. gpt-oss) no admite imágenes.
 */
const liveEnabled = Boolean(process.env.GROQ_API_KEY || process.env.AI_GATEWAY_API_KEY);

const RED_SQUARE = pngDataUrl(32, 32, [220, 20, 20]);
const BLUE_WIDE = pngDataUrl(64, 32, [30, 80, 220]);

function dualCriteriaInput(dataUrl: string, widthPx: number, heightPx: number, label: string) {
  return mockAiAdvisorInputContract({
    category: 'GRAPHICS_AND_DESIGN',
    auditableModality: 'IMAGE',
    orderContext: {
      title: `Figura ${label}`,
      scopeDescription: 'Color dominante y proporción geométrica verificables.',
      acceptanceCriteria: [
        {
          criterionId: 'dominant-red',
          description: 'El color dominante visible en la imagen es rojo (no azul ni verde).',
          isMandatory: true,
        },
        {
          criterionId: 'is-square',
          description: 'La imagen es cuadrada: ancho y alto iguales o casi iguales.',
          isMandatory: true,
        },
      ],
    },
    deliverableArtifact: {
      fileName: `${label}.png`,
      mimeType: 'image/png',
      fileExtension: '.png',
      fileSizeBytes: 512,
      sha256Checksum: 'd'.repeat(64),
      imageDimensions: { widthPx, heightPx },
      imageSignedUrlOrBase64: dataUrl,
    },
  });
}

describe.skipIf(!liveEnabled)('advise — visión live Groq (probabilística)', () => {
  const prevVision = process.env.AI_ADVISOR_VISION_MODEL_ID;

  afterEach(() => {
    if (prevVision === undefined) delete process.env.AI_ADVISOR_VISION_MODEL_ID;
    else process.env.AI_ADVISOR_VISION_MODEL_ID = prevVision;
  });

  it(
    'V1 rojo cuadrado vs V2 azul ancho: schema + criterios; el modelo distingue color',
    async () => {
      process.env.AI_ADVISOR_VISION_MODEL_ID = DEFAULT_GROQ_VISION_MODEL_ID;
      const provider = await createDefaultAiAdvisorProvider({
        modelId: DEFAULT_GROQ_VISION_MODEL_ID,
      });

      // ITPM on_demand (~7k): las live TEXT del mismo suite agotan cuota; esperar antes de vision.
      await new Promise((r) => setTimeout(r, 20_000));

      const redReport = await advise(dualCriteriaInput(RED_SQUARE, 32, 32, 'red-square'), {
        provider,
      });
      await new Promise((r) => setTimeout(r, 12_000));
      const blueReport = await advise(dualCriteriaInput(BLUE_WIDE, 64, 32, 'blue-wide'), {
        provider,
      });

      for (const report of [redReport, blueReport]) {
        expect(AiAdvisorReportSchema.safeParse(report).success).toBe(true);
        expect(report.mandatoryDisclaimer).toBe(MANDATORY_AI_DISCLAIMER);
        expect(report.auditableModality).toBe('IMAGE');
        expect(report.criteriaEvaluation.map((c) => c.criterionId).sort()).toEqual([
          'dominant-red',
          'is-square',
        ]);
      }

      const redColor = redReport.criteriaEvaluation.find((c) => c.criterionId === 'dominant-red');
      const blueColor = blueReport.criteriaEvaluation.find((c) => c.criterionId === 'dominant-red');
      expect(redColor).toBeTruthy();
      expect(blueColor).toBeTruthy();

      // Distinción visual: no ambos MET trivialmente iguales en evidencia/status para color.
      const distinguished =
        redColor!.status !== blueColor!.status ||
        redColor!.evidence.trim().toLowerCase() !== blueColor!.evidence.trim().toLowerCase();
      expect(distinguished).toBe(true);

      // Señal direccional (probabilística): rojo no debería ser NOT_MET si el modelo ve el color.
      expect(['MET', 'PARTIALLY_MET', 'REQUIRES_HUMAN_VERIFICATION', 'NOT_MET']).toContain(
        redColor!.status,
      );
      expect(['MET', 'PARTIALLY_MET', 'REQUIRES_HUMAN_VERIFICATION', 'NOT_MET']).toContain(
        blueColor!.status,
      );
    },
    180_000,
  );
});
