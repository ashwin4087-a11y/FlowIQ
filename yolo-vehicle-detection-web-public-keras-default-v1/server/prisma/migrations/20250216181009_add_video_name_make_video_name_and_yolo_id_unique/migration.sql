/*
  Warnings:

  - A unique constraint covering the columns `[yolo_id,video_name]` on the table `vehicle_data` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `video_name` to the `vehicle_data` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `vehicle_data` ADD COLUMN `video_name` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `vehicle_data_yolo_id_video_name_key` ON `vehicle_data`(`yolo_id`, `video_name`);
