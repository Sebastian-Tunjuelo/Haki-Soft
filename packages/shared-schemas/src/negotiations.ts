import { z } from 'zod';
import {
  MAX_MARKETPLACE_AMOUNT_USD_IN_CENTS,
  MIN_MARKETPLACE_AMOUNT_USD_IN_CENTS,
} from './money';
import { NegotiationProposalStatusEnum, PublicationStatusEnum, TaskOrderCardSchema } from './schemas';

const MarketplaceAmountUSDInCents = z
  .number()
  .int()
  .min(MIN_MARKETPLACE_AMOUNT_USD_IN_CENTS)
  .max(MAX_MARKETPLACE_AMOUNT_USD_IN_CENTS);

export const CreateNegotiationProposalInputSchema = z.object({
  publicationId: z.string().uuid(),
  proposedBudgetUSDInCents: MarketplaceAmountUSDInCents,
  proposedDeliveryDays: z.number().int().min(1).max(7),
  coverMessage: z.string().trim().min(15).max(2000),
});

export const SendNegotiationMessageInputSchema = z.object({
  proposalId: z.string().uuid(),
  body: z.string().trim().min(2).max(2000),
  offeredAmountUSDInCents: MarketplaceAmountUSDInCents.optional(),
  offeredDeliveryDays: z.number().int().min(1).max(7).optional(),
});

/** Anti-TOCTOU: el aceptante firma monto y plazo exactos que ve en pantalla. */
export const AcceptProposalPath1InputSchema = z.object({
  proposalId: z.string().uuid(),
  expectedAmountUSDInCents: MarketplaceAmountUSDInCents,
  expectedDeliveryDays: z.number().int().min(1).max(7),
  buyerAssumesDoubleFxConversion: z.literal(true),
});

export const CloseProposalPath2InputSchema = z.object({
  proposalId: z.string().uuid(),
  closedReason: z.string().trim().min(5).max(500),
});

export const HireFixedGigInputSchema = z.object({
  gigId: z.string().uuid(),
  expectedPriceUSDInCents: MarketplaceAmountUSDInCents,
  projectBrief: z.string().trim().min(20).max(3000),
  buyerAssumesDoubleFxConversion: z.literal(true),
});

export const NegotiationMessageViewSchema = z.object({
  messageId: z.string().uuid(),
  proposalId: z.string().uuid(),
  senderUserId: z.string().uuid(),
  body: z.string(),
  offeredAmountUSDInCents: z.number().int().positive().nullable(),
  offeredDeliveryDays: z.number().int().min(1).max(7).nullable(),
  createdAt: z.string().datetime(),
});

const NegotiationProposalFields = {
  proposalId: z.string().uuid(),
  publicationId: z.string().uuid(),
  buyerUserId: z.string().uuid(),
  freelancerUserId: z.string().uuid(),
  initialBudgetUSDInCents: MarketplaceAmountUSDInCents,
  proposedBudgetUSDInCents: MarketplaceAmountUSDInCents,
  proposedDeliveryDays: z.number().int().min(1).max(7),
  status: NegotiationProposalStatusEnum,
};

export const NegotiationProposalDetailSchema = z
  .object({
    ...NegotiationProposalFields,
    closedReason: z.string().nullable().optional(),
    closedAt: z.string().datetime().nullable().optional(),
    createdAt: z.string().datetime(),
    messages: z.array(NegotiationMessageViewSchema),
    freelancerDisplayName: z.string().optional(),
    freelancerHeadline: z.string().nullable().optional(),
    freelancerTargetCurrency: z.string().length(3).optional(),
  })
  .refine((data) => data.proposedBudgetUSDInCents <= data.initialBudgetUSDInCents, {
    path: ['proposedBudgetUSDInCents'],
  })
  .refine((data) => data.freelancerUserId !== data.buyerUserId, {
    path: ['freelancerUserId'],
  });

export const NegotiationInboxItemSchema = z
  .object({
    ...NegotiationProposalFields,
    createdAt: z.string().datetime(),
    freelancerDisplayName: z.string(),
    freelancerHeadline: z.string().nullable(),
    freelancerTargetCurrency: z.string().length(3),
    hasVerifiedWallet: z.boolean(),
  })
  .refine((data) => data.proposedBudgetUSDInCents <= data.initialBudgetUSDInCents, {
    path: ['proposedBudgetUSDInCents'],
  })
  .refine((data) => data.freelancerUserId !== data.buyerUserId, {
    path: ['freelancerUserId'],
  });

export const AcceptPath1ResultSchema = z.object({
  proposalStatus: z.literal('AGREED_PATH_1'),
  publicationStatus: z.literal('AGREED_AND_LOCKED'),
  taskOrder: TaskOrderCardSchema,
});

export const ClosePath2ResultSchema = z.object({
  proposalStatus: z.literal('DISCREPANCY_CLOSED_PATH_2'),
  publicationStatus: PublicationStatusEnum,
});

export const HireFixedGigResultSchema = z.object({
  taskOrder: TaskOrderCardSchema,
});

export type CreateNegotiationProposalInput = z.infer<typeof CreateNegotiationProposalInputSchema>;
export type SendNegotiationMessageInput = z.infer<typeof SendNegotiationMessageInputSchema>;
export type AcceptProposalPath1Input = z.infer<typeof AcceptProposalPath1InputSchema>;
export type CloseProposalPath2Input = z.infer<typeof CloseProposalPath2InputSchema>;
export type HireFixedGigInput = z.infer<typeof HireFixedGigInputSchema>;
export type NegotiationMessageView = z.infer<typeof NegotiationMessageViewSchema>;
export type NegotiationProposalDetail = z.infer<typeof NegotiationProposalDetailSchema>;
export type NegotiationInboxItem = z.infer<typeof NegotiationInboxItemSchema>;
export type AcceptPath1Result = z.infer<typeof AcceptPath1ResultSchema>;
export type ClosePath2Result = z.infer<typeof ClosePath2ResultSchema>;
export type HireFixedGigResult = z.infer<typeof HireFixedGigResultSchema>;

export { NegotiationProposalStatusEnum };
