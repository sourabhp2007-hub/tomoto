CREATE TABLE `inquiries` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`message` text NOT NULL,
	`requested_slot` text,
	`created` text NOT NULL,
	`status` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `workspaces` (
	`owner` text PRIMARY KEY NOT NULL,
	`version` integer NOT NULL,
	`document` text NOT NULL
);
