/*
  Warnings:

  - You are about to drop the column `dateAdded` on the `Media` table. All the data in the column will be lost.
  - You are about to drop the column `duration` on the `Media` table. All the data in the column will be lost.
  - You are about to drop the column `entityID` on the `Media` table. All the data in the column will be lost.
  - You are about to drop the column `entityType` on the `Media` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `Media` table. All the data in the column will be lost.
  - You are about to drop the column `ordering` on the `Media` table. All the data in the column will be lost.
  - You are about to drop the column `thumbnail` on the `Media` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Media" DROP COLUMN "dateAdded",
DROP COLUMN "duration",
DROP COLUMN "entityID",
DROP COLUMN "entityType",
DROP COLUMN "metadata",
DROP COLUMN "ordering",
DROP COLUMN "thumbnail";
