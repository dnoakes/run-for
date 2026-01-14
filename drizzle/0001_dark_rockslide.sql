ALTER TABLE `cause` RENAME TO `causes`;--> statement-breakpoint
CREATE TABLE `pledge_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`cause_id` text NOT NULL,
	`percentage` integer NOT NULL,
	`is_enabled` integer DEFAULT true NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`cause_id`) REFERENCES `causes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_causes` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`is_global` integer DEFAULT false NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`target_miles` integer NOT NULL,
	`current_miles` integer DEFAULT 0 NOT NULL,
	`image_url` text,
	`verification_status` text DEFAULT 'pending',
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_causes`("id", "user_id", "is_global", "title", "description", "target_miles", "current_miles", "image_url", "verification_status", "created_at") SELECT "id", "user_id", "is_global", "title", "description", "target_miles", "current_miles", "image_url", "verification_status", "created_at" FROM `causes`;--> statement-breakpoint
DROP TABLE `causes`;--> statement-breakpoint
ALTER TABLE `__new_causes` RENAME TO `causes`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_ledger` (
	`id` text PRIMARY KEY NOT NULL,
	`activity_id` text NOT NULL,
	`cause_id` text NOT NULL,
	`userId` text NOT NULL,
	`miles_applied` integer NOT NULL,
	`applied_at` integer,
	FOREIGN KEY (`activity_id`) REFERENCES `activity`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`cause_id`) REFERENCES `causes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_ledger`("id", "activity_id", "cause_id", "userId", "miles_applied", "applied_at") SELECT "id", "activity_id", "cause_id", "userId", "miles_applied", "applied_at" FROM `ledger`;--> statement-breakpoint
DROP TABLE `ledger`;--> statement-breakpoint
ALTER TABLE `__new_ledger` RENAME TO `ledger`;