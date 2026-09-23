-- CreateTable
CREATE TABLE `vehicle_data` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `class` VARCHAR(50) NULL,
    `date` DATE NULL,
    `time` TIME(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

