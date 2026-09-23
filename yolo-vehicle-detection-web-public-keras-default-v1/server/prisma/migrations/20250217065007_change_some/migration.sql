/*
  Warnings:

  - You are about to drop the column `video_name` on the `vehicle_data` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[yolo_id,video_id]` on the table `vehicle_data` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `video_id` to the `vehicle_data` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `vehicle_data_yolo_id_video_name_key` ON `vehicle_data`;

-- AlterTable
ALTER TABLE `vehicle_data` DROP COLUMN `video_name`,
    ADD COLUMN `video_id` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `video` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `vehicle_data_yolo_id_video_id_key` ON `vehicle_data`(`yolo_id`, `video_id`);

-- AddForeignKey
ALTER TABLE `vehicle_data` ADD CONSTRAINT `vehicle_data_video_id_fkey` FOREIGN KEY (`video_id`) REFERENCES `video`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
