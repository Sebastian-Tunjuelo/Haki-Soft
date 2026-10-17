-- Chat post-aceptación entre contratador y emprendedor (adelanto workspace).
CREATE TABLE IF NOT EXISTS "task_order_chat_messages" (
    "id" UUID NOT NULL,
    "task_order_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "attachment_file_name" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_order_chat_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "task_order_chat_messages_task_order_id_created_at_idx"
  ON "task_order_chat_messages"("task_order_id", "created_at");

ALTER TABLE "task_order_chat_messages"
  ADD CONSTRAINT "task_order_chat_messages_task_order_id_fkey"
  FOREIGN KEY ("task_order_id") REFERENCES "task_orders"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "task_order_chat_messages"
  ADD CONSTRAINT "task_order_chat_messages_sender_id_fkey"
  FOREIGN KEY ("sender_id") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
