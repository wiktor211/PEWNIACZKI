-- Pewniaczki: edukacyjna baza wydarzen sportowych
CREATE TABLE `sports` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(80) NOT NULL,
  `slug` VARCHAR(80) NOT NULL,
  UNIQUE INDEX `sports_name_key`(`name`),
  UNIQUE INDEX `sports_slug_key`(`slug`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `leagues` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `externalId` VARCHAR(50) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `country` VARCHAR(100) NULL,
  `sportId` INTEGER NOT NULL,
  `lastSyncedAt` DATETIME(3) NULL,
  UNIQUE INDEX `leagues_externalId_key`(`externalId`),
  INDEX `leagues_sportId_idx`(`sportId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `teams` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(160) NOT NULL,
  `sportId` INTEGER NOT NULL,
  UNIQUE INDEX `teams_sportId_name_key`(`sportId`, `name`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `events` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `externalId` VARCHAR(90) NOT NULL,
  `sportId` INTEGER NOT NULL,
  `leagueId` INTEGER NOT NULL,
  `homeTeamId` INTEGER NOT NULL,
  `awayTeamId` INTEGER NOT NULL,
  `startAt` DATETIME(3) NOT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'scheduled',
  `venue` VARCHAR(160) NULL,
  `source` VARCHAR(30) NOT NULL DEFAULT 'demo',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `events_externalId_key`(`externalId`),
  INDEX `events_startAt_idx`(`startAt`),
  INDEX `events_leagueId_startAt_idx`(`leagueId`, `startAt`),
  INDEX `events_sportId_startAt_idx`(`sportId`, `startAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `favorites` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `eventId` INTEGER NOT NULL,
  `note` VARCHAR(250) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `favorites_eventId_key`(`eventId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `sync_logs` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `leagueId` INTEGER NOT NULL,
  `status` VARCHAR(20) NOT NULL,
  `received` INTEGER NOT NULL DEFAULT 0,
  `imported` INTEGER NOT NULL DEFAULT 0,
  `skipped` INTEGER NOT NULL DEFAULT 0,
  `error` VARCHAR(250) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `sync_logs_leagueId_createdAt_idx`(`leagueId`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `leagues` ADD CONSTRAINT `leagues_sportId_fkey` FOREIGN KEY (`sportId`) REFERENCES `sports`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `teams` ADD CONSTRAINT `teams_sportId_fkey` FOREIGN KEY (`sportId`) REFERENCES `sports`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `events` ADD CONSTRAINT `events_sportId_fkey` FOREIGN KEY (`sportId`) REFERENCES `sports`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `events` ADD CONSTRAINT `events_leagueId_fkey` FOREIGN KEY (`leagueId`) REFERENCES `leagues`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `events` ADD CONSTRAINT `events_homeTeamId_fkey` FOREIGN KEY (`homeTeamId`) REFERENCES `teams`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `events` ADD CONSTRAINT `events_awayTeamId_fkey` FOREIGN KEY (`awayTeamId`) REFERENCES `teams`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `sync_logs` ADD CONSTRAINT `sync_logs_leagueId_fkey` FOREIGN KEY (`leagueId`) REFERENCES `leagues`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
