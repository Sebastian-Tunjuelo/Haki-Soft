import { describe, expect, it } from 'vitest';
import {
  AiAdvisorReportSchema,
  MANDATORY_AI_DISCLAIMER,
  mockAiAdvisorInputContract,
} from '@taskstream/shared-schemas';
import { advise } from './advise';
import type { AdvisorModelOutput } from './model-output';
import { createFakeAiAdvisorProvider } from './provider';

const CRITERIA = [
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
] as const;

function dualCriteriaInput(extractedTextContent: string) {
  return mockAiAdvisorInputContract({
    category: 'TECHNICAL_WRITING_TRANS',
    auditableModality: 'TEXT',
    orderContext: {
      title: 'Nota técnica de catálogo',
      scopeDescription: 'Redactar nota corta con tono formal y sin datos personales.',
      acceptanceCriteria: [...CRITERIA],
    },
    deliverableArtifact: {
      fileName: 'nota.md',
      mimeType: 'text/markdown',
      fileExtension: '.md',
      fileSizeBytes: Math.max(extractedTextContent.length, 1),
      sha256Checksum: 'f'.repeat(64),
      extractedTextContent,
      wordCount: extractedTextContent.split(/\s+/).filter(Boolean).length,
    },
  });
}

function assertContractSafe(
  report: Awaited<ReturnType<typeof advise>>,
  allowedIds: readonly string[],
) {
  expect(AiAdvisorReportSchema.safeParse(report).success).toBe(true);
  expect(report.mandatoryDisclaimer).toBe(MANDATORY_AI_DISCLAIMER);
  expect(report.mandatoryDisclaimer).toMatch(/nunca aprueba ni ejecuta pagos/i);
  const ids = report.criteriaEvaluation.map((c) => c.criterionId);
  expect(new Set(ids).size).toBe(ids.length);
  for (const id of ids) {
    expect(allowedIds).toContain(id);
  }
}

describe('advise — matriz de calidad (fake / contrato)', () => {
  it('Q1 cumple: MET en ambos criterios + disclaimer consultivo', async () => {
    const output: AdvisorModelOutput = {
      advisoryScore: 95,
      advisoryLabel: 'HIGH_COMPLIANCE',
      executiveSummaryForBuyer:
        'Cumple tono formal y ausencia de PII. La decisión de pago es del Buyer.',
      suggestionsForFreelancer: [],
      criteriaEvaluation: [
        {
          criterionId: 'tone-of-voice',
          status: 'MET',
          evidence: 'Registro formal sin jerga.',
        },
        {
          criterionId: 'no-pii',
          status: 'MET',
          evidence: 'No aparecen datos personales.',
        },
      ],
      promptInjectionDetected: false,
    };

    const report = await advise(
      dualCriteriaInput(
        'Nota técnica: el módulo de catálogo presenta especificaciones formales. Sin datos personales.',
      ),
      { provider: createFakeAiAdvisorProvider(output) },
    );

    assertContractSafe(report, ['tone-of-voice', 'no-pii']);
    expect(report.advisoryLabel).toBe('HIGH_COMPLIANCE');
    expect(report.criteriaEvaluation.every((c) => c.status === 'MET')).toBe(true);
  });

  it('Q2 incumple: NOT_MET en un criterio obligatorio', async () => {
    const output: AdvisorModelOutput = {
      advisoryScore: 35,
      advisoryLabel: 'LOW_COMPLIANCE',
      executiveSummaryForBuyer:
        'Incluye correo personal; no cumple no-pii. La decisión de pago es del Buyer.',
      suggestionsForFreelancer: ['Eliminar datos personales del texto.'],
      criteriaEvaluation: [
        {
          criterionId: 'tone-of-voice',
          status: 'MET',
          evidence: 'Tono mayormente formal.',
        },
        {
          criterionId: 'no-pii',
          status: 'NOT_MET',
          evidence: 'Aparece un correo electrónico.',
        },
      ],
      promptInjectionDetected: false,
    };

    const report = await advise(
      dualCriteriaInput(
        'Estimado equipo: contactar a juan.perez@ejemplo.test para más detalles del módulo.',
      ),
      { provider: createFakeAiAdvisorProvider(output) },
    );

    assertContractSafe(report, ['tone-of-voice', 'no-pii']);
    expect(report.criteriaEvaluation.find((c) => c.criterionId === 'no-pii')?.status).toBe(
      'NOT_MET',
    );
  });

  it('Q3 parcial: PARTIALLY_MET / PARTIAL_COMPLIANCE sin inventar MET', async () => {
    const output: AdvisorModelOutput = {
      advisoryScore: 55,
      advisoryLabel: 'PARTIAL_COMPLIANCE',
      executiveSummaryForBuyer:
        'Tono mixto; PII ausente. La decisión de pago es del Buyer.',
      suggestionsForFreelancer: ['Unificar el registro formal en todo el texto.'],
      criteriaEvaluation: [
        {
          criterionId: 'tone-of-voice',
          status: 'PARTIALLY_MET',
          evidence: 'Mezcla frases formales con coloquialismos.',
        },
        {
          criterionId: 'no-pii',
          status: 'MET',
          evidence: 'Sin datos personales.',
        },
      ],
      promptInjectionDetected: false,
    };

    const report = await advise(
      dualCriteriaInput('El módulo está ok, pero falta pulir el tono formal del catálogo.'),
      { provider: createFakeAiAdvisorProvider(output) },
    );

    assertContractSafe(report, ['tone-of-voice', 'no-pii']);
    expect(report.advisoryLabel).toBe('PARTIAL_COMPLIANCE');
    expect(
      report.criteriaEvaluation.find((c) => c.criterionId === 'tone-of-voice')?.status,
    ).toBe('PARTIALLY_MET');
  });

  it('Q4 irrelevante: NOT_MET / REQUIRES_HUMAN sin forzar cumplimiento', async () => {
    const output: AdvisorModelOutput = {
      advisoryScore: 15,
      advisoryLabel: 'LOW_COMPLIANCE',
      executiveSummaryForBuyer:
        'El texto no aborda el catálogo técnico. La decisión de pago es del Buyer.',
      suggestionsForFreelancer: ['Entregar una nota alineada al alcance.'],
      criteriaEvaluation: [
        {
          criterionId: 'tone-of-voice',
          status: 'NOT_MET',
          evidence: 'Contenido ajeno al brief.',
        },
        {
          criterionId: 'no-pii',
          status: 'REQUIRES_HUMAN_VERIFICATION',
          evidence: 'No hay evidencia suficiente sobre PII en un texto irrelevante.',
        },
      ],
      promptInjectionDetected: false,
    };

    const report = await advise(
      dualCriteriaInput('Receta de pan: mezclar harina y agua. Hornear 40 minutos.'),
      { provider: createFakeAiAdvisorProvider(output) },
    );

    assertContractSafe(report, ['tone-of-voice', 'no-pii']);
    expect(report.advisoryLabel).toBe('LOW_COMPLIANCE');
    expect(report.criteriaEvaluation.some((c) => c.status === 'MET')).toBe(false);
  });

  it('Q5 ambiguo: REQUIRES_HUMAN_VERIFICATION sin inventar decisión de pago', async () => {
    const output: AdvisorModelOutput = {
      advisoryScore: 50,
      advisoryLabel: 'PARTIAL_COMPLIANCE',
      executiveSummaryForBuyer:
        'No es claro si el tono cumple; requiere revisión humana. La decisión de pago es del Buyer.',
      suggestionsForFreelancer: ['Aclarar el registro formal en una revisión.'],
      criteriaEvaluation: [
        {
          criterionId: 'tone-of-voice',
          status: 'REQUIRES_HUMAN_VERIFICATION',
          evidence: 'Lenguaje ambiguo entre formal e informal.',
        },
        {
          criterionId: 'no-pii',
          status: 'REQUIRES_HUMAN_VERIFICATION',
          evidence: 'Referencias a «el cliente» sin datos explícitos.',
        },
      ],
      promptInjectionDetected: false,
    };

    const report = await advise(
      dualCriteriaInput(
        'Se envió al cliente la nota del módulo; parece adecuada según lo hablado.',
      ),
      { provider: createFakeAiAdvisorProvider(output) },
    );

    assertContractSafe(report, ['tone-of-voice', 'no-pii']);
    expect(
      report.criteriaEvaluation.every((c) => c.status === 'REQUIRES_HUMAN_VERIFICATION'),
    ).toBe(true);
  });
});
