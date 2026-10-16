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
