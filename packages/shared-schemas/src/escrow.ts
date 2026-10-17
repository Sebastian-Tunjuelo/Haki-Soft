import { z } from 'zod';
import {
  MAX_MARKETPLACE_AMOUNT_USD_IN_CENTS,
  MIN_MARKETPLACE_AMOUNT_USD_IN_CENTS,
} from './money';
import { TaskLifecycleStatusEnum } from './schemas';

/** Horas para que el Freelancer acepte un Gig tras la solicitud del Buyer (DEC-OPEN-02). */
export const SELLER_CONFIRMATION_WINDOW_HOURS = 24;

export function sellerConfirmationDeadlineIso(createdAt: Date | string): string {
  const base = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  return new Date(base.getTime() + SELLER_CONFIRMATION_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
}

/** Vista compartida checkout / fondeo (SPEC-06) + confirmación mutua. */
export const EscrowFundingViewSchema = z.object({
  taskId: z.string().uuid(),
  title: z.string().min(1).max(120).optional(),
  lifecycleStatus: TaskLifecycleStatusEnum,
  totalAmountUSDInCents: z
    .number()
    .int()
    .min(MIN_MARKETPLACE_AMOUNT_USD_IN_CENTS)
    .max(MAX_MARKETPLACE_AMOUNT_USD_IN_CENTS),
  freelancerPayoutUSDInCents: z.number().int().nonnegative(),
  platformFeeUSDInCents: z.number().int().nonnegative(),
  interactRedirectUri: z.string().url().nullable(),
  ledgerStatus: z.enum(['AWAITING_FUNDS', 'FUNDS_LOCKED', 'RELEASED_96_4', 'REFUNDED_100']),
  /** Freelancer ya aceptó (y el dinero ya debió ir a escrow). */
  sellerConfirmed: z.boolean(),
  viewerRole: z.enum(['buyer', 'seller', 'other']).optional(),
  createdAt: z.string().datetime().optional(),
  /** Límite para que el emprendedor acepte (createdAt + 24h). */
  sellerConfirmationDeadlineAt: z.string().datetime().nullable().optional(),
  counterpartyDisplayName: z.string().min(1).max(120).optional(),
});

export const SellerActivityItemSchema = z.object({
  taskId: z.string().uuid(),
  title: z.string().min(1).max(120),
  totalAmountUSDInCents: z.number().int().positive(),
  lifecycleStatus: TaskLifecycleStatusEnum,
  sellerConfirmed: z.boolean(),
  createdAt: z.string().datetime(),
  sellerConfirmationDeadlineAt: z.string().datetime(),
  /** Rol del usuario autenticado en esta orden. */
  viewerRole: z.enum(['buyer', 'seller']).optional(),
  /** Contratador que solicita el trabajo. */
  buyerDisplayName: z.string().min(1).max(120).optional(),
  /** Emprendedor del encargo. */
  sellerDisplayName: z.string().min(1).max(120).optional(),
  /** Brief / descripción que el contratador añadió al solicitar. */
  projectBrief: z.string().min(1).max(4000).optional(),
});

/** Workspace post-aceptación: chat, anexos, plazo 7d y contexto (adelanto SPEC-07/09). */
export const OrderWorkspaceMessageSchema = z.object({
  messageId: z.string().uuid(),
  senderId: z.string().uuid(),
  senderDisplayName: z.string().min(1).max(120),
  senderRole: z.enum(['buyer', 'seller']),
  body: z.string().min(1).max(4000),
  attachmentFileName: z.string().min(1).max(255).nullable(),
  createdAt: z.string().datetime(),
});

export const OrderWorkspaceViewSchema = z.object({
  taskId: z.string().uuid(),
  title: z.string().min(1).max(120),
  scopeDescription: z.string().min(1).max(8000),
  projectBrief: z.string().min(1).max(4000).nullable(),
  lifecycleStatus: TaskLifecycleStatusEnum,
  totalAmountUSDInCents: z.number().int().positive(),
  buyerDisplayName: z.string().min(1).max(120),
  sellerDisplayName: z.string().min(1).max(120),
  viewerRole: z.enum(['buyer', 'seller']),
  /** Inicio del plazo de entrega (fondos locked). */
  deliveryStartedAt: z.string().datetime().nullable(),
  /** Fin del plazo (locked + initialDeliveryDays). */
  deliveryDeadlineAt: z.string().datetime().nullable(),
  initialDeliveryDays: z.number().int().min(1).max(7),
  messages: z.array(OrderWorkspaceMessageSchema),
});

export const SendOrderWorkspaceMessageInputSchema = z.object({
  body: z.string().min(1).max(4000),
  attachmentFileName: z.string().min(1).max(255).optional(),
});

/** Evento SSE / poll: solicitud nueva para el emprendedor. */
export const SellerWorkRequestEventSchema = z.object({
  type: z.literal('WORK_REQUEST_PENDING'),
  item: SellerActivityItemSchema,
});

export const RafikiIncomingCompletedWebhookSchema = z.object({
  eventId: z.string().min(8).max(200),
  eventType: z.literal('incoming_payment.completed'),
  taskId: z.string().uuid(),
  idempotencyKey: z.string().min(16).max(128),
  resourceUrl: z.string().url().optional(),
});

export type EscrowFundingView = z.infer<typeof EscrowFundingViewSchema>;
export type RafikiIncomingCompletedWebhook = z.infer<typeof RafikiIncomingCompletedWebhookSchema>;
export type SellerActivityItem = z.infer<typeof SellerActivityItemSchema>;
export type SellerWorkRequestEvent = z.infer<typeof SellerWorkRequestEventSchema>;
export type OrderWorkspaceMessage = z.infer<typeof OrderWorkspaceMessageSchema>;
export type OrderWorkspaceView = z.infer<typeof OrderWorkspaceViewSchema>;
export type SendOrderWorkspaceMessageInput = z.infer<typeof SendOrderWorkspaceMessageInputSchema>;
