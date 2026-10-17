import {
  buyerExtensionDecisionDeadline,
  ESCROW_WALLET_ADDRESS,
  MANDATORY_AI_DISCLAIMER,
  PLATFORM_OWNER_WALLET_ADDRESS,
  splitSingleBlockEscrow,
} from './money';
import {
  AiAdvisorInputContractSchema,
  AiAdvisorReportSchema,
  ClientTaskPublicationSchema,
  DeadlineExtensionRequestSchema,
  FreelancerNegotiationProposalSchema,
  TaskOrderCardSchema,
  type AiAdvisorInputContract,
  type AiAdvisorReport,
  type ClientTaskPublication,
  type DeadlineExtensionRequest,
  type FreelancerNegotiationProposal,
  type TaskOrderCard,
} from './schemas';

const BUYER_ID = '11111111-1111-4111-8111-111111111111';
const SELLER_ID = '22222222-2222-4222-8222-222222222222';
const PUBLICATION_ID = '33333333-3333-4333-8333-333333333333';
const PROPOSAL_ID = '44444444-4444-4444-8444-444444444444';
const TASK_ID = '55555555-5555-4555-8555-555555555555';
const GIG_ID = '66666666-6666-4666-8666-666666666666';
const DELIVERABLE_ID = '77777777-7777-4777-8777-777777777777';

const BUYER_WALLET = 'https://ilp.interledger-test.dev/buyer-demo';
const SELLER_WALLET = 'https://ilp.interledger-test.dev/seller-demo';
const OWNER_WALLET = PLATFORM_OWNER_WALLET_ADDRESS;

const CRITERION = {
  criterionId: 'tone-of-voice',
  description: 'El texto respeta el tono acordado en la orden.',
  isMandatory: true,
};

export function mockClientTaskPublication(
  overrides: Partial<ClientTaskPublication> = {},
): ClientTaskPublication {
  return ClientTaskPublicationSchema.parse({
    publicationId: PUBLICATION_ID,
    buyerUserId: BUYER_ID,
    title: 'Busco editor de fotos de producto',
    description: 'Necesito un recorte limpio del catálogo de diez productos para la tienda.',
    category: 'GRAPHICS_AND_DESIGN',
    expectedMediaType: 'IMAGE_RASTER_VECTOR',
    initialBudgetUSDInCents: 10_000,
    initialDeliveryDays: 7,
    status: 'OPEN_FOR_PROPOSALS',
    ...overrides,
  });
}

export function mockFreelancerNegotiationProposal(
  overrides: Partial<FreelancerNegotiationProposal> = {},
): FreelancerNegotiationProposal {
  return FreelancerNegotiationProposalSchema.parse({
    proposalId: PROPOSAL_ID,
    publicationId: PUBLICATION_ID,
    buyerUserId: BUYER_ID,
    freelancerUserId: SELLER_ID,
    initialBudgetUSDInCents: 10_000,
    proposedBudgetUSDInCents: 8_500,
    proposedDeliveryDays: 7,
    status: 'IN_NEGOTIATION',
    ...overrides,
  });
}

export function mockDeadlineExtensionRequest(
  overrides: Partial<DeadlineExtensionRequest> = {},
): DeadlineExtensionRequest {
  const requestedAt = overrides.requestedAt ?? '2026-10-16T15:00:00.000Z';
  return DeadlineExtensionRequestSchema.parse({
    requestedExtraDays: 7,
    requestedAt,
    buyerDecisionDeadlineAt: overrides.buyerDecisionDeadlineAt ?? buyerExtensionDecisionDeadline(requestedAt),
    status: 'PENDING_BUYER_DECISION',
    ...overrides,
  });
}

function paymentTerms(totalAmountUSDInCents: number) {
  const split = splitSingleBlockEscrow(totalAmountUSDInCents);
  return {
    paymentModality: 'SINGLE_BLOCK_ESCROW' as const,
    escrowWalletAddress: ESCROW_WALLET_ADDRESS,
    platformOwnerWalletAddress: OWNER_WALLET,
    totalAmountUSDInCents,
    freelancerPayoutUSDInCents: split.freelancerPayoutUSDInCents,
    platformFeeUSDInCents: split.platformFeeUSDInCents,
    buyerAssumesDoubleFxConversion: true as const,
    deliveryReviewHours: 32 as const,
    finalClaimWindowMinutes: 30 as const,
  };
}

export function mockTaskOrderCard(overrides: Partial<TaskOrderCard> = {}): TaskOrderCard {
  const base: TaskOrderCard = {
    taskId: TASK_ID,
    proposalId: PROPOSAL_ID,
    publicationId: PUBLICATION_ID,
    title: 'Edición de fotos de catálogo',
    category: 'GRAPHICS_AND_DESIGN',
    expectedMediaType: 'IMAGE_RASTER_VECTOR',
    aiAuditableModality: 'IMAGE',
    lifecycleStatus: 'ESCROW_LOCKED',
    buyer: { userId: BUYER_ID, walletAddress: BUYER_WALLET, originCurrency: 'COP' },
    seller: { userId: SELLER_ID, walletAddress: SELLER_WALLET, targetCurrency: 'USD' },
    paymentTerms: paymentTerms(8_500),
    executionDeadlineTerms: {
      initialDeliveryDays: 7,
      maxExtensionExtraDays: 7,
      maxExtensionsPerOrder: 1,
      extensionOnlyAllowedWhenInitialDeadlineExpires: true,
      buyerExtensionResponseWindowHours: 24,
      autoRefundIfNoExtensionRequestedOnExpiry: true,
      autoRefundOnExtensionResponseTimeout: true,
      autoRefundOnExtendedDeadlineMissed: true,
      refundTerminatesActivityAndUnbindsFreelancer: true,
    },
    revisionTerms: {
      maxRevisionsAllowed: 2,
      revisionsUsed: 0,
      arbitrationAuthorityOnDispute: 'PLATFORM_ADMIN',
      adminDecisionModality: 'STRICT_BINARY_JUSTIFIED',
    },
    acceptanceCriteria: [CRITERION],
    technicalConstraints: {
      allowedExtensions: ['.png', '.jpg'],
      maxFileSizeBytes: null,
    },
  };

  return TaskOrderCardSchema.parse({ ...base, ...overrides, paymentTerms: overrides.paymentTerms ?? base.paymentTerms });
}

export function mockGigOrderCard(): TaskOrderCard {
  return mockTaskOrderCard({
    gigId: GIG_ID,
    proposalId: undefined,
    publicationId: undefined,
    expectedMediaType: 'DOCUMENT_TEXT',
    aiAuditableModality: 'TEXT',
    category: 'TECHNICAL_WRITING_TRANS',
    paymentTerms: paymentTerms(8_000),
    technicalConstraints: {
      allowedExtensions: ['.md', '.pdf'],
      maxFileSizeBytes: null,
    },
  });
}

export function mockAiAdvisorInputContract(
  overrides: Partial<AiAdvisorInputContract> = {},
): AiAdvisorInputContract {
  return AiAdvisorInputContractSchema.parse({
    taskOrderId: TASK_ID,
    deliverableId: DELIVERABLE_ID,
    revisionNumber: 0,
    category: 'GRAPHICS_AND_DESIGN',
    auditableModality: 'IMAGE',
    orderContext: {
      title: 'Edición de fotos de catálogo',
      scopeDescription: 'Recorte limpio sobre fondo neutro para diez productos.',
      acceptanceCriteria: [CRITERION],
    },
    deliverableArtifact: {
      fileName: 'catalogo.png',
      mimeType: 'image/png',
      fileExtension: '.png',
      fileSizeBytes: 2048,
      sha256Checksum: 'a'.repeat(64),
      imageDimensions: { widthPx: 1200, heightPx: 800 },
      // PNG 1×1 mínimo (data URL) para pruebas IMAGE sin red.
      imageSignedUrlOrBase64:
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    },
    deterministicPreCheckResult: {
      extensionAllowed: true,
      nonEmptyFile: true,
      technicalConstraintsMet: true,
      failureReasons: [],
    },
    ...overrides,
  });
}

export function mockAiAdvisorReport(overrides: Partial<AiAdvisorReport> = {}): AiAdvisorReport {
  return AiAdvisorReportSchema.parse({
    taskId: TASK_ID,
    deliverableId: DELIVERABLE_ID,
    revisionEvaluated: 0,
    auditableModality: 'IMAGE',
    advisoryScore: 86,
    advisoryLabel: 'HIGH_COMPLIANCE',
    executiveSummaryForBuyer: 'La imagen cumple el recorte y el fondo pedidos. La decisión de pago sigue siendo del Buyer.',
    suggestionsForFreelancer: ['Subir un poco el contraste del producto principal.'],
    criteriaEvaluation: [
      {
        criterionId: 'tone-of-voice',
        status: 'MET',
        evidence: 'El recorte respeta el fondo neutro descrito en el criterio.',
      },
    ],
    securityAndIntegrityAudit: {
      promptInjectionDetected: false,
      emptyOrCorruptedFileDetected: false,
      deterministicCheckPassed: true,
    },
    mandatoryDisclaimer: MANDATORY_AI_DISCLAIMER,
    ...overrides,
  });
}

export const mockIds = {
  BUYER_ID,
  SELLER_ID,
  PUBLICATION_ID,
  PROPOSAL_ID,
  TASK_ID,
  GIG_ID,
  DELIVERABLE_ID,
  BUYER_WALLET,
  SELLER_WALLET,
  OWNER_WALLET,
};
