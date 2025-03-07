/*
  Warnings:

  - The values [reviewed] on the enum `PostReport_status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `postreport` MODIFY `status` ENUM('pending', 'rejected', 'resolved') NOT NULL;
