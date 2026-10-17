import { z } from 'zod';
import { PlatformRoleEnum, TaskLifecycleStatusEnum } from './schemas';

/** Ventana de revisión Buyer tras entrega: 72 h (3 días). */
export const REVIEW_WINDOW_HOURS = 72;
/** Tras aceptar: 30 minutos para apelar antes de liberar 96/4. */
export const FINAL_CLAIM_WINDOW_MINUTES = 30;
export const MAX_REVISIONS_PER_ORDER = 2;

export const OrderClockKindEnum = z.enum([
  'INITIAL_DELIVERY_7D',
  /** Valor estable del contrato; la duración real es REVIEW_WINDOW_HOURS (72). */
  'DELIVERY_REVIEW_32H',
  'FINAL_CLAIM_WINDOW_30M',
]);

export const OrderClockViewSchema = z.object({
  taskId: z.string().uuid(),
  lifecycleStatus: TaskLifecycleStatusEnum,
  revisionsUsed: z.number().int().min(0).max(2),
  maxRevisions: z.literal(2),
  activeDeadlineAt: z.string().datetime().nullable(),
  activeClockKind: OrderClockKindEnum.nullable(),
  viewerRole: z.enum(['buyer', 'seller']),
});

export const AcceptDeliverableResultSchema = z.object({
  taskId: z.string().uuid(),
  deliverableId: z.string().uuid(),
  /**
   * Demo / flujo de dinero: al aceptar se libera 96/4 de inmediato.
   * La ventana contractual de 30 m (`FINAL_CLAIM_WINDOW_MINUTES`) no se aplica en este camino.
   */
  lifecycleStatus: z.literal('COMPLETED'),
  ledgerStatus: z.literal('RELEASED_96_4'),
  originalAvailable: z.literal(true),
  sellerPayoutUSDInCents: z.number().int().nonnegative(),
});

export const RequestRevisionInputSchema = z.object({
  deliverableId: z.string().uuid(),
  notes: z.string().trim().min(10).max(2000),
});

export const RequestRevisionResultSchema = z.object({
  taskId: z.string().uuid(),
  deliverableId: z.string().uuid(),
  lifecycleStatus: z.literal('REVISION_REQUESTED'),
  revisionsUsed: z.number().int().min(1).max(2),
});

export const OpenDisputeInputSchema = z.object({
  reason: z.string().trim().min(10).max(2000),
});

export const OpenDisputeResultSchema = z.object({
  disputeId: z.string().uuid(),
  taskId: z.string().uuid(),
  status: z.literal('OPEN'),
  lifecycleStatus: z.literal('DISPUTED'),
});

/** API contract (SPEC-10); se mapea a AdminBinaryResolution de Prisma. */
export const AdminDisputeDecisionEnum = z.enum(['BUYER_FULL_REFUND', 'FREELANCER_SPLIT_96_4']);

export const ResolveDisputeInputSchema = z.object({
  decision: AdminDisputeDecisionEnum,
  justification: z.string().trim().min(20).max(2000),
});

export const DisputeCaseViewSchema = z.object({
  disputeId: z.string().uuid(),
  taskId: z.string().uuid(),
  status: z.enum(['OPEN', 'RESOLVED']),
  decision: AdminDisputeDecisionEnum.nullable(),
  justification: z.string().nullable(),
  claimReason: z.string().min(1),
  openedAt: z.string().datetime(),
  resolvedAt: z.string().datetime().nullable(),
  title: z.string().min(1).max(120),
  buyerDisplayName: z.string().min(1).max(120),
  sellerDisplayName: z.string().min(1).max(120),
  totalAmountUSDInCents: z.number().int().positive(),
  lifecycleStatus: TaskLifecycleStatusEnum,
});

export const DisputeCaseListItemSchema = z.object({
  disputeId: z.string().uuid(),
  taskId: z.string().uuid(),
  title: z.string().min(1).max(120),
  claimReason: z.string().min(1),
  openedAt: z.string().datetime(),
  buyerDisplayName: z.string().min(1).max(120),
  sellerDisplayName: z.string().min(1).max(120),
  status: z.enum(['OPEN', 'RESOLVED']),
});

export const DisputeCaseDetailSchema = DisputeCaseViewSchema.extend({
  deliverables: z.array(
    z.object({
      deliverableId: z.string().uuid(),
      revisionNumber: z.number().int().min(0).max(2),
      fileName: z.string().min(1),
      previewUrl: z.string().min(1),
      previewStatus: z.enum(['PENDING_PROCESSING', 'READY', 'FAILED']),
    }),
  ),
  messages: z.array(
    z.object({
      messageId: z.string().uuid(),
      senderDisplayName: z.string().min(1),
      senderRole: z.enum(['buyer', 'seller']),
      body: z.string().min(1),
      createdAt: z.string().datetime(),
    }),
  ),
});

export const BuyerDeliveryNoticeSchema = z.object({
  type: z.literal('DELIVERY_READY'),
  taskId: z.string().uuid(),
  deliverableId: z.string().uuid(),
  title: z.string().min(1).max(120),
  sellerDisplayName: z.string().min(1).max(120),
  createdAt: z.string().datetime(),
});

/** Aviso al emprendedor: el contratador aceptó y se liberó el 96 % a su cuenta. */
export const SellerAcceptanceNoticeSchema = z.object({
  type: z.literal('WORK_ACCEPTED_FUNDS_RELEASED'),
  taskId: z.string().uuid(),
  title: z.string().min(1).max(120),
  buyerDisplayName: z.string().min(1).max(120),
  sellerPayoutUSDInCents: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
});

export const PublicSessionUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string().min(1).max(100),
  countryCode: z.string().length(2),
  activeMode: z.enum(['BUYER', 'SELLER']),
  platformRole: PlatformRoleEnum,
});

export function reviewDeadlineIso(submittedAt: Date | string): string {
  const base = typeof submittedAt === 'string' ? new Date(submittedAt) : submittedAt;
  return new Date(base.getTime() + REVIEW_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
}

export function finalClaimDeadlineIso(acceptedAt: Date | string): string {
  const base = typeof acceptedAt === 'string' ? new Date(acceptedAt) : acceptedAt;
  return new Date(base.getTime() + FINAL_CLAIM_WINDOW_MINUTES * 60 * 1000).toISOString();
}

export type OrderClockView = z.infer<typeof OrderClockViewSchema>;
export type AcceptDeliverableResult = z.infer<typeof AcceptDeliverableResultSchema>;
export type RequestRevisionInput = z.infer<typeof RequestRevisionInputSchema>;
export type RequestRevisionResult = z.infer<typeof RequestRevisionResultSchema>;
export type OpenDisputeInput = z.infer<typeof OpenDisputeInputSchema>;
export type OpenDisputeResult = z.infer<typeof OpenDisputeResultSchema>;
export type ResolveDisputeInput = z.infer<typeof ResolveDisputeInputSchema>;
export type DisputeCaseView = z.infer<typeof DisputeCaseViewSchema>;
export type DisputeCaseListItem = z.infer<typeof DisputeCaseListItemSchema>;
export type DisputeCaseDetail = z.infer<typeof DisputeCaseDetailSchema>;
export type BuyerDeliveryNotice = z.infer<typeof BuyerDeliveryNoticeSchema>;
export type SellerAcceptanceNotice = z.infer<typeof SellerAcceptanceNoticeSchema>;
export type PublicSessionUser = z.infer<typeof PublicSessionUserSchema>;
