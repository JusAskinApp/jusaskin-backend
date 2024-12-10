-- CreateTable
CREATE TABLE "comments" (
    "CommentID" TEXT NOT NULL,
    "PostID" TEXT NOT NULL,
    "UserID" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "dateCreated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("CommentID")
);

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_PostID_fkey" FOREIGN KEY ("PostID") REFERENCES "posts"("PostID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "users"("UserID") ON DELETE RESTRICT ON UPDATE CASCADE;
