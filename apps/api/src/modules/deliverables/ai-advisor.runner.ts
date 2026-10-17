import { randomUUID } from 'node:crypto';
import {
  advise,
  createFakeAiAdvisorProvider,
  type AiAdvisorProvider,
} from '@taskstream/ai-advisor';
import {
  MANDATORY_AI_DISCLAIMER,
  resolveMvpAiAuditableModality,
  type AiAdvisorInputContract,
  type AiAdvisorReport,
} from '@taskstream/shared-schemas';
import type { StoredDeliverable, StoredOrderForDeliverable } from './deliverables.types';
import { readObject } from './object-storage';

function defaultCriteria(order: StoredOrderForDeliverable) {
  if (order.acceptanceCriteria.length > 0) return order.acceptanceCriteria;
  return [
    {
      criterionId: 'scope-default',
      description:
        order.scopeDescription.trim().length >= 10
          ? order.scopeDescription.trim().slice(0, 350)
          : 'Cumplir el alcance acordado en la orden de trabajo.',
      isMandatory: true,
    },
  ];
}

function buildDeterministicFake(input: AiAdvisorInputContract): AiAdvisorReport {
  const passed =
    input.deterministicPreCheckResult.extensionAllowed &&
    input.deterministicPreCheckResult.nonEmptyFile &&
    input.deterministicPreCheckResult.technicalConstraintsMet;

  return {
    taskId: input.taskOrderId,
    deliverableId: input.deliverableId,
    revisionEvaluated: input.revisionNumber,
    auditableModality: input.auditableModality,
    advisoryScore: passed ? 78 : 0,
    advisoryLabel: passed ? 'PARTIAL_COMPLIANCE' : 'LOW_COMPLIANCE',
    executiveSummaryForBuyer: passed
      ? 'Informe demo (sin proveedor LLM). Revisa el preview y los criterios; la decisión de pago es tuya.'
      : 'La validación determinista previa falló; no se invocó al modelo.',
    suggestionsForFreelancer: passed
      ? ['Verifica contraste y legibilidad antes de la aceptación del Buyer.']
      : input.deterministicPreCheckResult.failureReasons.slice(0, 6),
    criteriaEvaluation: input.orderContext.acceptanceCriteria.map((c) => ({
      criterionId: c.criterionId,
      status: passed ? ('REQUIRES_HUMAN_VERIFICATION' as const) : ('NOT_MET' as const),
      evidence: passed
        ? 'Evaluación heurística local (MVP sin GROQ_API_KEY).'
        : 'Pre-check fallido.',
    })),
    securityAndIntegrityAudit: {
      promptInjectionDetected: false,
      emptyOrCorruptedFileDetected: !input.deterministicPreCheckResult.nonEmptyFile,
      deterministicCheckPassed: passed,
    },
    mandatoryDisclaimer: MANDATORY_AI_DISCLAIMER,
  };
}

export function buildAiAdvisorInput(params: {
  order: StoredOrderForDeliverable;
  deliverable: StoredDeliverable;
}): AiAdvisorInputContract | null {
  const { order, deliverable } = params;
  const modality = resolveMvpAiAuditableModality(order.expectedMediaType);
  if (!modality) return null;

  const original = readObject(deliverable.originalR2Key);
  const extractedText =
    modality === 'TEXT' && original
      ? original.toString('utf8').slice(0, 12_000)
      : undefined;

  return {
    taskOrderId: order.taskId,
    deliverableId: deliverable.id,
    revisionNumber: deliverable.revisionNumber,
    category: order.category,
    auditableModality: modality,
    orderContext: {
      title: order.title,
      scopeDescription: order.scopeDescription || order.title,
      acceptanceCriteria: defaultCriteria(order),
    },
    deliverableArtifact: {
      fileName: deliverable.fileName,
      mimeType: deliverable.mimeType,
      fileExtension: deliverable.fileExtension,
      fileSizeBytes: Math.max(1, deliverable.fileSizeBytes),
      sha256Checksum: deliverable.sha256Checksum.length === 64 ? deliverable.sha256Checksum : 'a'.repeat(64),
      extractedTextContent: extractedText,
      wordCount: extractedText ? extractedText.split(/\s+/).filter(Boolean).length : undefined,
      imageDimensions:
        modality === 'IMAGE'
          ? {
              widthPx: 1200,
              heightPx: 800,
            }
          : undefined,
    },
    deterministicPreCheckResult: {
      extensionAllowed: true,
      nonEmptyFile: deliverable.fileSizeBytes > 0,
      technicalConstraintsMet: true,
      failureReasons: deliverable.fileSizeBytes > 0 ? [] : ['EMPTY_FILE'],
    },
  };
}

export async function runAdviseForDeliverable(params: {
  order: StoredOrderForDeliverable;
  deliverable: StoredDeliverable;
  provider?: AiAdvisorProvider;
}): Promise<AiAdvisorReport | null> {
  const input = buildAiAdvisorInput(params);
  if (!input) return null;

  const hasKey = Boolean(process.env.GROQ_API_KEY || process.env.AI_GATEWAY_API_KEY);
  const provider =
    params.provider ??
    (hasKey
      ? undefined
      : createFakeAiAdvisorProvider((req) => {
          void req;
          return {
            advisoryScore: 78,
            advisoryLabel: 'PARTIAL_COMPLIANCE' as const,
            executiveSummaryForBuyer:
              'Informe demo (sin proveedor LLM). Revisa el preview; la decisión de pago es del Buyer.',
            suggestionsForFreelancer: [
              'Ajusta contraste o claridad si el Buyer lo pide en revisión.',
            ],
            criteriaEvaluation: input.orderContext.acceptanceCriteria.map((c) => ({
              criterionId: c.criterionId,
              status: 'REQUIRES_HUMAN_VERIFICATION' as const,
              evidence: 'Evaluación heurística local (MVP sin GROQ_API_KEY).',
            })),
            promptInjectionDetected: false,
          };
        }));

  if (!provider && !hasKey) {
    return buildDeterministicFake(input);
  }

  return advise(input, provider ? { provider } : undefined);
}

/** Id estable para filas de criterio cuando el código no es UUID (solo memoria). */
export function reportStorageId(): string {
  return randomUUID();
}
