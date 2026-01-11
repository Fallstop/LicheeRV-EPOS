ALTER TABLE `transactions` ADD `merchant_logo` text;--> statement-breakpoint
ALTER TABLE `transactions` ADD `card_suffix` text;--> statement-breakpoint
ALTER TABLE `transactions` ADD `other_account` text;--> statement-breakpoint
ALTER TABLE `user` ADD `card_suffix` text;--> statement-breakpoint
ALTER TABLE `user` ADD `matching_name` text;