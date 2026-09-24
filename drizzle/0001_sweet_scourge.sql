CREATE TABLE `activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`activity` varchar(120) NOT NULL,
	`response` text NOT NULL,
	`result` varchar(32) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `challenges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`challenge` varchar(120) NOT NULL,
	`score` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `challenges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evaluations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`type` enum('diagnostic','module','final') NOT NULL,
	`moduleId` varchar(32),
	`score` int NOT NULL,
	`total` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `evaluations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `module_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`moduleId` varchar(32) NOT NULL,
	`percentage` int NOT NULL DEFAULT 0,
	`status` enum('locked','available','in_progress','completed') NOT NULL DEFAULT 'available',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `module_progress_id` PRIMARY KEY(`id`),
	CONSTRAINT `student_module_unique` UNIQUE(`studentId`,`moduleId`)
);
--> statement-breakpoint
CREATE TABLE `schools` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(32) NOT NULL,
	`name` varchar(160) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `schools_id` PRIMARY KEY(`id`),
	CONSTRAINT `schools_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `students` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(32) NOT NULL,
	`grade` varchar(24) NOT NULL,
	`section` varchar(8) NOT NULL,
	`schoolName` varchar(160),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `students_id` PRIMARY KEY(`id`),
	CONSTRAINT `students_code_unique` UNIQUE(`code`)
);
