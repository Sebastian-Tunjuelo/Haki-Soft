import {
  AiAdvisorInputContractSchema,
  AiAdvisorReportSchema,
  CATEGORY_MEDIA_CONSTRAINTS_MAP,
  MANDATORY_AI_DISCLAIMER,
  resolveMvpAiAuditableModality,
  type AiAdvisorInputContract,
  type AiAdvisorReport,
} from '@taskstream/shared-schemas';
import { AiAdvisorError } from './errors';
import { AdvisorModelOutputSchema } from './model-output';
import { detectPromptInjectionSignals } from './prompt-injection';
import {
  SYSTEM_PROMPT,
  buildArtifactBody,
  buildUserPrompt,
  wrapUntrustedArtifact,
} from './prompt';
import { type AiAdvisorProvider } from './provider';

export type AdviseOptions = {
  provider?: AiAdvisorProvider;
};

function assertModalityAllowed(input: AiAdvisorInputContract): void {
  const canonical = CATEGORY_MEDIA_CONSTRAINTS_MAP[input.category];
  const fromCategory = canonical.aiAuditableModality;
  const fromMedia = resolveMvpAiAuditableModality(canonical.expectedMediaType);

  if (fromCategory === null || fromMedia === null) {
    throw new AiAdvisorError(
      'AI_MODALITY_MISMATCH',
      `La categoría ${input.category} no es auditable por IA en el MVP.`,
    );
  }

  if (fromCategory !== input.auditableModality || fromMedia !== input.auditableModality) {
    throw new AiAdvisorError(
      'AI_MODALITY_MISMATCH',
      `auditableModality=${input.auditableModality} no coincide con la categoría ${input.category} (esperado ${fromCategory}).`,
    );
  }
}

function precheckPassed(input: AiAdvisorInputContract): boolean {
  const pre = input.deterministicPreCheckResult;
  return pre.extensionAllowed && pre.nonEmptyFile && pre.technicalConstraintsMet;
}

function buildFailedPrecheckReport(input: AiAdvisorInputContract): AiAdvisorReport {
  return AiAdvisorReportSchema.parse({
    taskId: input.taskOrderId,
    deliverableId: input.deliverableId,
    revisionEvaluated: input.revisionNumber,
    auditableModality: input.auditableModality,
    advisoryScore: 0,
    advisoryLabel: 'LOW_COMPLIANCE',
    executiveSummaryForBuyer:
      'La validación determinista previa falló; no se invocó al modelo. La decisión de pago sigue siendo del Buyer.',
    suggestionsForFreelancer: input.deterministicPreCheckResult.failureReasons.slice(0, 6),
    criteriaEvaluation: input.orderContext.acceptanceCriteria.map((criterion) => ({
      criterionId: criterion.criterionId,
      status: 'REQUIRES_HUMAN_VERIFICATION' as const,
      evidence: 'Pre-check fallido; sin evaluación del modelo.',
    })),
    securityAndIntegrityAudit: {
      promptInjectionDetected: false,
      emptyOrCorruptedFileDetected: !input.deterministicPreCheckResult.nonEmptyFile,
      deterministicCheckPassed: false,
    },
    mandatoryDisclaimer: MANDATORY_AI_DISCLAIMER,
  });
}

/**
 * Genera el informe consultivo de IA para imagen/texto (SPEC-08).
 * No persiste, no mueve dinero y no cambia el lifecycle de la orden.
 */
export async function advise(
  rawInput: unknown,
  options: AdviseOptions = {},
): Promise<AiAdvisorReport> {
  const parsed = AiAdvisorInputContractSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new AiAdvisorError(
      'AI_ADVISOR_INVALID_INPUT',
      parsed.error.issues.map((i) => i.message).join('; ') || 'Input inválido.',
    );
  }

  const input = parsed.data;
  assertModalityAllowed(input);

  if (!precheckPassed(input)) {
    return buildFailedPrecheckReport(input);
  }

  const artifactBody = buildArtifactBody(input);
  const localInjection = detectPromptInjectionSignals(artifactBody);
  const wrapped = wrapUntrustedArtifact(artifactBody);
  const userPrompt = buildUserPrompt(input, wrapped);

  let provider = options.provider;
  if (!provider) {
    const { createDefaultAiAdvisorProvider } = await import('./provider');
    provider = await createDefaultAiAdvisorProvider();
  }

  let modelOutput;
  try {
    modelOutput = await provider.generateAdvisory({
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
      schema: AdvisorModelOutputSchema,
    });
  } catch (error) {
    if (error instanceof AiAdvisorError) throw error;
    throw new AiAdvisorError(
      'AI_ADVISOR_PROVIDER_UNAVAILABLE',
      error instanceof Error ? error.message : 'Proveedor de IA no disponible.',
    );
  }

  const reportCandidate = {
    taskId: input.taskOrderId,
    deliverableId: input.deliverableId,
    revisionEvaluated: input.revisionNumber,
    auditableModality: input.auditableModality,
    advisoryScore: modelOutput.advisoryScore,
    advisoryLabel: modelOutput.advisoryLabel,
    executiveSummaryForBuyer: modelOutput.executiveSummaryForBuyer,
    suggestionsForFreelancer: modelOutput.suggestionsForFreelancer,
    criteriaEvaluation: modelOutput.criteriaEvaluation,
    securityAndIntegrityAudit: {
      promptInjectionDetected: localInjection || modelOutput.promptInjectionDetected,
      emptyOrCorruptedFileDetected: false,
      deterministicCheckPassed: true,
    },
    mandatoryDisclaimer: MANDATORY_AI_DISCLAIMER,
  };

  const report = AiAdvisorReportSchema.safeParse(reportCandidate);
  if (!report.success) {
    throw new AiAdvisorError(
      'AI_ADVISOR_SCHEMA_MISMATCH',
      'El informe ensamblado no cumple AiAdvisorReportSchema.',
    );
  }

  return report.data;
}
