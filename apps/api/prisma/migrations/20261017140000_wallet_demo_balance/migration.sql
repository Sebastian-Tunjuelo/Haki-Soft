-- Saldo demo para visualizar el flujo de dinero mientras el escrow Open Payments real no está cableado.
ALTER TABLE "user_wallets"
  ADD COLUMN IF NOT EXISTS "demo_balance_usd_in_cents" INTEGER NOT NULL DEFAULT 100000;
