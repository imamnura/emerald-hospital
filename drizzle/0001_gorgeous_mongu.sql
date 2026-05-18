CREATE TYPE "public"."card_brand" AS ENUM('visa', 'mastercard');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'other');--> statement-breakpoint
CREATE TYPE "public"."insurance_status" AS ENUM('ACTIVE', 'INACTIVE');--> statement-breakpoint
CREATE TYPE "public"."medical_record_type" AS ENUM('lab', 'imaging', 'clinical');--> statement-breakpoint
CREATE TABLE "insurance_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider_name" varchar(100) NOT NULL,
	"plan_name" varchar(100) NOT NULL,
	"member_id" varchar(50) NOT NULL,
	"group_no" varchar(50),
	"plan_type" varchar(50),
	"coverage_start" date NOT NULL,
	"coverage_end" date NOT NULL,
	"status" "insurance_status" DEFAULT 'ACTIVE' NOT NULL,
	"cost_pcp" numeric(10, 2),
	"cost_specialist" numeric(10, 2),
	"cost_emergency" numeric(10, 2),
	"cost_rx" numeric(10, 2),
	"provider_phone" varchar(30),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medical_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"facility" varchar(255) NOT NULL,
	"type" "medical_record_type" NOT NULL,
	"record_date" date NOT NULL,
	"file_url" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"brand" "card_brand" NOT NULL,
	"last4" varchar(4) NOT NULL,
	"expires" varchar(5) NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"card_id" uuid,
	"booking_id" uuid,
	"title" varchar(255) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"paid_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "doctors" ADD COLUMN "review_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "doctors" ADD COLUMN "consultation_fee" numeric(10, 2) DEFAULT '150' NOT NULL;--> statement-breakpoint
ALTER TABLE "doctors" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "blood_type" varchar(4);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "date_of_birth" date;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "gender" "gender";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "insurance_profiles" ADD CONSTRAINT "insurance_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_cards" ADD CONSTRAINT "payment_cards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_card_id_payment_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."payment_cards"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "insurance_user_unique" ON "insurance_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "medical_records_user_date_idx" ON "medical_records" USING btree ("user_id","record_date");--> statement-breakpoint
CREATE INDEX "payment_tx_user_date_idx" ON "payment_transactions" USING btree ("user_id","paid_at");--> statement-breakpoint
CREATE INDEX "bookings_slot_idx" ON "bookings" USING btree ("schedule_id","appointment_date","appointment_time","status");--> statement-breakpoint
CREATE INDEX "bookings_user_date_idx" ON "bookings" USING btree ("user_id","appointment_date");