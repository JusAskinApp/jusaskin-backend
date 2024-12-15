/*
  Warnings:

  - You are about to drop the `ViewedPost` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ViewedPost" DROP CONSTRAINT "ViewedPost_PostID_fkey";

-- DropForeignKey
ALTER TABLE "ViewedPost" DROP CONSTRAINT "ViewedPost_UserID_fkey";

-- DropTable
DROP TABLE "ViewedPost";

-- CreateTable
CREATE TABLE "viewed_posts" (
    "ViewedPostID" TEXT NOT NULL,
    "UserID" TEXT NOT NULL,
    "PostID" TEXT NOT NULL,
    "dateViewed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "viewed_posts_pkey" PRIMARY KEY ("ViewedPostID")
);

-- CreateIndex
CREATE UNIQUE INDEX "viewed_posts_UserID_PostID_key" ON "viewed_posts"("UserID", "PostID");

-- AddForeignKey
ALTER TABLE "viewed_posts" ADD CONSTRAINT "viewed_posts_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "users"("UserID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viewed_posts" ADD CONSTRAINT "viewed_posts_PostID_fkey" FOREIGN KEY ("PostID") REFERENCES "posts"("PostID") ON DELETE RESTRICT ON UPDATE CASCADE;
