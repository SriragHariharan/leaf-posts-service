/*
  Warnings:

  - You are about to drop the column `isReported` on the `post` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `post` DROP COLUMN `isReported`,
    ADD COLUMN `isDeleted` BOOLEAN NOT NULL DEFAULT false;
