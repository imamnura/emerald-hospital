CREATE INDEX "bookings_doctor_id_idx" ON "bookings" USING btree ("doctor_id");--> statement-breakpoint
CREATE INDEX "bookings_created_at_idx" ON "bookings" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "doctor_schedules_doctor_id_idx" ON "doctor_schedules" USING btree ("doctor_id");--> statement-breakpoint
CREATE INDEX "doctors_hospital_id_idx" ON "doctors" USING btree ("hospital_id");--> statement-breakpoint
CREATE INDEX "doctors_specialist_id_idx" ON "doctors" USING btree ("specialist_id");--> statement-breakpoint
CREATE INDEX "payment_cards_user_id_idx" ON "payment_cards" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "payment_transactions_card_id_idx" ON "payment_transactions" USING btree ("card_id");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");