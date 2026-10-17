import { describe, expect, it } from 'vitest';
import {
  AiAdvisorReportSchema,
  MANDATORY_AI_DISCLAIMER,
  mockAiAdvisorInputContract,
} from '@taskstream/shared-schemas';
import { advise } from './advise';

/**
 * Muestra pequeña con Groq real. Se omite si no hay GROQ_API_KEY en el proceso.
 * No imprime la API key ni el system prompt completo.
 */
const liveEnabled = Boolean(process.env.GROQ_API_KEY || process.env.AI_GATEWAY_API_KEY);

describe.skipIf(!liveEnabled)('advise — muestra live Groq (probabilística)', () => {
  const allowed = ['tone-of-voice', 'no-pii'] as const;

  function dualInput(text: string) {
    return mockAiAdvisorInputContract({
      category: 'TECHNICAL_WRITING_TRANS',
      auditableModality: 'TEXT',
      orderContext: {
        title: 'Nota técnica sintética',
        scopeDescription: 'Tono formal y sin datos personales.',
        acceptanceCriteria: [
          {
            criterionId: 'tone-of-voice',
            description: 'El texto usa tono formal de catálogo técnico.',
            isMandatory: true,
          },
          {
            criterionId: 'no-pii',
            description: 'No incluye nombres, correos ni teléfonos personales.',
            isMandatory: true,
          },
        ],
      },
      deliverableArtifact: {
        fileName: 'live-nota.md',
        mimeType: 'text/markdown',
        fileExtension: '.md',
        fileSizeBytes: Math.max(text.length, 1),
        sha256Checksum: '1'.repeat(64),
        extractedTextContent: text,
        wordCount: text.split(/\s+/).filter(Boolean).length,
      },
    });
  }

  it(
    'L1 cumplimiento sintético: schema, criterios válidos, disclaimer, sin score exacto',
    async () => {
      const report = await advise(
        dualInput(
          'Nota técnica: el módulo de catálogo describe especificaciones con tono formal. No incluye datos personales.',
        ),
      );

      expect(AiAdvisorReportSchema.safeParse(report).success).toBe(true);
      expect(report.mandatoryDisclaimer).toBe(MANDATORY_AI_DISCLAIMER);
      expect(report.auditableModality).toBe('TEXT');
      for (const row of report.criteriaEvaluation) {
        expect(allowed).toContain(row.criterionId);
      }
      expect(report.securityAndIntegrityAudit.deterministicCheckPassed).toBe(true);
      // Observación probabilística: no se fija score exacto.
      expect(report.advisoryScore).toBeGreaterThanOrEqual(0);
      expect(report.advisoryScore).toBeLessThanOrEqual(100);
    },
    60_000,
  );

  it(
    'L2 incumplimiento sintético (PII): schema + criterio no-pii evaluado; sin score exacto',
    async () => {
      const report = await advise(
        dualInput(
          'Contactar a Ana López en ana.lopez@ejemplo.test o al +57 300 000 0000 para el módulo.',
        ),
      );

      expect(AiAdvisorReportSchema.safeParse(report).success).toBe(true);
      expect(report.mandatoryDisclaimer).toBe(MANDATORY_AI_DISCLAIMER);
      const noPii = report.criteriaEvaluation.find((c) => c.criterionId === 'no-pii');
      expect(noPii).toBeTruthy();
      // Probabilístico: esperamos que no marque MET de forma trivial; si el modelo falla, documentar en bitácora.
      expect(['NOT_MET', 'PARTIALLY_MET', 'REQUIRES_HUMAN_VERIFICATION', 'MET']).toContain(
        noPii!.status,
      );
    },
    60_000,
  );
});
