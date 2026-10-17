-- Storefront page document + gallery media (SPEC-04 extensión)

ALTER TABLE "gigs" ADD COLUMN "page_document_json" JSONB NOT NULL DEFAULT '{"version":1,"blocks":[{"type":"hero","title":"Servicio"},{"type":"profile","displayName":"Usuario","headline":null,"avatarUrl":null},{"type":"about","html":"<p></p>"},{"type":"serviceMeta"},{"type":"gallery","mediaIds":[]},{"type":"links","items":[]},{"type":"body","html":"<p></p>"}]}';

ALTER TABLE "client_task_publications" ADD COLUMN "page_document_json" JSONB NOT NULL DEFAULT '{"version":1,"blocks":[{"type":"hero","title":"Publicación"},{"type":"profile","displayName":"Usuario","headline":null,"avatarUrl":null},{"type":"about","html":"<p></p>"},{"type":"serviceMeta"},{"type":"gallery","mediaIds":[]},{"type":"links","items":[]},{"type":"body","html":"<p></p>"}]}';

CREATE TYPE "MarketplaceMediaEntityType" AS ENUM ('GIG', 'PUBLICATION');

CREATE TABLE "marketplace_media_assets" (
    "id" UUID NOT NULL,
    "owner_user_id" UUID NOT NULL,
    "entity_type" "MarketplaceMediaEntityType" NOT NULL,
    "entity_id" UUID NOT NULL,
    "mime_type" VARCHAR(64) NOT NULL,
    "byte_size" INTEGER NOT NULL,
    "storage_path" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_media_assets_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "marketplace_media_assets_entity_type_entity_id_idx" ON "marketplace_media_assets"("entity_type", "entity_id");
CREATE INDEX "marketplace_media_assets_owner_user_id_idx" ON "marketplace_media_assets"("owner_user_id");

ALTER TABLE "marketplace_media_assets" ADD CONSTRAINT "marketplace_media_assets_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
