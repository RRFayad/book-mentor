ALTER TABLE "subscriptions" ADD COLUMN "stripe_event_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "stripe_event_created_at" timestamp NOT NULL;