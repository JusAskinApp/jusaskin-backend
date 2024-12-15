/*
  Warnings:

  - A unique constraint covering the columns `[UserID,PostID]` on the table `saved_posts` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "saved_posts_UserID_PostID_key" ON "saved_posts"("UserID", "PostID");
