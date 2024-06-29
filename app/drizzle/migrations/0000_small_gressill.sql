CREATE TABLE `currencies` (
	`currency_code` text PRIMARY KEY NOT NULL,
	`last_updated` integer NOT NULL,
	`rates` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `currencyCodes` (
	`id` text PRIMARY KEY NOT NULL,
	`currency_codes` text DEFAULT '[]' NOT NULL,
	`last_updated` integer NOT NULL
);
