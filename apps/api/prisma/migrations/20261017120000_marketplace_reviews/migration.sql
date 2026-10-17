-- CreateTable
CREATE TABLE "marketplace_reviews" (
    "id" UUID NOT NULL,
    "entity_type" "MarketplaceMediaEntityType" NOT NULL,
    "entity_id" UUID NOT NULL,
    "reviewer_user_id" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "body" VARCHAR(1000) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_reviews_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "marketplace_reviews_rating_check" CHECK ("rating" >= 1 AND "rating" <= 5)
);

-- CreateIndex
CREATE INDEX "marketplace_reviews_entity_type_entity_id_idx" ON "marketplace_reviews"("entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_reviews_entity_type_entity_id_reviewer_user_id_key" ON "marketplace_reviews"("entity_type", "entity_id", "reviewer_user_id");

-- AddForeignKey
ALTER TABLE "marketplace_reviews" ADD CONSTRAINT "marketplace_reviews_reviewer_user_id_fkey" FOREIGN KEY ("reviewer_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
