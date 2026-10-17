-- Cancelación previa al fondeo (Buyer se arrepiente / Seller rechaza / timeout 24h).
ALTER TYPE "TaskLifecycleStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';
