/*
  Warnings:

  - You are about to drop the `Media` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Media" DROP CONSTRAINT "Media_postPostID_fkey";

-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "media" JSONB;

-- DropTable
DROP TABLE "Media";
