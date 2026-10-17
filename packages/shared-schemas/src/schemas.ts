import { z } from 'zod';
import {
  ESCROW_WALLET_ADDRESS,
  MANDATORY_AI_DISCLAIMER,
  MAX_MARKETPLACE_AMOUNT_USD_IN_CENTS,
  MIN_MARKETPLACE_AMOUNT_USD_IN_CENTS,
  splitSingleBlockEscrow,
} from './money';
import { resolveMvpAiAuditableModality } from './modality';

export const TaskCategoryEnum = z.enum([
  'DIGITAL_MARKETING',
  'GRAPHICS_AND_DESIGN',
  'PROGRAMMING_AND_TECH',
  'TECHNICAL_WRITING_TRANS',
  'VIDEO_AND_ANIMATION',
  'MUSIC_AND_AUDIO',
]);

export const DeliverableMediaTypeEnum = z.enum([
  'IMAGE_RASTER_VECTOR',
  'DOCUMENT_TEXT',
  'CODE_ARCHIVE',
  'DATA_CAMPAIGN',
  'VIDEO_STREAM',
  'AUDIO_TRACK',
]);

export const MvpAiAuditableModalityEnum = z.enum(['IMAGE', 'TEXT']);

export const UserActiveModeEnum = z.enum(['BUYER', 'SELLER']);

export const PlatformRoleEnum = z.enum(['USER', 'ADMIN']);

export const TaskLifecycleStatusEnum = z.enum([
  'PENDING_ESCROW_FUNDING',
  'ESCROW_LOCKED',
  'EXTENSION_REQUESTED',
  'ESCROW_EXTENDED',
  'IN_REVIEW',
  'REVISION_REQUESTED',
  'FINAL_CLAIM_WINDOW_30M',
  'DISPUTED',
  'COMPLETED',
  'REFUNDED',
  'AUTO_REFUNDED_INITIAL_EXPIRED',
  'AUTO_REFUNDED_BY_TIMEOUT',
  'AUTO_REFUNDED_EXTENDED_EXPIRED',
]);

export const PublicationStatusEnum = z.enum([
  'OPEN_FOR_PROPOSALS',
  'AGREED_AND_LOCKED',
  'CANCELLED',
]);

export const NegotiationProposalStatusEnum = z.enum([
  'IN_NEGOTIATION',
  'AGREED_PATH_1',
  'DISCREPANCY_CLOSED_PATH_2',
]);

export const TimerJobTypeEnum = z.enum([
  'INITIAL_DELIVERY_7D',
  'EXTENSION_RESPONSE_24H',
  'EXTENDED_DELIVERY_UP_TO_7D',
  'DELIVERY_REVIEW_32H',
  'FINAL_CLAIM_WINDOW_30M',
]);

export const ExtensionRequestStatusEnum = z.enum([
  'PENDING_BUYER_DECISION',
  'APPROVED_EXTRA_DAYS',
  'REJECTED_REFUND_REQUESTED',
  'REJECTED_BY_TIMEOUT_AUTO_REFUNDED',
]);

const HOUR_MS = 24 * 60 * 60 * 1000;

const MarketplaceAmountUSDInCents = z
  .number()
  .int()
  .min(MIN_MARKETPLACE_AMOUNT_USD_IN_CENTS)
  .max(MAX_MARKETPLACE_AMOUNT_USD_IN_CENTS);

export const ClientTaskPublicationSchema = z.object({
  publicationId: z.string().uuid(),
  buyerUserId: z.string().uuid(),
  title: z.string().min(10).max(120),
  description: z.string().min(20).max(3000),
  category: TaskCategoryEnum,
  expectedMediaType: DeliverableMediaTypeEnum,
  initialBudgetUSDInCents: MarketplaceAmountUSDInCents,
  initialDeliveryDays: z.number().int().min(1).max(7).default(7),
  status: PublicationStatusEnum,
});

export const FreelancerNegotiationProposalSchema = z
  .object({
    proposalId: z.string().uuid(),
    publicationId: z.string().uuid(),
    buyerUserId: z.string().uuid(),
    freelancerUserId: z.string().uuid(),
    initialBudgetUSDInCents: MarketplaceAmountUSDInCents,
    proposedBudgetUSDInCents: MarketplaceAmountUSDInCents,
    proposedDeliveryDays: z.number().int().min(1).max(7),
    status: NegotiationProposalStatusEnum,
  })
  .refine((data) => data.proposedBudgetUSDInCents <= data.initialBudgetUSDInCents, {
    message:
      'El valor negociado siempre debe ser menor o igual al presupuesto planteado inicialmente por el cliente.',
    path: ['proposedBudgetUSDInCents'],
  })
  .refine((data) => data.freelancerUserId !== data.buyerUserId, {
    message: 'El Freelancer no puede negociar sobre su propia publicación.',
    path: ['freelancerUserId'],
  });

export const AcceptanceCriterionSchema = z.object({
  criterionId: z.string().min(3).max(32),
  description: z.string().min(10).max(350),
  isMandatory: z.boolean().default(true),
});

export const DeadlineExtensionRequestSchema = z
  .object({
    requestedExtraDays: z
      .number()
      .int()
      .min(1)
      .max(7)
      .describe('Única extensión permitida de hasta 7 días adicionales (límite total de hasta 14 días)'),
    requestedAt: z.string().datetime(),
    buyerDecisionDeadlineAt: z
      .string()
      .datetime()
      .describe('El Buyer tiene 24 horas para aprobar o rechazar; sin respuesta se reembolsa el 100% automáticamente'),
    status: ExtensionRequestStatusEnum,
  })
  .refine(
    (data) =>
      new Date(data.buyerDecisionDeadlineAt).getTime() - new Date(data.requestedAt).getTime() === HOUR_MS,
    {
      message: 'buyerDecisionDeadlineAt debe ser exactamente requestedAt más 24 horas.',
      path: ['buyerDecisionDeadlineAt'],
    },
  );

export const TaskOrderCardSchema = z
  .object({
    taskId: z.string().uuid(),
    gigId: z.string().uuid().optional(),
    proposalId: z.string().uuid().optional(),
    publicationId: z.string().uuid().optional().describe('Solo informativo; se deriva de proposalId'),
    title: z.string().min(10).max(120),
    category: TaskCategoryEnum,
    expectedMediaType: DeliverableMediaTypeEnum,
    aiAuditableModality: MvpAiAuditableModalityEnum.optional().describe(
      'Definido únicamente cuando la tarea corresponde a IMAGEN o TEXTO en el MVP',
    ),
    lifecycleStatus: TaskLifecycleStatusEnum,
    buyer: z.object({
      userId: z.string().uuid(),
      walletAddress: z.string().url(),
      originCurrency: z.string().length(3),
    }),
    seller: z.object({
      userId: z.string().uuid(),
      walletAddress: z.string().url(),
      targetCurrency: z.string().length(3),
    }),
    paymentTerms: z.object({
      paymentModality: z.literal('SINGLE_BLOCK_ESCROW'),
      escrowWalletAddress: z.string().url().default(ESCROW_WALLET_ADDRESS),
      platformOwnerWalletAddress: z
        .string()
        .url()
        .describe('Wallet distinta del escrow que recibe el 4% de comisión del dueño/plataforma'),
      totalAmountUSDInCents: MarketplaceAmountUSDInCents,
      freelancerPayoutUSDInCents: z.number().int().positive().describe('96% para el Freelancer'),
      platformFeeUSDInCents: z.number().int().nonnegative().describe('4% transferido a platformOwnerWalletAddress'),
      buyerAssumesDoubleFxConversion: z.literal(true),
      deliveryReviewHours: z.literal(32),
      finalClaimWindowMinutes: z.literal(30),
    }),
    executionDeadlineTerms: z.object({
      initialDeliveryDays: z.number().int().min(1).max(7).default(7),
      maxExtensionExtraDays: z.literal(7),
      maxExtensionsPerOrder: z.literal(1),
      extensionOnlyAllowedWhenInitialDeadlineExpires: z.literal(true),
      buyerExtensionResponseWindowHours: z.literal(24),
      autoRefundIfNoExtensionRequestedOnExpiry: z.literal(true),
      autoRefundOnExtensionResponseTimeout: z.literal(true),
      autoRefundOnExtendedDeadlineMissed: z.literal(true),
      refundTerminatesActivityAndUnbindsFreelancer: z.literal(true),
      activeExtensionRequest: DeadlineExtensionRequestSchema.optional(),
    }),
    revisionTerms: z.object({
      maxRevisionsAllowed: z.literal(2).describe('Máximo 2 correcciones globales por orden; no se reinicia con extensión'),
      revisionsUsed: z.number().int().min(0).max(2).default(0),
      arbitrationAuthorityOnDispute: z.literal('PLATFORM_ADMIN'),
      adminDecisionModality: z.literal('STRICT_BINARY_JUSTIFIED'),
    }),
    acceptanceCriteria: z.array(AcceptanceCriterionSchema).min(1).max(10),
    technicalConstraints: z.object({
      allowedExtensions: z.array(z.string()).min(1),
      maxFileSizeBytes: z.null().default(null),
      minWordCount: z.number().int().positive().optional(),
      minWidthPx: z.number().int().positive().optional(),
      minHeightPx: z.number().int().positive().optional(),
    }),
  })
  .refine(
    (data) => {
      let split: ReturnType<typeof splitSingleBlockEscrow>;
      try {
        split = splitSingleBlockEscrow(data.paymentTerms.totalAmountUSDInCents);
      } catch {
        return false;
      }
      return (
        data.paymentTerms.platformFeeUSDInCents === split.platformFeeUSDInCents &&
        data.paymentTerms.freelancerPayoutUSDInCents === split.freelancerPayoutUSDInCents &&
        data.paymentTerms.platformOwnerWalletAddress !== data.paymentTerms.escrowWalletAddress &&
        data.paymentTerms.platformOwnerWalletAddress !== data.seller.walletAddress
      );
    },
    {
      message:
        'El reparto debe ser floor(total * 4 / 100) para la wallet del dueño y el resto para el Freelancer, en wallets distintas del escrow.',
      path: ['paymentTerms'],
    },
  )
  .refine((data) => Boolean(data.gigId) !== Boolean(data.proposalId), {
    message: 'La orden nace de un Gig fijo o de una propuesta acordada, nunca de ambos ni de ninguno.',
    path: ['gigId'],
  })
  .refine((data) => !data.publicationId || Boolean(data.proposalId), {
    message: 'publicationId solo acompaña a una orden nacida de una propuesta acordada.',
    path: ['publicationId'],
  })
  .refine((data) => data.buyer.userId !== data.seller.userId, {
    message: 'Buyer y Freelancer de una orden deben ser usuarios distintos.',
    path: ['seller'],
  })
  .refine(
    (data) => data.aiAuditableModality === (resolveMvpAiAuditableModality(data.expectedMediaType) ?? undefined),
    {
      message: 'aiAuditableModality solo existe para IMAGE_RASTER_VECTOR y DOCUMENT_TEXT en el MVP.',
      path: ['aiAuditableModality'],
    },
  );

export const AiAdvisorInputContractSchema = z
  .object({
    taskOrderId: z.string().uuid(),
    deliverableId: z.string().uuid(),
    revisionNumber: z.number().int().min(0).max(2),
    category: TaskCategoryEnum,
    auditableModality: MvpAiAuditableModalityEnum,
    orderContext: z.object({
      title: z.string(),
      scopeDescription: z.string(),
      acceptanceCriteria: z.array(AcceptanceCriterionSchema).min(1),
      previousRevisionNotes: z.array(z.string()).optional(),
    }),
    deliverableArtifact: z.object({
      fileName: z.string(),
      mimeType: z.string(),
      fileExtension: z.string(),
      fileSizeBytes: z.number().int().positive(),
      sha256Checksum: z.string().length(64),
      extractedTextContent: z.string().optional(),
      wordCount: z.number().int().nonnegative().optional(),
      imageSignedUrlOrBase64: z.string().optional(),
      imageDimensions: z
        .object({
          widthPx: z.number().int().positive(),
          heightPx: z.number().int().positive(),
        })
        .optional(),
    }),
    deterministicPreCheckResult: z.object({
      extensionAllowed: z.boolean(),
      nonEmptyFile: z.boolean(),
      technicalConstraintsMet: z.boolean(),
      failureReasons: z.array(z.string()),
    }),
  })
  .refine(
    (data) =>
      data.deterministicPreCheckResult.nonEmptyFile === true &&
      data.deterministicPreCheckResult.extensionAllowed === true &&
      data.deterministicPreCheckResult.technicalConstraintsMet === true
        ? data.deterministicPreCheckResult.failureReasons.length === 0
        : data.deterministicPreCheckResult.failureReasons.length > 0,
    {
      message: 'El pre-check determinista debe declarar motivos cuando alguna bandera falla.',
      path: ['deterministicPreCheckResult'],
    },
  );

export const AiAdvisorReportSchema = z.object({
  taskId: z.string().uuid(),
  deliverableId: z.string().uuid(),
  revisionEvaluated: z.number().int().min(0).max(2),
  auditableModality: MvpAiAuditableModalityEnum,
  advisoryScore: z.number().int().min(0).max(100),
  advisoryLabel: z.enum(['HIGH_COMPLIANCE', 'PARTIAL_COMPLIANCE', 'LOW_COMPLIANCE']),
  executiveSummaryForBuyer: z.string().max(500),
  suggestionsForFreelancer: z.array(z.string()).max(6),
  criteriaEvaluation: z.array(
    z.object({
      criterionId: z.string(),
      status: z.enum(['MET', 'PARTIALLY_MET', 'NOT_MET', 'REQUIRES_HUMAN_VERIFICATION']),
      evidence: z.string().max(300),
    }),
  ),
  securityAndIntegrityAudit: z.object({
    promptInjectionDetected: z.boolean(),
    emptyOrCorruptedFileDetected: z.boolean(),
    deterministicCheckPassed: z.boolean(),
  }),
  mandatoryDisclaimer: z.literal(MANDATORY_AI_DISCLAIMER),
});

export const WalletLinkRequestSchema = z.object({
  walletAddress: z.string().url().startsWith('https://'),
});

export const ActiveModeSwitchSchema = z.object({
  activeMode: UserActiveModeEnum,
});

export const LocalRegisterSchema = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(8).max(200),
  displayName: z.string().trim().min(1).max(100),
  countryCode: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{2}$/)
    .optional(),
});

export const LocalLoginSchema = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(1).max(200),
});

export type TaskCategory = z.infer<typeof TaskCategoryEnum>;
export type DeliverableMediaType = z.infer<typeof DeliverableMediaTypeEnum>;
export type MvpAiAuditableModality = z.infer<typeof MvpAiAuditableModalityEnum>;
export type TaskLifecycleStatus = z.infer<typeof TaskLifecycleStatusEnum>;
export type ClientTaskPublication = z.infer<typeof ClientTaskPublicationSchema>;
export type FreelancerNegotiationProposal = z.infer<typeof FreelancerNegotiationProposalSchema>;
export type TaskOrderCard = z.infer<typeof TaskOrderCardSchema>;
export type DeadlineExtensionRequest = z.infer<typeof DeadlineExtensionRequestSchema>;
export type AiAdvisorInputContract = z.infer<typeof AiAdvisorInputContractSchema>;
export type AiAdvisorReport = z.infer<typeof AiAdvisorReportSchema>;
