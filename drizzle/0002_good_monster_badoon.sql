CREATE TYPE "public"."notification_priority" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('UNREAD', 'READ', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('BUDGET_ALERT', 'RECURRING_REMINDER', 'FINANCIAL_GOAL', 'LOW_BALANCE', 'MONTHLY_SUMMARY', 'EXPENSE_LIMIT', 'CATEGORY_BUDGET', 'UNUSUAL_SPENDING');--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"status" "notification_status" DEFAULT 'UNREAD' NOT NULL,
	"priority" "notification_priority" DEFAULT 'MEDIUM' NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"data" jsonb,
	"is_actionable" boolean DEFAULT false NOT NULL,
	"action_url" text,
	"read_at" timestamp,
	"archived_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;