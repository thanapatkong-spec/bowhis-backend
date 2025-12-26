-- CreateTable
CREATE TABLE `MasterUnit` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `MasterUnit_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StaffRole` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `StaffRole_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Resource` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `roleId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Inventory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `barcode` VARCHAR(191) NULL,
    `category` VARCHAR(191) NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'PRODUCT',
    `price` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `isSellable` BOOLEAN NOT NULL DEFAULT true,
    `costPrice` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `stock` INTEGER NOT NULL DEFAULT 0,
    `unit_level1` VARCHAR(191) NOT NULL DEFAULT 'ชิ้น',
    `unit_level2` VARCHAR(191) NULL,
    `unit_ratio_2` INTEGER NULL,
    `unit_level3` VARCHAR(191) NULL,
    `unit_ratio_3` INTEGER NULL,
    `sale_deduct_qty` DECIMAL(65, 30) NULL DEFAULT 1,
    `sale_deduct_unit` VARCHAR(191) NULL,
    `is_composite` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InventoryIngredient` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `parentId` INTEGER NOT NULL,
    `childId` INTEGER NOT NULL,
    `qty_needed` DOUBLE NOT NULL,
    `unitUsed` VARCHAR(191) NULL,

    INDEX `InventoryIngredient_parentId_idx`(`parentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Customer` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `tel` VARCHAR(191) NULL,
    `points` INTEGER NOT NULL DEFAULT 0,
    `birthDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Pet` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `species` VARCHAR(191) NULL,
    `breed` VARCHAR(191) NULL,
    `birthDate` DATETIME(3) NULL,
    `medical` VARCHAR(191) NULL,
    `photoUrl` VARCHAR(191) NULL,
    `ownerId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Booking` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `startTime` DATETIME(3) NOT NULL,
    `endTime` DATETIME(3) NULL,
    `actualStartTime` DATETIME(3) NULL,
    `actualEndTime` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `notes` VARCHAR(191) NULL,
    `customerId` INTEGER NOT NULL,
    `petId` INTEGER NOT NULL,
    `serviceId` INTEGER NOT NULL,
    `staffId` INTEGER NULL,
    `roomId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Transaction` (
    `tx_id` INTEGER NOT NULL AUTO_INCREMENT,
    `total_amount` DECIMAL(65, 30) NOT NULL,
    `payment_type` VARCHAR(191) NULL,
    `receipt_type` VARCHAR(191) NULL,
    `tax_info` VARCHAR(191) NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `customer_id` INTEGER NULL,
    `customer_name` VARCHAR(191) NULL,

    PRIMARY KEY (`tx_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TransactionItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `transactionId` INTEGER NOT NULL,
    `inventoryId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `qty` INTEGER NOT NULL,
    `price` DECIMAL(65, 30) NOT NULL,
    `petId` INTEGER NULL,
    `petName` VARCHAR(191) NULL,
    `staffId` INTEGER NULL,
    `roomId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StockLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `action` VARCHAR(191) NOT NULL,
    `qty` INTEGER NOT NULL,
    `reason` VARCHAR(191) NULL,
    `inventoryId` INTEGER NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Resource` ADD CONSTRAINT `Resource_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `StaffRole`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventoryIngredient` ADD CONSTRAINT `InventoryIngredient_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Inventory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventoryIngredient` ADD CONSTRAINT `InventoryIngredient_childId_fkey` FOREIGN KEY (`childId`) REFERENCES `Inventory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pet` ADD CONSTRAINT `Pet_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `Customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_petId_fkey` FOREIGN KEY (`petId`) REFERENCES `Pet`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `Inventory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `Resource`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `Resource`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `Customer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TransactionItem` ADD CONSTRAINT `TransactionItem_transactionId_fkey` FOREIGN KEY (`transactionId`) REFERENCES `Transaction`(`tx_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TransactionItem` ADD CONSTRAINT `TransactionItem_inventoryId_fkey` FOREIGN KEY (`inventoryId`) REFERENCES `Inventory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TransactionItem` ADD CONSTRAINT `TransactionItem_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `Resource`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TransactionItem` ADD CONSTRAINT `TransactionItem_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `Resource`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockLog` ADD CONSTRAINT `StockLog_inventoryId_fkey` FOREIGN KEY (`inventoryId`) REFERENCES `Inventory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
