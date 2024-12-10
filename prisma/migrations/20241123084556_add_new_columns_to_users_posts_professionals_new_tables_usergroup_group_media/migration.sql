/*
  Warnings:

  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `users` table. All the data in the column will be lost.
  - The required column `UserID` was added to the `users` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('Active', 'Deleted');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('public', 'connections_only', 'private');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('post', 'group');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('text', 'audio', 'video');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('Admin', 'Consumer', 'Author');

-- DropForeignKey
ALTER TABLE "Professional" DROP CONSTRAINT "Professional_userId_fkey";

-- AlterTable
ALTER TABLE "Professional" ALTER COLUMN "userId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "users" DROP CONSTRAINT "users_pkey",
DROP COLUMN "id",
ADD COLUMN     "UserID" TEXT NOT NULL,
ADD COLUMN     "interests" JSONB,
ALTER COLUMN "updatedAt" DROP DEFAULT,
ADD CONSTRAINT "users_pkey" PRIMARY KEY ("UserID");

-- CreateTable
CREATE TABLE "posts" (
    "PostID" TEXT NOT NULL,
    "UserID" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "dateCreated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    "status" "PostStatus" NOT NULL DEFAULT 'Active',
    "GroupID" TEXT,
    "visibility" "Visibility" NOT NULL DEFAULT 'public',
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "sharedPostID" TEXT,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("PostID")
);

-- CreateTable
CREATE TABLE "Media" (
    "MediaID" TEXT NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "entityID" TEXT NOT NULL,
    "mediaType" "MediaType" NOT NULL,
    "url" TEXT NOT NULL,
    "duration" INTEGER,
    "thumbnail" TEXT,
    "metadata" JSONB,
    "dateAdded" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ordering" INTEGER,
    "postPostID" TEXT,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("MediaID")
);

-- CreateTable
CREATE TABLE "saved_posts" (
    "SavedPostID" TEXT NOT NULL,
    "UserID" TEXT NOT NULL,
    "PostID" TEXT NOT NULL,
    "dateSaved" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_posts_pkey" PRIMARY KEY ("SavedPostID")
);

-- CreateTable
CREATE TABLE "groups" (
    "GroupID" TEXT NOT NULL,
    "CreatedByUserID" TEXT NOT NULL,
    "Name" TEXT NOT NULL,
    "Description" TEXT,
    "CreationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Thumbnail" TEXT,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("GroupID")
);

-- CreateTable
CREATE TABLE "user_groups" (
    "UserID" TEXT NOT NULL,
    "GroupID" TEXT NOT NULL,
    "JoinDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Role" "Role" NOT NULL,
    "Status" TEXT NOT NULL,

    CONSTRAINT "user_groups_pkey" PRIMARY KEY ("UserID","GroupID")
);

-- AddForeignKey
ALTER TABLE "Professional" ADD CONSTRAINT "Professional_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("UserID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "users"("UserID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_GroupID_fkey" FOREIGN KEY ("GroupID") REFERENCES "groups"("GroupID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_sharedPostID_fkey" FOREIGN KEY ("sharedPostID") REFERENCES "posts"("PostID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_postPostID_fkey" FOREIGN KEY ("postPostID") REFERENCES "posts"("PostID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_posts" ADD CONSTRAINT "saved_posts_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "users"("UserID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_posts" ADD CONSTRAINT "saved_posts_PostID_fkey" FOREIGN KEY ("PostID") REFERENCES "posts"("PostID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_CreatedByUserID_fkey" FOREIGN KEY ("CreatedByUserID") REFERENCES "users"("UserID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_groups" ADD CONSTRAINT "user_groups_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "users"("UserID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_groups" ADD CONSTRAINT "user_groups_GroupID_fkey" FOREIGN KEY ("GroupID") REFERENCES "groups"("GroupID") ON DELETE RESTRICT ON UPDATE CASCADE;
