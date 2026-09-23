/*
  Warnings:

  - You are about to alter the column `exit_time` on the `vehicle_data` table. The data in that column could be lost. The data in that column will be cast from `Time(0)` to `DateTime(3)`.

*/
-- AlterTable
ALTER TABLE `vehicle_data` MODIFY `exit_time` DATETIME(3) NULL;
