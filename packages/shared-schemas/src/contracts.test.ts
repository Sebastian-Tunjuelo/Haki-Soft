import { describe, expect, it } from 'vitest';
import {
  AiAdvisorInputContractSchema,
  AiAdvisorReportSchema,
  buyerExtensionDecisionDeadline,
  buyerRefundIdempotencyKey,
  ClientTaskPublicationSchema,
  DeadlineExtensionRequestSchema,
  escrowLockIdempotencyKey,
  FreelancerNegotiationProposalSchema,
  freelancerPayoutIdempotencyKey,
  MvpAiAuditableModalityEnum,
  mockAiAdvisorReport,
  mockClientTaskPublication,
  mockFreelancerNegotiationProposal,
  mockGigOrderCard,
  mockTaskOrderCard,
  platformFeePayoutIdempotencyKey,
  resolveMvpAiAuditableModality,
  splitSingleBlockEscrow,
  TaskOrderCardSchema,
} from './index';

describe('RF-03 reparto 96/4', () => {
  it('acota el monto al rango [100, 50_000_000] centavos', () => {
    expect(splitSingleBlockEscrow(100)).toEqual({ platformFeeUSDInCents: 4, freelancerPayoutUSDInCents: 96 });
    expect(splitSingleBlockEscrow(50_000_000).platformFeeUSDInCents).toBe(2_000_000);
    expect(() => splitSingleBlockEscrow(99)).toThrow('INVALID_TOTAL_AMOUNT');
    expect(() => splitSingleBlockEscrow(50_000_001)).toThrow('INVALID_TOTAL_AMOUNT');
    const card = mockTaskOrderCard();
    expect(
      TaskOrderCardSchema.safeParse({ ...card, paymentTerms: { ...card.paymentTerms, totalAmountUSDInCents: 99 } }).success,
    ).toBe(false);
  });

  it('aplica floor(total * 4 / 100) y conserva la suma exacta', () => {
    const split = splitSingleBlockEscrow(10_000);
    expect(split.platformFeeUSDInCents).toBe(400);
    expect(split.freelancerPayoutUSDInCents).toBe(9_600);
    expect(split.freelancerPayoutUSDInCents + split.platformFeeUSDInCents).toBe(10_000);

    const odd = splitSingleBlockEscrow(10_001);
    expect(odd.platformFeeUSDInCents).toBe(400);
    expect(odd.freelancerPayoutUSDInCents).toBe(9_601);
  });

  it('rechaza una orden cuyo fee no coincide con la fórmula', () => {
    const card = mockTaskOrderCard();
    const broken = {
      ...card,
      paymentTerms: { ...card.paymentTerms, platformFeeUSDInCents: 1, freelancerPayoutUSDInCents: card.paymentTerms.totalAmountUSDInCents - 1 },
    };
    expect(TaskOrderCardSchema.safeParse(broken).success).toBe(false);
  });
});

describe('RF-04 oferta menor o igual al tope', () => {
  it('acepta proposedBudget igual al tope y rechaza un centavo por encima', () => {
    expect(mockFreelancerNegotiationProposal({ proposedBudgetUSDInCents: 10_000 }).proposedBudgetUSDInCents).toBe(10_000);
    const over = FreelancerNegotiationProposalSchema.safeParse({
      ...mockFreelancerNegotiationProposal(),
      proposedBudgetUSDInCents: 10_001,
    });
    expect(over.success).toBe(false);
  });

  it('rechaza que el Buyer negocie sobre su propia publicación', () => {
    const proposal = mockFreelancerNegotiationProposal();
    expect(
      FreelancerNegotiationProposalSchema.safeParse({ ...proposal, freelancerUserId: proposal.buyerUserId }).success,
    ).toBe(false);
  });
});

describe('RF-05 modalidad de IA solo imagen y texto', () => {
  it('clasifica imagen y texto y deja fuera video, audio, código y datos', () => {
    expect(resolveMvpAiAuditableModality('IMAGE_RASTER_VECTOR')).toBe('IMAGE');
    expect(resolveMvpAiAuditableModality('DOCUMENT_TEXT')).toBe('TEXT');
    expect(resolveMvpAiAuditableModality('VIDEO_STREAM')).toBeNull();
    expect(resolveMvpAiAuditableModality('AUDIO_TRACK')).toBeNull();
    expect(resolveMvpAiAuditableModality('CODE_ARCHIVE')).toBeNull();
    expect(resolveMvpAiAuditableModality('DATA_CAMPAIGN')).toBeNull();
    expect(MvpAiAuditableModalityEnum.options).toEqual(['IMAGE', 'TEXT']);
  });

  it('exige modalidad en imagen y la prohíbe en video', () => {
    expect(mockTaskOrderCard().aiAuditableModality).toBe('IMAGE');
    const video = mockTaskOrderCard();
    const rejected = TaskOrderCardSchema.safeParse({
      ...video,
      expectedMediaType: 'VIDEO_STREAM',
      aiAuditableModality: 'IMAGE',
      technicalConstraints: { ...video.technicalConstraints, allowedExtensions: ['.mp4'] },
    });
    expect(rejected.success).toBe(false);
    const allowed = TaskOrderCardSchema.safeParse({
      ...video,
      expectedMediaType: 'VIDEO_STREAM',
      aiAuditableModality: undefined,
      technicalConstraints: { ...video.technicalConstraints, allowedExtensions: ['.mp4'] },
    });
    expect(allowed.success).toBe(true);
  });
});

describe('RF-01 y RF-02 contratos y mocks', () => {
  it('parsea publicación, orden de gig y informe de IA', () => {
    expect(mockClientTaskPublication().status).toBe('OPEN_FOR_PROPOSALS');
    expect(ClientTaskPublicationSchema.safeParse({ ...mockClientTaskPublication(), initialDeliveryDays: 8 }).success).toBe(false);
    expect(mockGigOrderCard().gigId).toBeDefined();
    expect(mockGigOrderCard().publicationId).toBeUndefined();
    const report = mockAiAdvisorReport();
    expect(AiAdvisorReportSchema.safeParse({ ...report, mandatoryDisclaimer: 'otro texto' }).success).toBe(false);
    expect(report.mandatoryDisclaimer).toContain('nunca aprueba ni ejecuta pagos');
  });

  it('rechaza una orden con gig y propuesta a la vez', () => {
    const card = mockTaskOrderCard();
    expect(card.proposalId).toBeDefined();
    expect(TaskOrderCardSchema.safeParse({ ...card, gigId: '66666666-6666-4666-8666-666666666666' }).success).toBe(false);
  });

  it('rechaza publicationId sin proposalId y buyer igual a seller', () => {
    const gig = mockGigOrderCard();
    expect(gig.proposalId).toBeUndefined();
    expect(
      TaskOrderCardSchema.safeParse({ ...gig, publicationId: '33333333-3333-4333-8333-333333333333' }).success,
    ).toBe(false);
    expect(
      TaskOrderCardSchema.safeParse({ ...gig, seller: { ...gig.seller, userId: gig.buyer.userId } }).success,
    ).toBe(false);
  });
});

describe('RF-11 plazos e idempotencia', () => {
  it('fija la decisión del Buyer a 24 horas exactas', () => {
    const requestedAt = '2026-10-16T15:00:00.000Z';
    const deadline = buyerExtensionDecisionDeadline(requestedAt);
    expect(deadline).toBe('2026-10-17T15:00:00.000Z');
    expect(
      DeadlineExtensionRequestSchema.safeParse({
        requestedExtraDays: 8,
        requestedAt,
        buyerDecisionDeadlineAt: deadline,
        status: 'PENDING_BUYER_DECISION',
      }).success,
    ).toBe(false);
  });

  it('genera claves SHA-256 distintas para bloqueo, 96%, 4% y reembolso', () => {
    const taskId = '55555555-5555-4555-8555-555555555555';
    const keys = [
      escrowLockIdempotencyKey(taskId, 1),
      freelancerPayoutIdempotencyKey(taskId),
      platformFeePayoutIdempotencyKey(taskId),
      buyerRefundIdempotencyKey(taskId, 1),
    ];
    expect(new Set(keys).size).toBe(4);
    for (const key of keys) expect(key).toMatch(/^[a-f0-9]{64}$/);
    expect(escrowLockIdempotencyKey(taskId, 1)).toBe(escrowLockIdempotencyKey(taskId, 1));
    expect(escrowLockIdempotencyKey(taskId, 1)).not.toBe(escrowLockIdempotencyKey(taskId, 2));
  });

  it('rechaza un pre-check incoherente del contrato de entrada de IA', () => {
    const input = AiAdvisorInputContractSchema.safeParse({
      taskOrderId: '55555555-5555-4555-8555-555555555555',
      deliverableId: '77777777-7777-4777-8777-777777777777',
      revisionNumber: 3,
      category: 'MUSIC_AND_AUDIO',
      auditableModality: 'TEXT',
      orderContext: {
        title: 'x',
        scopeDescription: 'y',
        acceptanceCriteria: [{ criterionId: 'abc', description: 'criterio minimo de ejemplo', isMandatory: true }],
      },
      deliverableArtifact: {
        fileName: 'a.mp3',
        mimeType: 'audio/mpeg',
        fileExtension: '.mp3',
        fileSizeBytes: 10,
        sha256Checksum: 'b'.repeat(64),
      },
      deterministicPreCheckResult: {
        extensionAllowed: false,
        nonEmptyFile: true,
        technicalConstraintsMet: true,
        failureReasons: [],
      },
    });
    expect(input.success).toBe(false);
  });
});
