-- SPEC-02: el hash GNAP necesita el nonce que devuelve el auth server.
ALTER TABLE "wallet_verification_challenges"
  ADD COLUMN "finish_nonce" TEXT NOT NULL DEFAULT '';

ALTER TABLE "wallet_verification_challenges"
  ALTER COLUMN "finish_nonce" DROP DEFAULT;
