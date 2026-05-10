ALTER TYPE "public"."audit_action" ADD VALUE 'payment_recorded';--> statement-breakpoint
ALTER TYPE "public"."audit_entity" ADD VALUE 'invoice';--> statement-breakpoint
ALTER TYPE "public"."audit_entity" ADD VALUE 'invoice_settings';