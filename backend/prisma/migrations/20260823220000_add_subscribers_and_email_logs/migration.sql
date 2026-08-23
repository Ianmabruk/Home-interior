-- CreateTable: subscribers
CREATE TABLE IF NOT EXISTS "subscribers" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "subscribed" BOOLEAN NOT NULL DEFAULT true,
    "unsubscribe_token" TEXT,
    "source" TEXT DEFAULT 'website',
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable: email_logs
CREATE TABLE IF NOT EXISTS "email_logs" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "recipient_name" TEXT,
    "email_type" TEXT NOT NULL,
    "order_id" TEXT,
    "subject" TEXT,
    "provider" TEXT,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "message_id" TEXT,
    "failure_reason" TEXT,
    "sent_at" TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex: subscribers
CREATE UNIQUE INDEX IF NOT EXISTS "subscribers_email_key" ON "subscribers"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "subscribers_unsubscribe_token_key" ON "subscribers"("unsubscribe_token");
CREATE INDEX IF NOT EXISTS "subscribers_email_idx" ON "subscribers"("email");
CREATE INDEX IF NOT EXISTS "subscribers_subscribed_idx" ON "subscribers"("subscribed");

-- CreateIndex: email_logs
CREATE UNIQUE INDEX IF NOT EXISTS "email_logs_event_id_key" ON "email_logs"("event_id");
CREATE INDEX IF NOT EXISTS "email_logs_event_id_idx" ON "email_logs"("event_id");
CREATE INDEX IF NOT EXISTS "email_logs_email_type_created_at_idx" ON "email_logs"("email_type", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "email_logs_order_id_idx" ON "email_logs"("order_id");
CREATE INDEX IF NOT EXISTS "email_logs_recipient_idx" ON "email_logs"("recipient");

-- Backfill tracking numbers for existing orders that have none (Phase 20).
-- Idempotent: only fills rows where tracking_number IS NULL or empty.
-- Generates HOK-<year>-<6-char> codes, retrying to guarantee uniqueness.
DO $$
DECLARE
    r RECORD;
    prefix TEXT := 'HOK-' || EXTRACT(YEAR FROM NOW())::TEXT || '-';
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    candidate TEXT;
    i INT;
    tries INT;
BEGIN
    FOR r IN
        SELECT id, "tracking_number" AS tn
        FROM orders
        WHERE "tracking_number" IS NULL OR "tracking_number" = ''
        ORDER BY id
    LOOP
        tries := 0;
        LOOP
            candidate := prefix;
            FOR i IN 1..6 LOOP
                candidate := candidate || substr(chars, floor(random() * length(chars))::INT + 1, 1);
            END LOOP;
            -- ensure uniqueness against any existing value
            EXIT WHEN NOT EXISTS (SELECT 1 FROM orders WHERE "tracking_number" = candidate);
            tries := tries + 1;
            IF tries > 25 THEN
                RAISE WARNING 'Could not generate unique tracking number for order %', r.id;
                candidate := prefix || 'DLPY' || substr(md5(random()::text), 0, 3);
                EXIT;
            END IF;
        END LOOP;
        UPDATE orders
           SET "tracking_number" = candidate,
               "updated_at" = NOW()
         WHERE id = r.id;
    END LOOP;
END $$;
