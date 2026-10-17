-- Confirmación del Freelancer antes del fondeo (aceptación mutua en Gig fijo).
ALTER TABLE "task_orders" ADD COLUMN IF NOT EXISTS "seller_confirmed_at" TIMESTAMP(3);
