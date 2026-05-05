-- CreateTable
CREATE TABLE `User` (
    `userID` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `profilepic` VARCHAR(191) NULL,

    UNIQUE INDEX `User_username_key`(`username`),
    PRIMARY KEY (`userID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Post` (
    `id` VARCHAR(191) NOT NULL,
    `userID` VARCHAR(191) NOT NULL,
    `imageURL` VARCHAR(191) NULL,
    `content` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `likesCount` INTEGER NOT NULL DEFAULT 0,
    `commentsCount` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('active', 'blocked', 'deleted') NOT NULL DEFAULT 'active',
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    `groupID` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PostLike` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `postID` VARCHAR(191) NOT NULL,
    `userID` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PostComment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `postID` VARCHAR(191) NOT NULL,
    `userID` VARCHAR(191) NOT NULL,
    `comment` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `status` ENUM('active', 'deleted') NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PostSave` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `postID` VARCHAR(191) NOT NULL,
    `userID` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PostReport` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `postID` VARCHAR(191) NOT NULL,
    `userID` VARCHAR(191) NOT NULL,
    `reason` ENUM('adult_content', 'irrelevant_content', 'spam', 'other') NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` ENUM('pending', 'rejected', 'resolved') NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Postcard` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `senderID` VARCHAR(191) NOT NULL,
    `receiverID` VARCHAR(191) NOT NULL,
    `imageURL` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `viewed` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Post` ADD CONSTRAINT `Post_userID_fkey` FOREIGN KEY (`userID`) REFERENCES `User`(`userID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PostLike` ADD CONSTRAINT `PostLike_postID_fkey` FOREIGN KEY (`postID`) REFERENCES `Post`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PostLike` ADD CONSTRAINT `PostLike_userID_fkey` FOREIGN KEY (`userID`) REFERENCES `User`(`userID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PostComment` ADD CONSTRAINT `PostComment_postID_fkey` FOREIGN KEY (`postID`) REFERENCES `Post`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PostComment` ADD CONSTRAINT `PostComment_userID_fkey` FOREIGN KEY (`userID`) REFERENCES `User`(`userID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PostSave` ADD CONSTRAINT `PostSave_postID_fkey` FOREIGN KEY (`postID`) REFERENCES `Post`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PostSave` ADD CONSTRAINT `PostSave_userID_fkey` FOREIGN KEY (`userID`) REFERENCES `User`(`userID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PostReport` ADD CONSTRAINT `PostReport_postID_fkey` FOREIGN KEY (`postID`) REFERENCES `Post`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PostReport` ADD CONSTRAINT `PostReport_userID_fkey` FOREIGN KEY (`userID`) REFERENCES `User`(`userID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Postcard` ADD CONSTRAINT `Postcard_senderID_fkey` FOREIGN KEY (`senderID`) REFERENCES `User`(`userID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Postcard` ADD CONSTRAINT `Postcard_receiverID_fkey` FOREIGN KEY (`receiverID`) REFERENCES `User`(`userID`) ON DELETE RESTRICT ON UPDATE CASCADE;
