-- Reemplaza la identidad de Clerk por un hash de contraseña local.
DROP INDEX IF EXISTS "users_clerk_id_key";
ALTER TABLE "users" DROP COLUMN IF EXISTS "clerk_id";
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_hash" TEXT NOT NULL DEFAULT '';
ALTER TABLE "users" ALTER COLUMN "password_hash" DROP DEFAULT;
