import { randomUUID } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { createFakeAiAdvisorProvider } from '@taskstream/ai-advisor';
import { buildAiAdvisorInput, runAdviseForDeliverable } from './ai-advisor.runner';
import type { StoredDeliverable, StoredOrderForDeliverable } from './deliverables.types';

/**
 * Prompt #078: fail-closed sin criterios persistibles (no inventar `scope-default`).
 */
describe('buildAiAdvisorInput / runAdvise — sin criterios', () => {
  const deliverable = (taskId: string, id: string): StoredDeliverable => ({
    id,
    taskOrderId: taskId,
    revisionNumber: 0,
    originalR2Key: `orig/${id}`,
    previewR2Key: `prev/${id}`,
    fileName: 'nota.md',
    mimeType: 'text/markdown',
    fileExtension: '.md',
    fileSizeBytes: 64,
    sha256Checksum: 'b'.repeat(64),
    previewStatus: 'READY',
    mediaType: 'DOCUMENT_TEXT',
    contentUploaded: true,
    submittedAt: new Date(),
    reviewDecision: 'PENDING_REVIEW',
    reviewDecidedAt: null,
    buyerRevisionNotes: null,
  });

  function orderWithoutCriteria(taskId: string): StoredOrderForDeliverable {
    return {
      taskId,
      buyerId: randomUUID(),
      sellerId: randomUUID(),
      lifecycleStatus: 'IN_REVIEW',
      expectedMediaType: 'DOCUMENT_TEXT',
      category: 'TECHNICAL_WRITING_TRANS',
      scopeDescription: 'Alcance mínimo de la orden de trabajo.',
      acceptanceCriteria: [],
      allowedExtensions: ['.md'],
      title: 'Orden sin criterios',
      buyerDisplayName: 'Buyer',
      sellerDisplayName: 'Seller',
      totalAmountUSDInCents: 1000,
      fundsLockedAt: new Date(),
      initialDeliveryDays: 7,
    };
  }

  it('sin criterios: buildAiAdvisorInput → null (no scope-default)', () => {
    const taskId = randomUUID();
    const deliverableId = randomUUID();
    const input = buildAiAdvisorInput({
      order: orderWithoutCriteria(taskId),
      deliverable: deliverable(taskId, deliverableId),
    });
    expect(input).toBeNull();
  });

  it('sin criterios: runAdvise no llama al proveedor y no produce informe', async () => {
    const taskId = randomUUID();
    const deliverableId = randomUUID();
    const spy = vi.fn();
    const provider = createFakeAiAdvisorProvider(() => {
      spy();
      return {
        advisoryScore: 70,
        advisoryLabel: 'PARTIAL_COMPLIANCE',
        executiveSummaryForBuyer: 'No debería generarse. La decisión de pago es del Buyer.',
        suggestionsForFreelancer: [],
        criteriaEvaluation: [
          {
            criterionId: 'scope-default',
            status: 'REQUIRES_HUMAN_VERIFICATION',
            evidence: 'No debe llegar aquí.',
          },
        ],
        promptInjectionDetected: false,
      };
    });

    const report = await runAdviseForDeliverable({
      order: orderWithoutCriteria(taskId),
      deliverable: deliverable(taskId, deliverableId),
      provider,
    });

    expect(report).toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });

  it('con criterios válidos: flujo normal y provider invocado', async () => {
    const taskId = randomUUID();
    const deliverableId = randomUUID();
    const order: StoredOrderForDeliverable = {
      ...orderWithoutCriteria(taskId),
      title: 'Orden con criterios',
      scopeDescription: 'Alcance con criterios explícitos.',
      acceptanceCriteria: [
        {
          criterionId: 'tone-of-voice',
          description: 'El texto respeta el tono acordado.',
          isMandatory: true,
        },
      ],
    };

    const spy = vi.fn();
    const provider = createFakeAiAdvisorProvider(() => {
      spy();
      return {
        advisoryScore: 88,
        advisoryLabel: 'HIGH_COMPLIANCE',
        executiveSummaryForBuyer: 'Cumple tono. La decisión de pago es del Buyer.',
        suggestionsForFreelancer: [],
        criteriaEvaluation: [
          {
            criterionId: 'tone-of-voice',
            status: 'MET',
            evidence: 'Tono formal presente.',
          },
        ],
        promptInjectionDetected: false,
      };
    });

    const input = buildAiAdvisorInput({ order, deliverable: deliverable(taskId, deliverableId) });
    expect(input).not.toBeNull();
    expect(input!.orderContext.acceptanceCriteria.map((c) => c.criterionId)).toEqual([
      'tone-of-voice',
    ]);

    const report = await runAdviseForDeliverable({
      order,
      deliverable: deliverable(taskId, deliverableId),
      provider,
    });

    expect(spy).toHaveBeenCalledOnce();
    expect(report).not.toBeNull();
    expect(report!.advisoryLabel).toBe('HIGH_COMPLIANCE');
    expect(report!.criteriaEvaluation).toHaveLength(1);
    expect(report!.criteriaEvaluation[0]?.criterionId).toBe('tone-of-voice');
  });

  it('ausencia de criterios no se presenta como informe exitoso con evaluaciones vacías', async () => {
    const taskId = randomUUID();
    const deliverableId = randomUUID();
    const report = await runAdviseForDeliverable({
      order: orderWithoutCriteria(taskId),
      deliverable: deliverable(taskId, deliverableId),
      provider: createFakeAiAdvisorProvider({
        advisoryScore: 100,
        advisoryLabel: 'HIGH_COMPLIANCE',
        executiveSummaryForBuyer: 'No debe emitirse.',
        suggestionsForFreelancer: [],
        criteriaEvaluation: [],
        promptInjectionDetected: false,
      }),
    });

    // maybeGenerateAiReport no persiste si report === null → GET ai-report sigue en null (HTTP 200).
    expect(report).toBeNull();
  });
});
