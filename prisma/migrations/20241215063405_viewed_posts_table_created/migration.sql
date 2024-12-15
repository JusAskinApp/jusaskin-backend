-- CreateTable
CREATE TABLE "ViewedPost" (
    "ViewedPostID" TEXT NOT NULL,
    "UserID" TEXT NOT NULL,
    "PostID" TEXT NOT NULL,
    "dateViewed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ViewedPost_pkey" PRIMARY KEY ("ViewedPostID")
);

-- CreateIndex
CREATE UNIQUE INDEX "ViewedPost_UserID_PostID_key" ON "ViewedPost"("UserID", "PostID");

-- AddForeignKey
ALTER TABLE "ViewedPost" ADD CONSTRAINT "ViewedPost_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "users"("UserID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViewedPost" ADD CONSTRAINT "ViewedPost_PostID_fkey" FOREIGN KEY ("PostID") REFERENCES "posts"("PostID") ON DELETE RESTRICT ON UPDATE CASCADE;
