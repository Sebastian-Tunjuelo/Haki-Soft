-- SPEC-07: permitir fila pendiente de upload (file_size_bytes = 0) solo mientras
-- preview_status = PENDING_PROCESSING. El complete() sigue exigiendo bytes > 0.
ALTER TABLE "task_deliverables" DROP CONSTRAINT IF EXISTS "chk_deliverable_file_integrity";

ALTER TABLE "task_deliverables"
  ADD CONSTRAINT "chk_deliverable_file_integrity"
  CHECK (
    "sha256_checksum" ~ '^[0-9a-f]{64}$'
    AND (
      "file_size_bytes" > 0
      OR "preview_status" = 'PENDING_PROCESSING'
    )
  );
