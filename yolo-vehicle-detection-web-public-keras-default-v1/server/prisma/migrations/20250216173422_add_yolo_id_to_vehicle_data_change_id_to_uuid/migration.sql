/*
  Warnings:

  - The primary key for the `vehicle_data` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `yolo_id` to the `vehicle_data` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `vehicle_data` DROP PRIMARY KEY,
    ADD COLUMN `yolo_id` INTEGER NOT NULL,
    MODIFY `id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);
