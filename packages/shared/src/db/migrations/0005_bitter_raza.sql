CREATE TYPE "public"."source_kind" AS ENUM('book', 'blog');--> statement-breakpoint
CREATE TYPE "public"."source_state" AS ENUM('ingesting', 'ready');--> statement-breakpoint
CREATE TABLE "sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" integer NOT NULL,
	"kind" "source_kind" NOT NULL,
	"title" text NOT NULL,
	"author" text NOT NULL,
	"page_count" integer,
	"post_count" integer,
	"address" text,
	"state" "source_state" DEFAULT 'ingesting' NOT NULL,
	"ingestion_progress" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sources" ADD CONSTRAINT "sources_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sources_user_id_idx" ON "sources" USING btree ("user_id");