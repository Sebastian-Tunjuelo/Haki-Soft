-- Modelo de datos v2: desacople de TaskOrder (architecture-overview.md §5).
-- Las migraciones previas nunca se aplicaron a una base viva (SPEC-01 §10); las
-- columnas NOT NULL nuevas sin default asumen tablas vacías.

-- Restricciones de dominio v1: se reemplazan por el conjunto canónico del final.
ALTER TABLE "negotiation_proposals" DROP CONSTRAINT IF EXISTS "chk_negotiation_proposed_le_initial";
ALTER TABLE "task_orders" DROP CONSTRAINT IF EXISTS "chk_task_order_exact_96_4_split";
ALTER TABLE "task_orders" DROP CONSTRAINT IF EXISTS "chk_task_order_global_rules";
ALTER TABLE "task_orders" DROP CONSTRAINT IF EXISTS "chk_task_order_single_origin";
ALTER TABLE "deadline_extension_requests" DROP CONSTRAINT IF EXISTS "chk_extension_days_1_to_7";
ALTER TABLE "task_deliverables" DROP CONSTRAINT IF EXISTS "chk_deliverable_revision_0_to_2";
ALTER TABLE "dispute_cases" DROP CONSTRAINT IF EXISTS "chk_dispute_justification_when_resolved";
ALTER TABLE "gigs" DROP CONSTRAINT IF EXISTS "chk_gig_price_and_days";
ALTER TABLE "client_task_publications" DROP CONSTRAINT IF EXISTS "chk_publication_budget_and_days";
ALTER TABLE "ai_advisor_reports" DROP CONSTRAINT IF EXISTS "chk_ai_advisory_score_0_100";
ALTER TABLE "task_technical_constraints" DROP CONSTRAINT IF EXISTS "chk_mvp_unlimited_upload";
DROP INDEX IF EXISTS "user_wallets_one_active_per_user";
-- CreateEnum
CREATE TYPE "PlatformWalletRole" AS ENUM ('ESCROW_CUSTODY', 'OWNER_FEE_COLLECTION');

-- CreateEnum
CREATE TYPE "DeliverableReviewDecision" AS ENUM ('PENDING_REVIEW', 'ACCEPTED_BY_BUYER', 'ACCEPTED_BY_TIMEOUT', 'REVISION_REQUESTED', 'MEDIATION_REQUESTED');

-- DropForeignKey
ALTER TABLE "negotiation_proposals" DROP CONSTRAINT "negotiation_proposals_publication_id_fkey";

-- DropForeignKey
ALTER TABLE "task_orders" DROP CONSTRAINT "task_orders_buyer_wallet_id_fkey";

-- DropForeignKey
ALTER TABLE "task_orders" DROP CONSTRAINT "task_orders_seller_wallet_id_fkey";

-- DropForeignKey
ALTER TABLE "task_orders" DROP CONSTRAINT "task_orders_publication_id_fkey";

-- DropForeignKey
ALTER TABLE "task_orders" DROP CONSTRAINT "task_orders_proposal_id_fkey";

-- DropForeignKey
ALTER TABLE "task_orders" DROP CONSTRAINT "task_orders_gig_id_fkey";

-- DropForeignKey
ALTER TABLE "task_acceptance_criteria" DROP CONSTRAINT "task_acceptance_criteria_task_order_id_fkey";

-- DropForeignKey
ALTER TABLE "task_technical_constraints" DROP CONSTRAINT "task_technical_constraints_task_order_id_fkey";

-- DropForeignKey
ALTER TABLE "deadline_extension_requests" DROP CONSTRAINT "deadline_extension_requests_task_order_id_fkey";

-- DropForeignKey
ALTER TABLE "deadline_extension_requests" DROP CONSTRAINT "deadline_extension_requests_requested_by_id_fkey";

-- DropForeignKey
ALTER TABLE "open_payments_transactions" DROP CONSTRAINT "open_payments_transactions_task_order_id_fkey";

-- DropForeignKey
ALTER TABLE "task_deliverables" DROP CONSTRAINT "task_deliverables_task_order_id_fkey";

-- DropForeignKey
ALTER TABLE "ai_advisor_reports" DROP CONSTRAINT "ai_advisor_reports_deliverable_id_fkey";

-- DropForeignKey
ALTER TABLE "ai_advisor_reports" DROP CONSTRAINT "ai_advisor_reports_task_order_id_fkey";

-- DropForeignKey
ALTER TABLE "ai_criterion_evaluations" DROP CONSTRAINT "ai_criterion_evaluations_criterion_id_fkey";

-- DropForeignKey
ALTER TABLE "dispute_cases" DROP CONSTRAINT "dispute_cases_opened_by_id_fkey";

-- DropForeignKey
ALTER TABLE "scheduled_timer_jobs" DROP CONSTRAINT "scheduled_timer_jobs_task_order_id_fkey";

-- DropIndex
DROP INDEX "deadline_extension_requests_status_buyer_decision_deadline__idx";

-- DropIndex
DROP INDEX "open_payments_transactions_task_order_id_operation_type_idx";

-- DropIndex
DROP INDEX "task_deliverables_task_order_id_preview_status_idx";

-- DropIndex
DROP INDEX "ai_advisor_reports_task_order_id_revision_evaluated_idx";

-- DropIndex
DROP INDEX "scheduled_timer_jobs_task_order_id_timer_type_status_idx";

-- AlterTable
ALTER TABLE "seller_profiles" DROP COLUMN "ai_advisory_score_avg",
DROP COLUMN "completed_orders_count",
DROP COLUMN "rating_avg";

-- AlterTable
ALTER TABLE "user_wallets" ALTER COLUMN "is_active" SET DEFAULT false;

-- AlterTable
ALTER TABLE "negotiation_proposals" ADD COLUMN     "proposed_delivery_days" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "negotiation_messages" ADD COLUMN     "offered_delivery_days" INTEGER;

-- AlterTable
ALTER TABLE "task_orders" DROP COLUMN "ai_auditable_modality",
DROP COLUMN "buyer_origin_currency",
DROP COLUMN "buyer_wallet_id",
DROP COLUMN "completed_at",
DROP COLUMN "current_review_expires_at",
DROP COLUMN "current_review_started_at",
DROP COLUMN "escrow_locked_at",
DROP COLUMN "extended_delivery_deadline_at",
DROP COLUMN "extension_granted_days",
DROP COLUMN "final_claim_window_expires_at",
DROP COLUMN "final_claim_window_minutes",
DROP COLUMN "final_claim_window_started_at",
DROP COLUMN "freelancer_payout_usd_in_cents",
DROP COLUMN "initial_delivery_deadline_at",
DROP COLUMN "max_revisions_allowed",
DROP COLUMN "platform_fee_usd_in_cents",
DROP COLUMN "publication_id",
DROP COLUMN "refunded_at",
DROP COLUMN "review_window_hours",
DROP COLUMN "revisions_used",
DROP COLUMN "seller_target_currency",
DROP COLUMN "seller_wallet_id",
DROP COLUMN "total_amount_usd_in_cents",
ADD COLUMN     "closed_at" TIMESTAMP(3),
ALTER COLUMN "initial_delivery_days" DROP DEFAULT;

-- AlterTable
ALTER TABLE "deadline_extension_requests" DROP COLUMN "buyer_decision_deadline_at",
DROP COLUMN "requested_by_id";

-- AlterTable
ALTER TABLE "escrow_ledgers" DROP COLUMN "escrow_wallet_address",
DROP COLUMN "locked_amount_usd_in_cents",
DROP COLUMN "platform_fee_paid_out_in_cents",
DROP COLUMN "platform_owner_wallet_address",
DROP COLUMN "refunded_to_buyer_usd_in_cents",
DROP COLUMN "released_to_seller_usd_in_cents",
ADD COLUMN     "buyer_wallet_id" UUID NOT NULL,
ADD COLUMN     "custody_wallet_id" UUID NOT NULL,
ADD COLUMN     "freelancer_payout_usd_in_cents" INTEGER NOT NULL,
ADD COLUMN     "funds_locked_at" TIMESTAMP(3),
ADD COLUMN     "owner_fee_wallet_id" UUID NOT NULL,
ADD COLUMN     "platform_fee_usd_in_cents" INTEGER NOT NULL,
ADD COLUMN     "seller_wallet_id" UUID NOT NULL,
ADD COLUMN     "settled_at" TIMESTAMP(3),
ADD COLUMN     "total_amount_usd_in_cents" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "open_payments_transactions" DROP COLUMN "task_order_id";

-- AlterTable
ALTER TABLE "task_deliverables" DROP COLUMN "is_original_unlocked",
DROP COLUMN "review_expires_at",
DROP COLUMN "review_started_at",
DROP COLUMN "unlocked_at",
ADD COLUMN     "original_unlocked_at" TIMESTAMP(3),
ADD COLUMN     "review_decided_at" TIMESTAMP(3),
ADD COLUMN     "review_decision" "DeliverableReviewDecision" NOT NULL DEFAULT 'PENDING_REVIEW';

-- AlterTable
ALTER TABLE "ai_advisor_reports" DROP COLUMN "auditable_modality",
DROP COLUMN "mandatory_disclaimer",
DROP COLUMN "revision_evaluated",
DROP COLUMN "task_order_id";

-- AlterTable
ALTER TABLE "dispute_cases" DROP COLUMN "opened_by_id";

-- AlterTable
ALTER TABLE "scheduled_timer_jobs" DROP COLUMN "scheduled_for",
ADD COLUMN     "deliverable_id" UUID,
ADD COLUMN     "expires_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "started_at" TIMESTAMP(3) NOT NULL;

-- DropEnum
DROP TYPE "MvpAiAuditableModality";

-- CreateTable
CREATE TABLE "platform_wallets" (
    "id" UUID NOT NULL,
    "role" "PlatformWalletRole" NOT NULL,
    "wallet_address_url" TEXT NOT NULL,
    "asset_code" VARCHAR(6) NOT NULL,
    "asset_scale" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_category_media_types" (
    "category" "TaskCategory" NOT NULL,
    "media_type" "DeliverableMediaType" NOT NULL,

    CONSTRAINT "task_category_media_types_pkey" PRIMARY KEY ("category","media_type")
);

-- Seed BEFORE FKs from gigs/publications/task_orders (DB may already have rows).
INSERT INTO "task_category_media_types" ("category", "media_type") VALUES
  ('DIGITAL_MARKETING', 'DATA_CAMPAIGN'),
  ('GRAPHICS_AND_DESIGN', 'IMAGE_RASTER_VECTOR'),
  ('PROGRAMMING_AND_TECH', 'CODE_ARCHIVE'),
  ('TECHNICAL_WRITING_TRANS', 'DOCUMENT_TEXT'),
  ('VIDEO_AND_ANIMATION', 'VIDEO_STREAM'),
  ('MUSIC_AND_AUDIO', 'AUDIO_TRACK')
ON CONFLICT DO NOTHING;

-- CreateIndex
CREATE UNIQUE INDEX "platform_wallets_wallet_address_url_key" ON "platform_wallets"("wallet_address_url");

-- CreateIndex
CREATE INDEX "platform_wallets_role_is_active_idx" ON "platform_wallets"("role", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "client_task_publications_id_buyer_id_initial_budget_usd_in__key" ON "client_task_publications"("id", "buyer_id", "initial_budget_usd_in_cents");

-- CreateIndex
CREATE INDEX "task_orders_gig_id_idx" ON "task_orders"("gig_id");

-- CreateIndex
CREATE INDEX "deadline_extension_requests_status_idx" ON "deadline_extension_requests"("status");

-- CreateIndex
CREATE INDEX "escrow_ledgers_status_idx" ON "escrow_ledgers"("status");

-- CreateIndex
CREATE INDEX "escrow_ledgers_buyer_wallet_id_idx" ON "escrow_ledgers"("buyer_wallet_id");

-- CreateIndex
CREATE INDEX "escrow_ledgers_seller_wallet_id_idx" ON "escrow_ledgers"("seller_wallet_id");

-- CreateIndex
CREATE UNIQUE INDEX "open_payments_transactions_escrow_ledger_id_operation_type__key" ON "open_payments_transactions"("escrow_ledger_id", "operation_type", "attempt_number");

-- CreateIndex
CREATE UNIQUE INDEX "task_deliverables_original_r2_key_key" ON "task_deliverables"("original_r2_key");

-- CreateIndex
CREATE UNIQUE INDEX "task_deliverables_preview_r2_key_key" ON "task_deliverables"("preview_r2_key");

-- CreateIndex
CREATE INDEX "task_deliverables_task_order_id_review_decision_idx" ON "task_deliverables"("task_order_id", "review_decision");

-- CreateIndex
CREATE INDEX "task_deliverables_preview_status_idx" ON "task_deliverables"("preview_status");

-- CreateIndex
CREATE INDEX "ai_criterion_evaluations_criterion_id_idx" ON "ai_criterion_evaluations"("criterion_id");

-- CreateIndex
CREATE INDEX "scheduled_timer_jobs_task_order_id_status_idx" ON "scheduled_timer_jobs"("task_order_id", "status");

-- CreateIndex
CREATE INDEX "scheduled_timer_jobs_status_expires_at_idx" ON "scheduled_timer_jobs"("status", "expires_at");

-- CreateIndex
CREATE INDEX "scheduled_timer_jobs_deliverable_id_idx" ON "scheduled_timer_jobs"("deliverable_id");

-- AddForeignKey
ALTER TABLE "gigs" ADD CONSTRAINT "gigs_category_expected_media_type_fkey" FOREIGN KEY ("category", "expected_media_type") REFERENCES "task_category_media_types"("category", "media_type") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_task_publications" ADD CONSTRAINT "client_task_publications_category_expected_media_type_fkey" FOREIGN KEY ("category", "expected_media_type") REFERENCES "task_category_media_types"("category", "media_type") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negotiation_proposals" ADD CONSTRAINT "negotiation_proposals_publication_id_buyer_id_initial_budg_fkey" FOREIGN KEY ("publication_id", "buyer_id", "initial_budget_usd_in_cents") REFERENCES "client_task_publications"("id", "buyer_id", "initial_budget_usd_in_cents") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_orders" ADD CONSTRAINT "task_orders_gig_id_fkey" FOREIGN KEY ("gig_id") REFERENCES "gigs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_orders" ADD CONSTRAINT "task_orders_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "negotiation_proposals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_orders" ADD CONSTRAINT "task_orders_category_expected_media_type_fkey" FOREIGN KEY ("category", "expected_media_type") REFERENCES "task_category_media_types"("category", "media_type") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_acceptance_criteria" ADD CONSTRAINT "task_acceptance_criteria_task_order_id_fkey" FOREIGN KEY ("task_order_id") REFERENCES "task_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_technical_constraints" ADD CONSTRAINT "task_technical_constraints_task_order_id_fkey" FOREIGN KEY ("task_order_id") REFERENCES "task_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deadline_extension_requests" ADD CONSTRAINT "deadline_extension_requests_task_order_id_fkey" FOREIGN KEY ("task_order_id") REFERENCES "task_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escrow_ledgers" ADD CONSTRAINT "escrow_ledgers_buyer_wallet_id_fkey" FOREIGN KEY ("buyer_wallet_id") REFERENCES "user_wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escrow_ledgers" ADD CONSTRAINT "escrow_ledgers_seller_wallet_id_fkey" FOREIGN KEY ("seller_wallet_id") REFERENCES "user_wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escrow_ledgers" ADD CONSTRAINT "escrow_ledgers_custody_wallet_id_fkey" FOREIGN KEY ("custody_wallet_id") REFERENCES "platform_wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escrow_ledgers" ADD CONSTRAINT "escrow_ledgers_owner_fee_wallet_id_fkey" FOREIGN KEY ("owner_fee_wallet_id") REFERENCES "platform_wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_deliverables" ADD CONSTRAINT "task_deliverables_task_order_id_fkey" FOREIGN KEY ("task_order_id") REFERENCES "task_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_advisor_reports" ADD CONSTRAINT "ai_advisor_reports_deliverable_id_fkey" FOREIGN KEY ("deliverable_id") REFERENCES "task_deliverables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_criterion_evaluations" ADD CONSTRAINT "ai_criterion_evaluations_criterion_id_fkey" FOREIGN KEY ("criterion_id") REFERENCES "task_acceptance_criteria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_timer_jobs" ADD CONSTRAINT "scheduled_timer_jobs_task_order_id_fkey" FOREIGN KEY ("task_order_id") REFERENCES "task_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_timer_jobs" ADD CONSTRAINT "scheduled_timer_jobs_deliverable_id_fkey" FOREIGN KEY ("deliverable_id") REFERENCES "task_deliverables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ===== Capa física canónica (prisma/sql/domain_checks.sql) =====

-- Capa fÃ­sica que Prisma 6 no modela: CHECK, Ã­ndices parciales, triggers y vistas.
-- Conjunto canÃ³nico del modelo de datos v2 (architecture-overview.md Â§5.3).
-- Se aplica despuÃ©s del DDL generado por Prisma; las migraciones lo replican.
--
-- FÃ³rmula canÃ³nica 96/4 (taskboard.md Â§3 regla 8), en centavos enteros:
--   platform_fee      = floor(total * 4 / 100)
--   freelancer_payout = total - platform_fee
-- El cast ::bigint evita desbordar int4 al multiplicar.
-- Rango de montos: [100, 50_000_000] centavos (USD 1 a USD 500.000).

-- ============================================================================
-- 1. IDENTIDAD
-- ============================================================================

ALTER TABLE "user_wallets"
  ADD CONSTRAINT "chk_wallet_active_requires_verified"
  CHECK (NOT "is_active" OR "is_verified");

ALTER TABLE "user_wallets"
  ADD CONSTRAINT "chk_wallet_verified_at_coherent"
  CHECK ("is_verified" = ("verified_at" IS NOT NULL));

ALTER TABLE "user_wallets"
  ADD CONSTRAINT "chk_wallet_asset_scale"
  CHECK ("asset_scale" BETWEEN 0 AND 18);

CREATE UNIQUE INDEX "user_wallets_one_active_per_user"
  ON "user_wallets" ("user_id")
  WHERE "is_active" = true;

ALTER TABLE "platform_wallets"
  ADD CONSTRAINT "chk_platform_wallet_asset_scale"
  CHECK ("asset_scale" BETWEEN 0 AND 18);

CREATE UNIQUE INDEX "platform_wallets_one_active_per_role"
  ON "platform_wallets" ("role")
  WHERE "is_active" = true;

-- ============================================================================
-- 2. MARKETPLACE
-- ============================================================================

ALTER TABLE "gigs"
  ADD CONSTRAINT "chk_gig_price_and_days"
  CHECK (
    "price_usd_in_cents" BETWEEN 100 AND 50000000
    AND "initial_delivery_days" BETWEEN 1 AND 7
    AND cardinality("allowed_extensions") >= 1
  );

ALTER TABLE "client_task_publications"
  ADD CONSTRAINT "chk_publication_budget_and_days"
  CHECK (
    "initial_budget_usd_in_cents" BETWEEN 100 AND 50000000
    AND "initial_delivery_days" BETWEEN 1 AND 7
    AND "republish_count" >= 0
    AND cardinality("allowed_extensions") >= 1
  );

ALTER TABLE "negotiation_proposals"
  ADD CONSTRAINT "chk_proposal_downward_only"
  CHECK (
    "proposed_budget_usd_in_cents" >= 100
    AND "proposed_budget_usd_in_cents" <= "initial_budget_usd_in_cents"
    AND "proposed_delivery_days" BETWEEN 1 AND 7
  );

ALTER TABLE "negotiation_proposals"
  ADD CONSTRAINT "chk_proposal_no_self_dealing"
  CHECK ("freelancer_id" <> "buyer_id");

ALTER TABLE "negotiation_proposals"
  ADD CONSTRAINT "chk_proposal_closed_at_coherent"
  CHECK (("status" = 'IN_NEGOTIATION') = ("closed_at" IS NULL));

-- SEC-GAP-01: dos acuerdos concurrentes sobre la misma publicaciÃ³n.
CREATE UNIQUE INDEX "negotiation_proposals_one_agreement_per_publication"
  ON "negotiation_proposals" ("publication_id")
  WHERE "status" = 'AGREED_PATH_1';

CREATE UNIQUE INDEX "negotiation_proposals_one_active_per_freelancer"
  ON "negotiation_proposals" ("publication_id", "freelancer_id")
  WHERE "status" = 'IN_NEGOTIATION';

ALTER TABLE "negotiation_messages"
  ADD CONSTRAINT "chk_message_offer_range"
  CHECK (
    ("offered_amount_usd_in_cents" IS NULL OR "offered_amount_usd_in_cents" BETWEEN 100 AND 50000000)
    AND ("offered_delivery_days" IS NULL OR "offered_delivery_days" BETWEEN 1 AND 7)
  );

-- ============================================================================
-- 3. CONTRATACIÃ“N
-- ============================================================================

ALTER TABLE "task_orders"
  ADD CONSTRAINT "chk_task_order_single_origin"
  CHECK (num_nonnulls("gig_id", "proposal_id") = 1);

ALTER TABLE "task_orders"
  ADD CONSTRAINT "chk_task_order_no_self_dealing"
  CHECK ("buyer_id" <> "seller_id");

ALTER TABLE "task_orders"
  ADD CONSTRAINT "chk_task_order_initial_days"
  CHECK ("initial_delivery_days" BETWEEN 1 AND 7);

ALTER TABLE "task_orders"
  ADD CONSTRAINT "chk_task_order_closed_at_coherent"
  CHECK (
    ("closed_at" IS NOT NULL) = ("lifecycle_status" IN (
      'COMPLETED',
      'REFUNDED',
      'AUTO_REFUNDED_INITIAL_EXPIRED',
      'AUTO_REFUNDED_BY_TIMEOUT',
      'AUTO_REFUNDED_EXTENDED_EXPIRED'
    ))
  );

ALTER TABLE "task_technical_constraints"
  ADD CONSTRAINT "chk_technical_constraint_ranges"
  CHECK (
    cardinality("allowed_extensions") >= 1
    AND "max_file_size_bytes" IS NULL
    AND ("min_word_count" IS NULL OR "min_word_count" > 0)
    AND ("min_width_px" IS NULL OR "min_width_px" > 0)
    AND ("min_height_px" IS NULL OR "min_height_px" > 0)
    AND ("min_duration_seconds" IS NULL OR "min_duration_seconds" > 0)
    AND ("max_duration_seconds" IS NULL OR "max_duration_seconds" > 0)
    AND (
      "min_duration_seconds" IS NULL
      OR "max_duration_seconds" IS NULL
      OR "min_duration_seconds" <= "max_duration_seconds"
    )
  );

ALTER TABLE "deadline_extension_requests"
  ADD CONSTRAINT "chk_extension_days_1_to_7"
  CHECK ("requested_extra_days" BETWEEN 1 AND 7);

ALTER TABLE "deadline_extension_requests"
  ADD CONSTRAINT "chk_extension_responded_at_coherent"
  CHECK (
    ("status" = 'PENDING_BUYER_DECISION') = ("responded_at" IS NULL)
    AND ("responded_at" IS NULL OR "responded_at" >= "requested_at")
    AND (
      "status" NOT IN ('APPROVED_EXTRA_DAYS', 'REJECTED_REFUND_REQUESTED')
      OR "responded_at" <= "requested_at" + INTERVAL '24 hours'
    )
  );

-- ============================================================================
-- 4. FINANZAS
-- ============================================================================

ALTER TABLE "escrow_ledgers"
  ADD CONSTRAINT "chk_escrow_amount_range"
  CHECK ("total_amount_usd_in_cents" BETWEEN 100 AND 50000000);

ALTER TABLE "escrow_ledgers"
  ADD CONSTRAINT "chk_escrow_exact_96_4_split"
  CHECK (
    "platform_fee_usd_in_cents" = ("total_amount_usd_in_cents"::bigint * 4 / 100)
    AND "freelancer_payout_usd_in_cents" = "total_amount_usd_in_cents" - "platform_fee_usd_in_cents"
  );

ALTER TABLE "escrow_ledgers"
  ADD CONSTRAINT "chk_escrow_distinct_party_wallets"
  CHECK ("buyer_wallet_id" <> "seller_wallet_id");

ALTER TABLE "escrow_ledgers"
  ADD CONSTRAINT "chk_escrow_distinct_platform_wallets"
  CHECK ("custody_wallet_id" <> "owner_fee_wallet_id");

ALTER TABLE "escrow_ledgers"
  ADD CONSTRAINT "chk_escrow_timestamps_coherent"
  CHECK (
    CASE "status"
      WHEN 'AWAITING_FUNDS' THEN "funds_locked_at" IS NULL AND "settled_at" IS NULL
      WHEN 'FUNDS_LOCKED' THEN "funds_locked_at" IS NOT NULL AND "settled_at" IS NULL
      ELSE "funds_locked_at" IS NOT NULL AND "settled_at" IS NOT NULL AND "settled_at" >= "funds_locked_at"
    END
  );

ALTER TABLE "open_payments_transactions"
  ADD CONSTRAINT "chk_op_tx_attempt_number"
  CHECK ("attempt_number" >= 1);

ALTER TABLE "open_payments_transactions"
  ADD CONSTRAINT "chk_op_tx_completed_at_coherent"
  CHECK (("status" = 'COMPLETED') = ("completed_at" IS NOT NULL));

-- SEC-GAP-06: liquidaciÃ³n dividida; cada pierna se reintenta sin duplicar la otra.
CREATE UNIQUE INDEX "open_payments_transactions_one_completed_per_leg"
  ON "open_payments_transactions" ("escrow_ledger_id", "operation_type")
  WHERE "status" = 'COMPLETED';

CREATE UNIQUE INDEX "open_payments_transactions_one_in_flight_per_leg"
  ON "open_payments_transactions" ("escrow_ledger_id", "operation_type")
  WHERE "status" IN ('PENDING_INTERACTION', 'PROCESSING');

-- ============================================================================
-- 5. EJECUCIÃ“N
-- ============================================================================

ALTER TABLE "task_deliverables"
  ADD CONSTRAINT "chk_deliverable_revision_0_to_2"
  CHECK ("revision_number" BETWEEN 0 AND 2);

ALTER TABLE "task_deliverables"
  ADD CONSTRAINT "chk_deliverable_file_integrity"
  CHECK ("file_size_bytes" > 0 AND "sha256_checksum" ~ '^[0-9a-f]{64}$');

ALTER TABLE "task_deliverables"
  ADD CONSTRAINT "chk_deliverable_review_coherent"
  CHECK (
    ("review_decision" = 'PENDING_REVIEW') = ("review_decided_at" IS NULL)
    AND ("review_decided_at" IS NULL OR "review_decided_at" >= "submitted_at")
    AND (("review_decision" = 'REVISION_REQUESTED') = (
      "buyer_revision_notes" IS NOT NULL AND length(trim("buyer_revision_notes")) > 0
    ))
    AND ("review_decision" <> 'REVISION_REQUESTED' OR "revision_number" < 2)
    AND ("review_decision" <> 'MEDIATION_REQUESTED' OR "revision_number" = 2)
  );

ALTER TABLE "task_deliverables"
  ADD CONSTRAINT "chk_deliverable_unlock_after_decision"
  CHECK (
    "original_unlocked_at" IS NULL
    OR (
      "review_decision" IN ('ACCEPTED_BY_BUYER', 'ACCEPTED_BY_TIMEOUT', 'MEDIATION_REQUESTED')
      AND "original_unlocked_at" >= "review_decided_at"
    )
  );

CREATE UNIQUE INDEX "task_deliverables_one_pending_review_per_order"
  ON "task_deliverables" ("task_order_id")
  WHERE "review_decision" = 'PENDING_REVIEW';

ALTER TABLE "ai_advisor_reports"
  ADD CONSTRAINT "chk_ai_advisory_score_0_100"
  CHECK ("advisory_score" BETWEEN 0 AND 100);

ALTER TABLE "ai_advisor_reports"
  ADD CONSTRAINT "chk_ai_suggestions_max_6"
  CHECK (cardinality("suggestions_for_freelancer") <= 6);

ALTER TABLE "dispute_cases"
  ADD CONSTRAINT "chk_dispute_resolution_coherent"
  CHECK (
    CASE "binary_resolution"
      WHEN 'PENDING' THEN "resolved_at" IS NULL
      ELSE "resolved_at" IS NOT NULL
        AND "resolved_at" >= "opened_at"
        AND "admin_reviewer_id" IS NOT NULL
        AND "resolution_justification" IS NOT NULL
        AND length(trim("resolution_justification")) >= 20
    END
  );

ALTER TABLE "scheduled_timer_jobs"
  ADD CONSTRAINT "chk_timer_subject_matches_type"
  CHECK (
    ("timer_type" IN ('DELIVERY_REVIEW_32H', 'FINAL_CLAIM_WINDOW_30M')) = ("deliverable_id" IS NOT NULL)
  );

ALTER TABLE "scheduled_timer_jobs"
  ADD CONSTRAINT "chk_timer_duration_by_type"
  CHECK (
    CASE "timer_type"
      WHEN 'INITIAL_DELIVERY_7D' THEN "expires_at" - "started_at" BETWEEN INTERVAL '1 day' AND INTERVAL '7 days'
      WHEN 'EXTENDED_DELIVERY_UP_TO_7D' THEN "expires_at" - "started_at" BETWEEN INTERVAL '1 day' AND INTERVAL '7 days'
      WHEN 'EXTENSION_RESPONSE_24H' THEN "expires_at" - "started_at" = INTERVAL '24 hours'
      WHEN 'DELIVERY_REVIEW_32H' THEN "expires_at" - "started_at" = INTERVAL '32 hours'
      WHEN 'FINAL_CLAIM_WINDOW_30M' THEN "expires_at" - "started_at" = INTERVAL '30 minutes'
    END
  );

ALTER TABLE "scheduled_timer_jobs"
  ADD CONSTRAINT "chk_timer_status_timestamps"
  CHECK (
    CASE "status"
      WHEN 'SCHEDULED' THEN "executed_at" IS NULL AND "cancelled_at" IS NULL
      WHEN 'EXECUTED' THEN "executed_at" IS NOT NULL AND "cancelled_at" IS NULL
      WHEN 'CANCELLED_BY_ACTION' THEN "cancelled_at" IS NOT NULL AND "executed_at" IS NULL
      ELSE "executed_at" IS NULL
    END
  );

CREATE UNIQUE INDEX "scheduled_timer_jobs_one_scheduled_per_order"
  ON "scheduled_timer_jobs" ("task_order_id")
  WHERE "status" = 'SCHEDULED';

-- ============================================================================
-- 6. TRIGGERS: INVARIANTES ENTRE TABLAS
-- Todos lanzan check_violation con un cÃ³digo de dominio en el mensaje.
-- ============================================================================

-- La orden nace de un Gig o de una propuesta AGREED_PATH_1 y copia sus tÃ©rminos.
-- DespuÃ©s de creada, sus partes, origen y tÃ©rminos no cambian.
CREATE OR REPLACE FUNCTION "fn_task_order_origin_guard"() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_ok boolean;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF (NEW."buyer_id", NEW."seller_id", NEW."gig_id", NEW."proposal_id", NEW."title",
        NEW."scope_description", NEW."category", NEW."expected_media_type", NEW."initial_delivery_days")
       IS DISTINCT FROM
       (OLD."buyer_id", OLD."seller_id", OLD."gig_id", OLD."proposal_id", OLD."title",
        OLD."scope_description", OLD."category", OLD."expected_media_type", OLD."initial_delivery_days") THEN
      RAISE EXCEPTION 'TASK_ORDER_TERMS_IMMUTABLE' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;

  IF num_nonnulls(NEW."gig_id", NEW."proposal_id") <> 1 THEN
    RETURN NEW; -- lo rechaza chk_task_order_single_origin
  END IF;

  IF NEW."proposal_id" IS NOT NULL THEN
    SELECT p."status" = 'AGREED_PATH_1'
       AND p."buyer_id" = NEW."buyer_id"
       AND p."freelancer_id" = NEW."seller_id"
       AND p."proposed_delivery_days" = NEW."initial_delivery_days"
       AND pub."category" = NEW."category"
       AND pub."expected_media_type" = NEW."expected_media_type"
      INTO v_ok
      FROM "negotiation_proposals" p
      JOIN "client_task_publications" pub ON pub."id" = p."publication_id"
     WHERE p."id" = NEW."proposal_id";
  ELSE
    SELECT g."seller_id" = NEW."seller_id"
       AND g."is_active"
       AND g."initial_delivery_days" = NEW."initial_delivery_days"
       AND g."category" = NEW."category"
       AND g."expected_media_type" = NEW."expected_media_type"
      INTO v_ok
      FROM "gigs" g
     WHERE g."id" = NEW."gig_id";
  END IF;

  IF v_ok IS NOT TRUE THEN
    RAISE EXCEPTION 'TASK_ORDER_ORIGIN_MISMATCH' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "trg_task_order_origin_guard"
  BEFORE INSERT OR UPDATE ON "task_orders"
  FOR EACH ROW EXECUTE FUNCTION "fn_task_order_origin_guard"();

-- Las wallets del ledger pertenecen a las partes de la orden y estÃ¡n verificadas;
-- las de plataforma tienen el rol correcto. Con origen propuesta, el total es el
-- presupuesto acordado. Al crear el ledger, todas deben estar activas.
CREATE OR REPLACE FUNCTION "fn_escrow_ledger_wallets_match"() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_order "task_orders"%ROWTYPE;
  v_ok boolean;
  v_require_active boolean := TG_OP = 'INSERT';
BEGIN
  SELECT * INTO v_order FROM "task_orders" WHERE "id" = NEW."task_order_id";

  SELECT bw."user_id" = v_order."buyer_id" AND bw."is_verified" AND (bw."is_active" OR NOT v_require_active)
     AND sw."user_id" = v_order."seller_id" AND sw."is_verified" AND (sw."is_active" OR NOT v_require_active)
    INTO v_ok
    FROM "user_wallets" bw, "user_wallets" sw
   WHERE bw."id" = NEW."buyer_wallet_id" AND sw."id" = NEW."seller_wallet_id";
  IF v_ok IS NOT TRUE THEN
    RAISE EXCEPTION 'ESCROW_PARTY_WALLET_MISMATCH' USING ERRCODE = 'check_violation';
  END IF;

  SELECT cw."role" = 'ESCROW_CUSTODY' AND (cw."is_active" OR NOT v_require_active)
     AND fw."role" = 'OWNER_FEE_COLLECTION' AND (fw."is_active" OR NOT v_require_active)
    INTO v_ok
    FROM "platform_wallets" cw, "platform_wallets" fw
   WHERE cw."id" = NEW."custody_wallet_id" AND fw."id" = NEW."owner_fee_wallet_id";
  IF v_ok IS NOT TRUE THEN
    RAISE EXCEPTION 'ESCROW_PLATFORM_WALLET_MISMATCH' USING ERRCODE = 'check_violation';
  END IF;

  IF v_order."proposal_id" IS NOT NULL THEN
    SELECT p."proposed_budget_usd_in_cents" = NEW."total_amount_usd_in_cents"
      INTO v_ok
      FROM "negotiation_proposals" p
     WHERE p."id" = v_order."proposal_id";
    IF v_ok IS NOT TRUE THEN
      RAISE EXCEPTION 'ESCROW_TOTAL_MISMATCH' USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "trg_escrow_ledger_wallets_match"
  BEFORE INSERT OR UPDATE OF "task_order_id", "buyer_wallet_id", "seller_wallet_id",
    "custody_wallet_id", "owner_fee_wallet_id", "total_amount_usd_in_cents"
  ON "escrow_ledgers"
  FOR EACH ROW EXECUTE FUNCTION "fn_escrow_ledger_wallets_match"();

-- El reloj es la Ãºnica fuente de verdad del plazo: su sujeto y su vencimiento no
-- cambian. Los relojes de entrega duran lo pactado en la orden o en la extensiÃ³n.
CREATE OR REPLACE FUNCTION "fn_timer_job_guard"() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_ok boolean;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF (NEW."task_order_id", NEW."deliverable_id", NEW."timer_type", NEW."started_at", NEW."expires_at")
       IS DISTINCT FROM
       (OLD."task_order_id", OLD."deliverable_id", OLD."timer_type", OLD."started_at", OLD."expires_at") THEN
      RAISE EXCEPTION 'TIMER_DEADLINE_IMMUTABLE' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW."deliverable_id" IS NOT NULL THEN
    SELECT d."task_order_id" = NEW."task_order_id" INTO v_ok
      FROM "task_deliverables" d WHERE d."id" = NEW."deliverable_id";
    IF v_ok IS NOT TRUE THEN
      RAISE EXCEPTION 'TIMER_DELIVERABLE_MISMATCH' USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  IF NEW."timer_type" = 'INITIAL_DELIVERY_7D' THEN
    SELECT NEW."expires_at" - NEW."started_at" = make_interval(days => o."initial_delivery_days")
      INTO v_ok FROM "task_orders" o WHERE o."id" = NEW."task_order_id";
  ELSIF NEW."timer_type" = 'EXTENDED_DELIVERY_UP_TO_7D' THEN
    SELECT e."status" = 'APPROVED_EXTRA_DAYS'
       AND NEW."expires_at" - NEW."started_at" = make_interval(days => e."requested_extra_days")
      INTO v_ok FROM "deadline_extension_requests" e WHERE e."task_order_id" = NEW."task_order_id";
  ELSE
    v_ok := true;
  END IF;
  IF v_ok IS NOT TRUE THEN
    RAISE EXCEPTION 'TIMER_DURATION_MISMATCH' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "trg_timer_job_guard"
  BEFORE INSERT OR UPDATE ON "scheduled_timer_jobs"
  FOR EACH ROW EXECUTE FUNCTION "fn_timer_job_guard"();

-- La revisiÃ³n n solo existe si la n-1 fue devuelta con REVISION_REQUESTED.
CREATE OR REPLACE FUNCTION "fn_deliverable_revision_sequence"() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."revision_number" > 0 AND NOT EXISTS (
    SELECT 1 FROM "task_deliverables" prev
     WHERE prev."task_order_id" = NEW."task_order_id"
       AND prev."revision_number" = NEW."revision_number" - 1
       AND prev."review_decision" = 'REVISION_REQUESTED'
  ) THEN
    RAISE EXCEPTION 'DELIVERABLE_REVISION_OUT_OF_SEQUENCE' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "trg_deliverable_revision_sequence"
  BEFORE INSERT ON "task_deliverables"
  FOR EACH ROW EXECUTE FUNCTION "fn_deliverable_revision_sequence"();

-- MVP: la IA solo audita entregas de Ã³rdenes de imagen o texto.
CREATE OR REPLACE FUNCTION "fn_ai_report_mvp_modality"() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "task_deliverables" d
      JOIN "task_orders" o ON o."id" = d."task_order_id"
     WHERE d."id" = NEW."deliverable_id"
       AND o."expected_media_type" IN ('IMAGE_RASTER_VECTOR', 'DOCUMENT_TEXT')
  ) THEN
    RAISE EXCEPTION 'AI_MODALITY_NOT_AUDITABLE_IN_MVP' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "trg_ai_report_mvp_modality"
  BEFORE INSERT OR UPDATE OF "deliverable_id" ON "ai_advisor_reports"
  FOR EACH ROW EXECUTE FUNCTION "fn_ai_report_mvp_modality"();

-- Cada criterio evaluado pertenece a la misma orden que la entrega auditada.
CREATE OR REPLACE FUNCTION "fn_ai_criterion_same_order"() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "ai_advisor_reports" r
      JOIN "task_deliverables" d ON d."id" = r."deliverable_id"
      JOIN "task_acceptance_criteria" c ON c."task_order_id" = d."task_order_id"
     WHERE r."id" = NEW."ai_report_id" AND c."id" = NEW."criterion_id"
  ) THEN
    RAISE EXCEPTION 'AI_CRITERION_ORDER_MISMATCH' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "trg_ai_criterion_same_order"
  BEFORE INSERT OR UPDATE OF "ai_report_id", "criterion_id" ON "ai_criterion_evaluations"
  FOR EACH ROW EXECUTE FUNCTION "fn_ai_criterion_same_order"();

-- ============================================================================
-- 7. VISTAS: VALORES DERIVADOS (NO SE ALMACENAN)
-- ============================================================================

CREATE OR REPLACE VIEW "v_task_order_revision_usage" AS
SELECT
  o."id" AS "task_order_id",
  count(d."id") FILTER (WHERE d."review_decision" = 'REVISION_REQUESTED')::int AS "revisions_used",
  2 AS "max_revisions_allowed",
  (2 - count(d."id") FILTER (WHERE d."review_decision" = 'REVISION_REQUESTED'))::int AS "revisions_remaining"
FROM "task_orders" o
LEFT JOIN "task_deliverables" d ON d."task_order_id" = o."id"
GROUP BY o."id";

CREATE OR REPLACE VIEW "v_task_order_active_deadline" AS
SELECT
  t."task_order_id",
  t."id" AS "timer_job_id",
  t."timer_type",
  t."deliverable_id",
  t."started_at",
  t."expires_at"
FROM "scheduled_timer_jobs" t
WHERE t."status" = 'SCHEDULED';

CREATE OR REPLACE VIEW "v_escrow_ledger_settlement" AS
SELECT
  l."id" AS "escrow_ledger_id",
  l."task_order_id",
  l."status",
  COALESCE(bool_or(tx."operation_type" = 'ESCROW_LOCK' AND tx."status" = 'COMPLETED'), false) AS "lock_completed",
  COALESCE(bool_or(tx."operation_type" = 'FREELANCER_PAYOUT_96' AND tx."status" = 'COMPLETED'), false) AS "payout_96_completed",
  COALESCE(bool_or(tx."operation_type" = 'PLATFORM_FEE_PAYOUT_4' AND tx."status" = 'COMPLETED'), false) AS "fee_4_completed",
  COALESCE(bool_or(tx."operation_type" = 'BUYER_REFUND_100' AND tx."status" = 'COMPLETED'), false) AS "refund_100_completed"
FROM "escrow_ledgers" l
LEFT JOIN "open_payments_transactions" tx ON tx."escrow_ledger_id" = l."id"
GROUP BY l."id", l."task_order_id", l."status";

CREATE OR REPLACE VIEW "v_seller_profile_stats" AS
SELECT
  sp."user_id" AS "seller_id",
  (SELECT count(*) FROM "task_orders" o
    WHERE o."seller_id" = sp."user_id" AND o."lifecycle_status" = 'COMPLETED')::int AS "completed_orders_count",
  (SELECT round(avg(r."advisory_score"), 2)
     FROM "ai_advisor_reports" r
     JOIN "task_deliverables" d ON d."id" = r."deliverable_id"
     JOIN "task_orders" o ON o."id" = d."task_order_id"
    WHERE o."seller_id" = sp."user_id") AS "ai_advisory_score_avg"
FROM "seller_profiles" sp;
