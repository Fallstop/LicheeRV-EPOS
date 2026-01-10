CREATE TABLE `payment_schedules` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`weekly_amount` real NOT NULL,
	`start_date` integer NOT NULL,
	`end_date` integer,
	`notes` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `system_state` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`akahu_id` text NOT NULL,
	`date` integer NOT NULL,
	`amount` real NOT NULL,
	`description` text NOT NULL,
	`merchant` text,
	`category` text,
	`raw_data` text NOT NULL,
	`matched_user_id` text,
	`match_type` text,
	`match_confidence` real,
	`created_at` integer,
	FOREIGN KEY (`matched_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `transactions_akahu_id_unique` ON `transactions` (`akahu_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`bank_account_pattern` text,
	`role` text DEFAULT 'user' NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);