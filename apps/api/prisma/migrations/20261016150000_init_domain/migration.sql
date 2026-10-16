-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserActiveMode" AS ENUM ('BUYER', 'SELLER');

-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "WalletVerificationStatus" AS ENUM ('PENDING_REDIRECT', 'VERIFIED', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "TaskCategory" AS ENUM ('DIGITAL_MARKETING', 'GRAPHICS_AND_DESIGN', 'PROGRAMMING_AND_TECH', 'TECHNICAL_WRITING_TRANS', 'VIDEO_AND_ANIMATION', 'MUSIC_AND_AUDIO');

-- CreateEnum
CREATE TYPE "DeliverableMediaType" AS ENUM ('IMAGE_RASTER_VECTOR', 'DOCUMENT_TEXT', 'CODE_ARCHIVE', 'DATA_CAMPAIGN', 'VIDEO_STREAM', 'AUDIO_TRACK');

-- CreateEnum
CREATE TYPE "MvpAiAuditableModality" AS ENUM ('IMAGE', 'TEXT');

-- CreateEnum
CREATE TYPE "PublicationStatus" AS ENUM ('OPEN_FOR_PROPOSALS', 'AGREED_AND_LOCKED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NegotiationProposalStatus" AS ENUM ('IN_NEGOTIATION', 'AGREED_PATH_1', 'DISCREPANCY_CLOSED_PATH_2');

-- CreateEnum
CREATE TYPE "TaskLifecycleStatus" AS ENUM ('PENDING_ESCROW_FUNDING', 'ESCROW_LOCKED', 'EXTENSION_REQUESTED', 'ESCROW_EXTENDED', 'IN_REVIEW', 'REVISION_REQUESTED', 'FINAL_CLAIM_WINDOW_30M', 'DISPUTED', 'COMPLETED', 'REFUNDED', 'AUTO_REFUNDED_INITIAL_EXPIRED', 'AUTO_REFUNDED_BY_TIMEOUT', 'AUTO_REFUNDED_EXTENDED_EXPIRED');

-- CreateEnum
CREATE TYPE "ExtensionRequestStatus" AS ENUM ('PENDING_BUYER_DECISION', 'APPROVED_EXTRA_DAYS', 'REJECTED_REFUND_REQUESTED', 'REJECTED_BY_TIMEOUT_AUTO_REFUNDED');

-- CreateEnum
CREATE TYPE "EscrowLedgerStatus" AS ENUM ('AWAITING_FUNDS', 'FUNDS_LOCKED', 'RELEASED_96_4', 'REFUNDED_100');

-- CreateEnum
CREATE TYPE "OpenPaymentsOperationType" AS ENUM ('ESCROW_LOCK', 'FREELANCER_PAYOUT_96', 'PLATFORM_FEE_PAYOUT_4', 'BUYER_REFUND_100');

-- CreateEnum
CREATE TYPE "OpenPaymentsTxStatus" AS ENUM ('PENDING_INTERACTION', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PreviewProcessingStatus" AS ENUM ('PENDING_PROCESSING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "AiAdvisoryLabel" AS ENUM ('HIGH_COMPLIANCE', 'PARTIAL_COMPLIANCE', 'LOW_COMPLIANCE');

-- CreateEnum
CREATE TYPE "CriterionEvalStatus" AS ENUM ('MET', 'PARTIALLY_MET', 'NOT_MET', 'REQUIRES_HUMAN_VERIFICATION');

-- CreateEnum
CREATE TYPE "DisputeOriginType" AS ENUM ('BUYER_MEDIATION_AFTER_2ND_REVISION', 'FINAL_30M_CLAIM_WINDOW');

-- CreateEnum
CREATE TYPE "AdminBinaryResolution" AS ENUM ('PENDING', 'BUYER_FULL_REFUND_100', 'SELLER_RELEASE_96_4');

-- CreateEnum
CREATE TYPE "TimerJobType" AS ENUM ('INITIAL_DELIVERY_7D', 'EXTENSION_RESPONSE_24H', 'EXTENDED_DELIVERY_UP_TO_7D', 'DELIVERY_REVIEW_32H', 'FINAL_CLAIM_WINDOW_30M');

-- CreateEnum
CREATE TYPE "TimerJobStatus" AS ENUM ('SCHEDULED', 'EXECUTED', 'CANCELLED_BY_ACTION', 'SUSPENDED_BY_DISPUTE', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "clerk_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "display_name" VARCHAR(100) NOT NULL,
    "avatar_url" TEXT,
    "country_code" CHAR(2) NOT NULL,
    "active_mode" "UserActiveMode" NOT NULL DEFAULT 'BUYER',
    "platform_role" "PlatformRole" NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seller_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "headline" VARCHAR(140) NOT NULL,
    "bio" TEXT NOT NULL,
    "skills" TEXT[],
    "languages" TEXT[],
    "web_monetization_enabled" BOOLEAN NOT NULL DEFAULT true,
    "rating_avg" DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    "completed_orders_count" INTEGER NOT NULL DEFAULT 0,
    "ai_advisory_score_avg" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seller_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_wallets" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "wallet_address_url" TEXT NOT NULL,
    "asset_code" VARCHAR(6) NOT NULL,
    "asset_scale" INTEGER NOT NULL,
    "auth_server_url" TEXT NOT NULL,
    "resource_server_url" TEXT NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_verification_challenges" (
    "id" UUID NOT NULL,
    "wallet_id" UUID NOT NULL,
    "client_nonce" TEXT NOT NULL,
    "continue_uri" TEXT NOT NULL,
    "continue_access_token" TEXT NOT NULL,
    "interact_redirect_uri" TEXT NOT NULL,
    "interact_ref" TEXT,
    "received_hash" TEXT,
    "status" "WalletVerificationStatus" NOT NULL DEFAULT 'PENDING_REDIRECT',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "wallet_verification_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gigs" (
    "id" UUID NOT NULL,
    "seller_id" UUID NOT NULL,
    "category" "TaskCategory" NOT NULL,
    "expected_media_type" "DeliverableMediaType" NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "description" TEXT NOT NULL,
    "price_usd_in_cents" INTEGER NOT NULL,
    "initial_delivery_days" INTEGER NOT NULL DEFAULT 7,
    "default_criteria_json" JSONB NOT NULL,
    "allowed_extensions" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gigs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_task_publications" (
    "id" UUID NOT NULL,
    "buyer_id" UUID NOT NULL,
    "category" "TaskCategory" NOT NULL,
    "expected_media_type" "DeliverableMediaType" NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "description" TEXT NOT NULL,
    "initial_budget_usd_in_cents" INTEGER NOT NULL,
    "initial_delivery_days" INTEGER NOT NULL DEFAULT 7,
    "preliminary_criteria_json" JSONB NOT NULL,
    "allowed_extensions" TEXT[],
    "status" "PublicationStatus" NOT NULL DEFAULT 'OPEN_FOR_PROPOSALS',
    "republish_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_task_publications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "negotiation_proposals" (
    "id" UUID NOT NULL,
    "publication_id" UUID NOT NULL,
    "buyer_id" UUID NOT NULL,
    "freelancer_id" UUID NOT NULL,
    "initial_budget_usd_in_cents" INTEGER NOT NULL,
    "proposed_budget_usd_in_cents" INTEGER NOT NULL,
    "status" "NegotiationProposalStatus" NOT NULL DEFAULT 'IN_NEGOTIATION',
    "closed_reason" VARCHAR(250),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "closed_at" TIMESTAMP(3),

    CONSTRAINT "negotiation_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "negotiation_messages" (
    "id" UUID NOT NULL,
    "proposal_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "message_text" TEXT NOT NULL,
    "offered_amount_usd_in_cents" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "negotiation_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_orders" (
    "id" UUID NOT NULL,
    "buyer_id" UUID NOT NULL,
    "seller_id" UUID NOT NULL,
    "buyer_wallet_id" UUID NOT NULL,
    "seller_wallet_id" UUID NOT NULL,
    "publication_id" UUID,
    "proposal_id" UUID,
    "gig_id" UUID,
    "title" VARCHAR(120) NOT NULL,
    "scope_description" TEXT NOT NULL,
    "category" "TaskCategory" NOT NULL,
    "expected_media_type" "DeliverableMediaType" NOT NULL,
    "ai_auditable_modality" "MvpAiAuditableModality",
    "lifecycle_status" "TaskLifecycleStatus" NOT NULL DEFAULT 'PENDING_ESCROW_FUNDING',
    "total_amount_usd_in_cents" INTEGER NOT NULL,
    "freelancer_payout_usd_in_cents" INTEGER NOT NULL,
    "platform_fee_usd_in_cents" INTEGER NOT NULL,
    "buyer_origin_currency" VARCHAR(6) NOT NULL,
    "seller_target_currency" VARCHAR(6) NOT NULL,
    "initial_delivery_days" INTEGER NOT NULL DEFAULT 7,
    "review_window_hours" INTEGER NOT NULL DEFAULT 32,
    "final_claim_window_minutes" INTEGER NOT NULL DEFAULT 30,
    "max_revisions_allowed" INTEGER NOT NULL DEFAULT 2,
    "revisions_used" INTEGER NOT NULL DEFAULT 0,
    "extension_granted_days" INTEGER NOT NULL DEFAULT 0,
    "escrow_locked_at" TIMESTAMP(3),
    "initial_delivery_deadline_at" TIMESTAMP(3),
    "extended_delivery_deadline_at" TIMESTAMP(3),
    "current_review_started_at" TIMESTAMP(3),
    "current_review_expires_at" TIMESTAMP(3),
    "final_claim_window_started_at" TIMESTAMP(3),
    "final_claim_window_expires_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "refunded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_acceptance_criteria" (
    "id" UUID NOT NULL,
    "task_order_id" UUID NOT NULL,
    "criterion_code" VARCHAR(32) NOT NULL,
    "description" VARCHAR(350) NOT NULL,
    "is_mandatory" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "task_acceptance_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_technical_constraints" (
    "task_order_id" UUID NOT NULL,
    "allowed_extensions" TEXT[],
    "max_file_size_bytes" BIGINT,
    "min_word_count" INTEGER,
    "min_width_px" INTEGER,
    "min_height_px" INTEGER,
    "min_duration_seconds" INTEGER,
    "max_duration_seconds" INTEGER,

    CONSTRAINT "task_technical_constraints_pkey" PRIMARY KEY ("task_order_id")
);

-- CreateTable
CREATE TABLE "deadline_extension_requests" (
    "id" UUID NOT NULL,
    "task_order_id" UUID NOT NULL,
    "requested_by_id" UUID NOT NULL,
    "requested_extra_days" INTEGER NOT NULL,
    "reason" VARCHAR(500) NOT NULL,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "buyer_decision_deadline_at" TIMESTAMP(3) NOT NULL,
    "responded_at" TIMESTAMP(3),
    "status" "ExtensionRequestStatus" NOT NULL DEFAULT 'PENDING_BUYER_DECISION',

    CONSTRAINT "deadline_extension_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escrow_ledgers" (
    "id" UUID NOT NULL,
    "task_order_id" UUID NOT NULL,
    "escrow_wallet_address" TEXT NOT NULL DEFAULT 'https://ilp.interledger-test.dev/taskstream-escrow',
    "platform_owner_wallet_address" TEXT NOT NULL,
    "locked_amount_usd_in_cents" INTEGER NOT NULL DEFAULT 0,
    "released_to_seller_usd_in_cents" INTEGER NOT NULL DEFAULT 0,
    "platform_fee_paid_out_in_cents" INTEGER NOT NULL DEFAULT 0,
    "refunded_to_buyer_usd_in_cents" INTEGER NOT NULL DEFAULT 0,
    "status" "EscrowLedgerStatus" NOT NULL DEFAULT 'AWAITING_FUNDS',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "escrow_ledgers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "open_payments_transactions" (
    "id" UUID NOT NULL,
    "escrow_ledger_id" UUID NOT NULL,
    "task_order_id" UUID NOT NULL,
    "operation_type" "OpenPaymentsOperationType" NOT NULL,
    "attempt_number" INTEGER NOT NULL DEFAULT 1,
    "idempotency_key" TEXT NOT NULL,
    "incoming_payment_url" TEXT,
    "quote_url" TEXT,
    "outgoing_payment_url" TEXT,
    "grant_continue_uri" TEXT,
    "grant_continue_token" TEXT,
    "interact_redirect_uri" TEXT,
    "client_nonce" TEXT,
    "debit_amount_value" TEXT,
    "debit_asset_code" VARCHAR(6),
    "debit_asset_scale" INTEGER,
    "receive_amount_value" TEXT,
    "receive_asset_code" VARCHAR(6),
    "receive_asset_scale" INTEGER,
    "status" "OpenPaymentsTxStatus" NOT NULL DEFAULT 'PENDING_INTERACTION',
    "failure_reason" TEXT,
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "open_payments_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rafiki_webhook_events" (
    "id" UUID NOT NULL,
    "event_id" TEXT NOT NULL,
    "event_type" VARCHAR(80) NOT NULL,
    "resource_url" TEXT NOT NULL,
    "payload_json" JSONB NOT NULL,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rafiki_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_deliverables" (
    "id" UUID NOT NULL,
    "task_order_id" UUID NOT NULL,
    "revision_number" INTEGER NOT NULL,
    "original_r2_key" TEXT NOT NULL,
    "preview_r2_key" TEXT,
    "file_name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(120) NOT NULL,
    "file_extension" VARCHAR(20) NOT NULL,
    "file_size_bytes" BIGINT NOT NULL,
    "sha256_checksum" CHAR(64) NOT NULL,
    "preview_status" "PreviewProcessingStatus" NOT NULL DEFAULT 'PENDING_PROCESSING',
    "is_original_unlocked" BOOLEAN NOT NULL DEFAULT false,
    "buyer_revision_notes" TEXT,
    "review_started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "review_expires_at" TIMESTAMP(3) NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unlocked_at" TIMESTAMP(3),

    CONSTRAINT "task_deliverables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_advisor_reports" (
    "id" UUID NOT NULL,
    "deliverable_id" UUID NOT NULL,
    "task_order_id" UUID NOT NULL,
    "revision_evaluated" INTEGER NOT NULL,
    "auditable_modality" "MvpAiAuditableModality" NOT NULL,
    "advisory_score" INTEGER NOT NULL,
    "advisory_label" "AiAdvisoryLabel" NOT NULL,
    "executive_summary_for_buyer" VARCHAR(500) NOT NULL,
    "suggestions_for_freelancer" TEXT[],
    "prompt_injection_detected" BOOLEAN NOT NULL DEFAULT false,
    "empty_or_corrupted_file_detected" BOOLEAN NOT NULL DEFAULT false,
    "deterministic_check_passed" BOOLEAN NOT NULL DEFAULT true,
    "mandatory_disclaimer" TEXT NOT NULL DEFAULT 'Este informe es estrictamente consultivo para tareas de imagen y texto. El Consejero de IA nunca aprueba ni ejecuta pagos.',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_advisor_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_criterion_evaluations" (
    "id" UUID NOT NULL,
    "ai_report_id" UUID NOT NULL,
    "criterion_id" UUID NOT NULL,
    "status" "CriterionEvalStatus" NOT NULL,
    "evidence" VARCHAR(300) NOT NULL,

    CONSTRAINT "ai_criterion_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispute_cases" (
    "id" UUID NOT NULL,
    "task_order_id" UUID NOT NULL,
    "opened_by_id" UUID NOT NULL,
    "origin_type" "DisputeOriginType" NOT NULL,
    "claim_reason" TEXT NOT NULL,
    "freelancer_defense" TEXT,
    "admin_reviewer_id" UUID,
    "binary_resolution" "AdminBinaryResolution" NOT NULL DEFAULT 'PENDING',
    "resolution_justification" TEXT,
    "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "dispute_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_timer_jobs" (
    "id" UUID NOT NULL,
    "task_order_id" UUID NOT NULL,
    "timer_type" "TimerJobType" NOT NULL,
    "bullmq_job_id" TEXT NOT NULL,
    "scheduled_for" TIMESTAMP(3) NOT NULL,
    "status" "TimerJobStatus" NOT NULL DEFAULT 'SCHEDULED',
    "executed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scheduled_timer_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_clerk_id_key" ON "users"("clerk_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_country_code_idx" ON "users"("country_code");

-- CreateIndex
CREATE UNIQUE INDEX "seller_profiles_user_id_key" ON "seller_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_wallets_wallet_address_url_key" ON "user_wallets"("wallet_address_url");

-- CreateIndex
CREATE INDEX "user_wallets_user_id_is_active_idx" ON "user_wallets"("user_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_verification_challenges_client_nonce_key" ON "wallet_verification_challenges"("client_nonce");

-- CreateIndex
CREATE INDEX "wallet_verification_challenges_wallet_id_status_idx" ON "wallet_verification_challenges"("wallet_id", "status");

-- CreateIndex
CREATE INDEX "gigs_category_is_active_idx" ON "gigs"("category", "is_active");

-- CreateIndex
CREATE INDEX "gigs_seller_id_idx" ON "gigs"("seller_id");

-- CreateIndex
CREATE INDEX "client_task_publications_status_category_idx" ON "client_task_publications"("status", "category");

-- CreateIndex
CREATE INDEX "client_task_publications_buyer_id_idx" ON "client_task_publications"("buyer_id");

-- CreateIndex
CREATE INDEX "negotiation_proposals_publication_id_status_idx" ON "negotiation_proposals"("publication_id", "status");

-- CreateIndex
CREATE INDEX "negotiation_proposals_freelancer_id_status_idx" ON "negotiation_proposals"("freelancer_id", "status");

-- CreateIndex
CREATE INDEX "negotiation_messages_proposal_id_created_at_idx" ON "negotiation_messages"("proposal_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "task_orders_proposal_id_key" ON "task_orders"("proposal_id");

-- CreateIndex
CREATE INDEX "task_orders_buyer_id_lifecycle_status_idx" ON "task_orders"("buyer_id", "lifecycle_status");

-- CreateIndex
CREATE INDEX "task_orders_seller_id_lifecycle_status_idx" ON "task_orders"("seller_id", "lifecycle_status");

-- CreateIndex
CREATE INDEX "task_orders_lifecycle_status_idx" ON "task_orders"("lifecycle_status");

-- CreateIndex
CREATE UNIQUE INDEX "task_acceptance_criteria_task_order_id_criterion_code_key" ON "task_acceptance_criteria"("task_order_id", "criterion_code");

-- CreateIndex
CREATE UNIQUE INDEX "deadline_extension_requests_task_order_id_key" ON "deadline_extension_requests"("task_order_id");

-- CreateIndex
CREATE INDEX "deadline_extension_requests_status_buyer_decision_deadline__idx" ON "deadline_extension_requests"("status", "buyer_decision_deadline_at");

-- CreateIndex
CREATE UNIQUE INDEX "escrow_ledgers_task_order_id_key" ON "escrow_ledgers"("task_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "open_payments_transactions_idempotency_key_key" ON "open_payments_transactions"("idempotency_key");

-- CreateIndex
CREATE INDEX "open_payments_transactions_task_order_id_operation_type_idx" ON "open_payments_transactions"("task_order_id", "operation_type");

-- CreateIndex
CREATE INDEX "open_payments_transactions_status_idx" ON "open_payments_transactions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "rafiki_webhook_events_event_id_key" ON "rafiki_webhook_events"("event_id");

-- CreateIndex
CREATE INDEX "rafiki_webhook_events_event_type_processed_at_idx" ON "rafiki_webhook_events"("event_type", "processed_at");

-- CreateIndex
CREATE INDEX "task_deliverables_task_order_id_preview_status_idx" ON "task_deliverables"("task_order_id", "preview_status");

-- CreateIndex
CREATE UNIQUE INDEX "task_deliverables_task_order_id_revision_number_key" ON "task_deliverables"("task_order_id", "revision_number");

-- CreateIndex
CREATE UNIQUE INDEX "ai_advisor_reports_deliverable_id_key" ON "ai_advisor_reports"("deliverable_id");

-- CreateIndex
CREATE INDEX "ai_advisor_reports_task_order_id_revision_evaluated_idx" ON "ai_advisor_reports"("task_order_id", "revision_evaluated");

-- CreateIndex
CREATE UNIQUE INDEX "ai_criterion_evaluations_ai_report_id_criterion_id_key" ON "ai_criterion_evaluations"("ai_report_id", "criterion_id");

-- CreateIndex
CREATE UNIQUE INDEX "dispute_cases_task_order_id_key" ON "dispute_cases"("task_order_id");

-- CreateIndex
CREATE INDEX "dispute_cases_binary_resolution_idx" ON "dispute_cases"("binary_resolution");

-- CreateIndex
CREATE UNIQUE INDEX "scheduled_timer_jobs_bullmq_job_id_key" ON "scheduled_timer_jobs"("bullmq_job_id");

-- CreateIndex
CREATE INDEX "scheduled_timer_jobs_task_order_id_timer_type_status_idx" ON "scheduled_timer_jobs"("task_order_id", "timer_type", "status");

-- AddForeignKey
ALTER TABLE "seller_profiles" ADD CONSTRAINT "seller_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_wallets" ADD CONSTRAINT "user_wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_verification_challenges" ADD CONSTRAINT "wallet_verification_challenges_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "user_wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gigs" ADD CONSTRAINT "gigs_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_task_publications" ADD CONSTRAINT "client_task_publications_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negotiation_proposals" ADD CONSTRAINT "negotiation_proposals_publication_id_fkey" FOREIGN KEY ("publication_id") REFERENCES "client_task_publications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negotiation_proposals" ADD CONSTRAINT "negotiation_proposals_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negotiation_proposals" ADD CONSTRAINT "negotiation_proposals_freelancer_id_fkey" FOREIGN KEY ("freelancer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negotiation_messages" ADD CONSTRAINT "negotiation_messages_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "negotiation_proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negotiation_messages" ADD CONSTRAINT "negotiation_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_orders" ADD CONSTRAINT "task_orders_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_orders" ADD CONSTRAINT "task_orders_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_orders" ADD CONSTRAINT "task_orders_buyer_wallet_id_fkey" FOREIGN KEY ("buyer_wallet_id") REFERENCES "user_wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_orders" ADD CONSTRAINT "task_orders_seller_wallet_id_fkey" FOREIGN KEY ("seller_wallet_id") REFERENCES "user_wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_orders" ADD CONSTRAINT "task_orders_publication_id_fkey" FOREIGN KEY ("publication_id") REFERENCES "client_task_publications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_orders" ADD CONSTRAINT "task_orders_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "negotiation_proposals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_orders" ADD CONSTRAINT "task_orders_gig_id_fkey" FOREIGN KEY ("gig_id") REFERENCES "gigs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_acceptance_criteria" ADD CONSTRAINT "task_acceptance_criteria_task_order_id_fkey" FOREIGN KEY ("task_order_id") REFERENCES "task_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_technical_constraints" ADD CONSTRAINT "task_technical_constraints_task_order_id_fkey" FOREIGN KEY ("task_order_id") REFERENCES "task_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deadline_extension_requests" ADD CONSTRAINT "deadline_extension_requests_task_order_id_fkey" FOREIGN KEY ("task_order_id") REFERENCES "task_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deadline_extension_requests" ADD CONSTRAINT "deadline_extension_requests_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escrow_ledgers" ADD CONSTRAINT "escrow_ledgers_task_order_id_fkey" FOREIGN KEY ("task_order_id") REFERENCES "task_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "open_payments_transactions" ADD CONSTRAINT "open_payments_transactions_escrow_ledger_id_fkey" FOREIGN KEY ("escrow_ledger_id") REFERENCES "escrow_ledgers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "open_payments_transactions" ADD CONSTRAINT "open_payments_transactions_task_order_id_fkey" FOREIGN KEY ("task_order_id") REFERENCES "task_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_deliverables" ADD CONSTRAINT "task_deliverables_task_order_id_fkey" FOREIGN KEY ("task_order_id") REFERENCES "task_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_advisor_reports" ADD CONSTRAINT "ai_advisor_reports_deliverable_id_fkey" FOREIGN KEY ("deliverable_id") REFERENCES "task_deliverables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_advisor_reports" ADD CONSTRAINT "ai_advisor_reports_task_order_id_fkey" FOREIGN KEY ("task_order_id") REFERENCES "task_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_criterion_evaluations" ADD CONSTRAINT "ai_criterion_evaluations_ai_report_id_fkey" FOREIGN KEY ("ai_report_id") REFERENCES "ai_advisor_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_criterion_evaluations" ADD CONSTRAINT "ai_criterion_evaluations_criterion_id_fkey" FOREIGN KEY ("criterion_id") REFERENCES "task_acceptance_criteria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_cases" ADD CONSTRAINT "dispute_cases_task_order_id_fkey" FOREIGN KEY ("task_order_id") REFERENCES "task_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_cases" ADD CONSTRAINT "dispute_cases_opened_by_id_fkey" FOREIGN KEY ("opened_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_cases" ADD CONSTRAINT "dispute_cases_admin_reviewer_id_fkey" FOREIGN KEY ("admin_reviewer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_timer_jobs" ADD CONSTRAINT "scheduled_timer_jobs_task_order_id_fkey" FOREIGN KEY ("task_order_id") REFERENCES "task_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Domain CHECKs (SPEC-01)

-- Restricciones de dominio de SPEC-01.
-- Se aplican después del DDL generado por Prisma 6.
-- La fórmula de comisión replica taskboard.md §3 regla 8:
-- platform_fee = floor(total * 0.04) == (total * 4) / 100 en enteros no negativos.

ALTER TABLE "negotiation_proposals"
  ADD CONSTRAINT "chk_negotiation_proposed_le_initial"
  CHECK ("proposed_budget_usd_in_cents" > 0 AND "proposed_budget_usd_in_cents" <= "initial_budget_usd_in_cents");

ALTER TABLE "task_orders"
  ADD CONSTRAINT "chk_task_order_exact_96_4_split"
  CHECK (
    "total_amount_usd_in_cents" > 0
    AND "platform_fee_usd_in_cents" = (("total_amount_usd_in_cents" * 4) / 100)
    AND "freelancer_payout_usd_in_cents" = "total_amount_usd_in_cents" - "platform_fee_usd_in_cents"
  );

ALTER TABLE "task_orders"
  ADD CONSTRAINT "chk_task_order_global_rules"
  CHECK (
    "initial_delivery_days" >= 1 AND "initial_delivery_days" <= 7
    AND "review_window_hours" = 32
    AND "final_claim_window_minutes" = 30
    AND "max_revisions_allowed" = 2
    AND "revisions_used" >= 0 AND "revisions_used" <= 2
    AND "extension_granted_days" >= 0 AND "extension_granted_days" <= 7
  );

ALTER TABLE "task_orders"
  ADD CONSTRAINT "chk_task_order_single_origin"
  CHECK (
    ("gig_id" IS NOT NULL AND "publication_id" IS NULL AND "proposal_id" IS NULL)
    OR ("gig_id" IS NULL AND "publication_id" IS NOT NULL AND "proposal_id" IS NOT NULL)
  );

ALTER TABLE "deadline_extension_requests"
  ADD CONSTRAINT "chk_extension_days_1_to_7"
  CHECK ("requested_extra_days" >= 1 AND "requested_extra_days" <= 7);

ALTER TABLE "task_deliverables"
  ADD CONSTRAINT "chk_deliverable_revision_0_to_2"
  CHECK ("revision_number" >= 0 AND "revision_number" <= 2);

ALTER TABLE "dispute_cases"
  ADD CONSTRAINT "chk_dispute_justification_when_resolved"
  CHECK (
    "binary_resolution" = 'PENDING'
    OR ("resolution_justification" IS NOT NULL AND length(trim("resolution_justification")) >= 20)
  );

ALTER TABLE "gigs"
  ADD CONSTRAINT "chk_gig_price_and_days"
  CHECK ("price_usd_in_cents" > 0 AND "initial_delivery_days" >= 1 AND "initial_delivery_days" <= 7);

ALTER TABLE "client_task_publications"
  ADD CONSTRAINT "chk_publication_budget_and_days"
  CHECK ("initial_budget_usd_in_cents" > 0 AND "initial_delivery_days" >= 1 AND "initial_delivery_days" <= 7);

CREATE UNIQUE INDEX "user_wallets_one_active_per_user"
  ON "user_wallets" ("user_id")
  WHERE "is_active" = true;

ALTER TABLE "ai_advisor_reports"
  ADD CONSTRAINT "chk_ai_advisory_score_0_100"
  CHECK ("advisory_score" >= 0 AND "advisory_score" <= 100);

ALTER TABLE "task_technical_constraints"
  ADD CONSTRAINT "chk_mvp_unlimited_upload"
  CHECK ("max_file_size_bytes" IS NULL);
