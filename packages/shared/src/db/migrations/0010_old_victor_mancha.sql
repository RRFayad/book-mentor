CREATE TYPE "public"."mentor_answer_status" AS ENUM('streaming', 'complete', 'stopped', 'error');--> statement-breakpoint
CREATE TYPE "public"."message_role" AS ENUM('user', 'mentor');--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY NOT NULL,
	"conversation_id" uuid NOT NULL,
	"role" "message_role" NOT NULL,
	"text" text,
	"parts" jsonb,
	"citations" jsonb,
	"status" "mentor_answer_status",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "messages_conversation_id_created_at_idx" ON "messages" USING btree ("conversation_id","created_at");