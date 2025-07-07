/*
  Warnings:

  - You are about to drop the column `md5` on the `visitor` table. All the data in the column will be lost.
  - Added the required column `groupId` to the `Attendance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `imgBase64` to the `Attendance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recordId` to the `Attendance` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `attendance` DROP FOREIGN KEY `Attendance_visitorId_fkey`;

-- DropIndex
DROP INDEX `Attendance_visitorId_fkey` ON `attendance`;

-- AlterTable
ALTER TABLE `attendance` ADD COLUMN `groupId` VARCHAR(191) NOT NULL,
    ADD COLUMN `imgBase64` VARCHAR(191) NOT NULL,
    ADD COLUMN `recordId` VARCHAR(191) NOT NULL,
    MODIFY `visitorId` INTEGER NULL;

-- AlterTable
ALTER TABLE `visitor` DROP COLUMN `md5`;

-- AddForeignKey
ALTER TABLE `Attendance` ADD CONSTRAINT `Attendance_visitorId_fkey` FOREIGN KEY (`visitorId`) REFERENCES `Visitor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
