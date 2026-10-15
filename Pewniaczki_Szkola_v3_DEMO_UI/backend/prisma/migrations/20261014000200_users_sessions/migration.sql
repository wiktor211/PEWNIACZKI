-- Migracja przyrostowa v2: nie usuwamy wczesniejszych tabel ani wydarzen.
CREATE TABLE `users` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(40) NOT NULL,
  `email` VARCHAR(190) NOT NULL,
  `passwordHash` VARCHAR(120) NOT NULL,
  `role` VARCHAR(10) NOT NULL DEFAULT 'USER',
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `users_username_key`(`username`),
  UNIQUE INDEX `users_email_key`(`email`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `sessions` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `tokenHash` CHAR(64) NOT NULL,
  `userId` INTEGER NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `sessions_tokenHash_key`(`tokenHash`),
  INDEX `sessions_userId_idx`(`userId`),
  INDEX `sessions_expiresAt_idx`(`expiresAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `favorites` ADD COLUMN `userId` INTEGER NULL;
-- First create a replacement index required by the existing eventId foreign key.
CREATE INDEX `favorites_eventId_idx` ON `favorites`(`eventId`);
ALTER TABLE `favorites` DROP INDEX `favorites_eventId_key`;
CREATE UNIQUE INDEX `favorites_userId_eventId_key` ON `favorites`(`userId`, `eventId`);
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
