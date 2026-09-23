/*
  Warnings:

  - You are about to drop the column `time` on the `vehicle_data` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `vehicle_data` DROP COLUMN `time`,
    ADD COLUMN `entry_time` DATETIME(3) NULL,
    ADD COLUMN `exit_time` TIME(0) NULL,
    ADD COLUMN `lane_id` INTEGER NULL,
    ADD COLUMN `lane_type` VARCHAR(30) NULL;
