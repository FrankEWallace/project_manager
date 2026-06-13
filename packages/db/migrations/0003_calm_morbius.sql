ALTER TYPE "public"."audit_entity" ADD VALUE 'category';--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;