CREATE TABLE `ai_interactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`moduleId` varchar(32) NOT NULL,
	`activity` varchar(120) NOT NULL,
	`question` text NOT NULL,
	`response` text NOT NULL,
	`result` varchar(32) NOT NULL,
	`score` int NOT NULL DEFAULT 0,
	`feedback` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_interactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `evaluations` MODIFY COLUMN `type` enum('diagnostic','module','final','pretest','postest') NOT NULL;--> statement-breakpoint
ALTER TABLE `students` ADD `pretestAt` timestamp;--> statement-breakpoint
ALTER TABLE `students` ADD `startedAt` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `students` ADD `lastActivityAt` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `students` ADD `postestEnabledAt` timestamp;--> statement-breakpoint
ALTER TABLE `students` ADD `postestAt` timestamp;