/*
  Warnings:

  - You are about to alter the column `video_id` on the `vehicle_data` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - The primary key for the `video` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `video` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.

*/
-- DropForeignKey
ALTER TABLE `vehicle_data` DROP FOREIGN KEY `vehicle_data_video_id_fkey`;

-- DropIndex
DROP INDEX `vehicle_data_video_id_fkey` ON `vehicle_data`;

-- AlterTable
ALTER TABLE `vehicle_data` MODIFY `video_id` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `video` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- AddForeignKey
ALTER TABLE `vehicle_data` ADD CONSTRAINT `vehicle_data_video_id_fkey` FOREIGN KEY (`video_id`) REFERENCES `video`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
