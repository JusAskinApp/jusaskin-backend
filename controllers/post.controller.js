const multer = require('multer');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = file.mimetype.startsWith('image/') ? 'uploads/image/' : 'uploads/video/';
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });

// API to create a post
const createPost = async (req, res) => {
  try {
    const { title, description, status, GroupID, visibility, tags } = req.body;

    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = JSON.parse(tags); 
        if (!Array.isArray(parsedTags)) {
          return res.status(400).json({ success: false, message: 'Tags must be a valid JSON array' });
        }
      } catch (error) {
        return res.status(400).json({ success: false, message: 'Invalid JSON format for tags' });
      }
    }
    
    let mediaData = null;
    if (req.file) {
      const mediaType = req.file.mimetype.startsWith('image/') ? 'image' : 'video';
      const url = `${req.protocol}://${req.get('host')}/${req.file.path}`;
      mediaData = {
        mediaType,
        url,
      };
    }

    // Create the post first
    const post = await prisma.post.create({
      data: {
        UserID: req.user.UserID, // logged-in user's ID
        title,
        description,
        status,
        GroupID: GroupID || null,
        visibility,
        tags: parsedTags, 
        media: mediaData ? mediaData : undefined,
      },
    });


    return res.status(201).json({ success: true, post });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to create post' });
  }
};


const updatePost = async (req, res) => {
  try {
    const { title, description, status, GroupID, visibility, tags } = req.body;
    const { postID } = req.params;

    // Fetch the post to ensure the user owns it
    const existingPost = await prisma.post.findUnique({
      where: { PostID: postID },
    });

    if (!existingPost) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (existingPost.UserID !== req.user.UserID) {
      return res.status(403).json({ success: false, message: 'Unauthorized to edit this post' });
    }

    // Parse `tags` from text to JSON array
    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = JSON.parse(tags); // Attempt to parse the string into JSON
        if (!Array.isArray(parsedTags)) {
          return res.status(400).json({ success: false, message: 'Tags must be a valid JSON array' });
        }
      } catch (error) {
        return res.status(400).json({ success: false, message: 'Invalid JSON format for tags' });
      }
    }

    // Handle media updates
    let mediaData = null;
    if (req.file) {
      const mediaType = req.file.mimetype.startsWith('image/') ? 'image' : 'video';
      const url = `${req.protocol}://${req.get('host')}/${req.file.path}`;
      mediaData = {
        mediaType,
        url,
      };
    }

    // Update the post
    const updatedPost = await prisma.post.update({
      where: { PostID: postID },
      data: {
        title,
        description,
        status,
        GroupID: GroupID || null,
        visibility,
        tags: parsedTags.length > 0 ? parsedTags : undefined, // Update tags only if provided
        media: mediaData ? mediaData : undefined, // Update media only if provided
      },
    });

    return res.status(200).json({ success: true, updatedPost });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to update post' });
  }
};



const deletePost = async (req, res) => {
  try {
    const { postID } = req.params;

    // Fetch the post to ensure the user owns it
    const existingPost = await prisma.post.findUnique({
      where: { PostID: postID },
    });

    if (!existingPost) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (existingPost.UserID !== req.user.UserID) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this post' });
    }

    await prisma.post.delete({
      where: { PostID: postID },
    });

    return res.status(200).json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to delete post' });
  }
};


// Function to get user interests from the database
const getUserInterests = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { UserID: userId },
    select: { interests: true },
  });
  return user ? (user.interests || []) : [];
};

// Function to get the post IDs that the user has already viewed
const getViewedPostIds = async (userId) => {
  const viewedPostIds = await prisma.viewedPost.findMany({
    where: { UserID: userId },
    select: { PostID: true },
  });
  return viewedPostIds.map((viewed) => `'${viewed.PostID}'`).join(',');
};

// Function to get recommended posts based on user interests and excluding already viewed posts
const getRecommendedPostsByInterests = async (userTags, viewedIds) => {
  const query = `
    SELECT 
      p."PostID",
      p."title",
      p."description",
      p."dateCreated",
      p."tags",
      p."media",
      c."CommentID",
      c."content" AS "commentContent",
      c."dateCreated" AS "commentDate",
      u."UserID" AS "commentUserID",
      u."name" AS "commentUsername"
    FROM 
      posts p
    LEFT JOIN 
      comments c ON p."PostID" = c."PostID"
    LEFT JOIN 
      users u ON c."UserID" = u."UserID"
    WHERE 
      p.tags::jsonb ?| array[${userTags.map((tag) => `'${tag.toLowerCase()}'`).join(",")}]
      ${viewedIds != '' && viewedIds != null ? 'AND p."PostID" NOT IN (${viewedIds})' : ''}
    ORDER BY 
      p."dateCreated" DESC
    LIMIT 10;
  `;
  return prisma.$queryRawUnsafe(query);
};

// Function to get random posts if no recommended posts are found
const getRandomPosts = async () => {
  const randomQuery = `
    SELECT 
      p."PostID",
      p."title",
      p."description",
      p."dateCreated",
      p."tags",
      p."media",
      c."CommentID",
      c."content" AS "commentContent",
      c."dateCreated" AS "commentDate",
      u."UserID" AS "commentUserID",
      u."name" AS "commentUsername"
    FROM 
      posts p
    LEFT JOIN 
      comments c ON p."PostID" = c."PostID"
    LEFT JOIN 
      users u ON c."UserID" = u."UserID"
    ORDER BY 
      RANDOM() 
    LIMIT 10;
  `;
  return prisma.$queryRawUnsafe(randomQuery);
};

// Main API function to get recommended posts
const getRecommendedPosts = async (req, res) => {
  try {
    const userId = req.user.UserID;

    const userInterests = await getUserInterests(userId);
    let recommendedPosts = [];

    if (userInterests.length > 0) {
      const viewedIds = await getViewedPostIds(userId);
      recommendedPosts = await getRecommendedPostsByInterests(userInterests, viewedIds);

      if (recommendedPosts.length === 0) {
        recommendedPosts = await getRandomPosts();
      }
    } else {
      recommendedPosts = await getRandomPosts();
    }

    res.status(200).json({ success: true, posts: recommendedPosts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to get recommended posts', details: error.message });
  }
};


/////////////////////

const markPostAsViewed = async (userId, postId) => {
  try {
    await prisma.viewedPost.upsert({
      where: {
        UserID_PostID: {
          UserID: userId,
          PostID: postId,
        },
      },
      update: {
        dateViewed: new Date(), // Update timestamp if already viewed
      },
      create: {
        UserID: userId,
        PostID: postId,
      },
    });
    console.log(`Post ${postId} marked as viewed for user ${userId}`);
  } catch (error) {
    console.error("Error marking post as viewed:", error);
  }
};


const markPostViewedHandler = async (req, res) => {
  try {
    const userId = req.user.UserID;
    const {postId} = req.body;

    await markPostAsViewed(userId, postId); 

    res.status(200).json({ success: true, message: 'Post marked as viewed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to mark post as viewed' });
  }
};




// post save/unsave logic

const saveOrUnsavePost = async (req, res) => {
  try {
    const userId = req.user.UserID; 
    const { postId } = req.body; 

    const postExists = await prisma.post.findUnique({
      where: { PostID: postId },
    });

    if (!postExists) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const savedPost = await prisma.savedPost.findUnique({
      where: {
        UserID_PostID: { UserID: userId, PostID: postId }, 
      },
    });

    if (savedPost) {
      await prisma.savedPost.delete({
        where: {
          UserID_PostID: { UserID: userId, PostID: postId },
        },
      });
      return res.status(200).json({
        success: true,
        message: "Post unsaved successfully",
      });
    } else {
      await prisma.savedPost.create({
        data: {
          UserID: userId,
          PostID: postId,
        },
      });
      return res.status(200).json({
        success: true,
        message: "Post saved successfully",
      });
    }
  } catch (error) {
    console.error("Error saving/unsaving post:", error);
    res
      .status(500)
      .json({ success: false, message: "An error occurred", details: error.message });
  }
};


///////// retrieve saved posts ///////////

const getSavedPosts = async (req, res) => {
  try {
    const userId = req.user.UserID;

    const query = `
      SELECT 
        p."PostID",
        p."title",
        p."description",
        p."dateCreated",
        p."tags",
        p."media",
        c."CommentID",
        c."content" AS "commentContent",
        c."dateCreated" AS "commentDate",
        u."UserID" AS "commentUserID",
        u."name" AS "commentUsername"
      FROM 
        saved_posts sp
      INNER JOIN 
        posts p ON sp."PostID" = p."PostID"
      LEFT JOIN 
        comments c ON p."PostID" = c."PostID"
      LEFT JOIN 
        users u ON c."UserID" = u."UserID"
      WHERE 
        sp."UserID" = $1
      ORDER BY 
        sp."dateSaved" DESC;
    `;

    const savedPosts = await prisma.$queryRawUnsafe(query, userId);

    res.status(200).json({ success: true, posts: savedPosts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to retrieve saved posts', details: error.message });
  }
};

// comments logic

const createComment = async (req, res) => {
  try {
    const { PostID, content } = req.body;

    const existingPost = await prisma.post.findUnique({
      where: { PostID },
    });

    if (!existingPost) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const comment = await prisma.comment.create({
      data: {
        PostID,
        UserID: req.user.UserID, 
        content,
      },
    });

    await prisma.post.update({
      where: { PostID },
      data: { commentCount: { increment: 1 } },
    });

    return res.status(201).json({ success: true, comment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to create comment' });
  }
};

const updateComment = async (req, res) => {
  try {
    const { content } = req.body;
    const { commentID } = req.params;

    const existingComment = await prisma.comment.findUnique({
      where: { CommentID: commentID },
    });

    if (!existingComment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    if (existingComment.UserID !== req.user.UserID) {
      return res.status(403).json({ success: false, message: 'Unauthorized to edit this comment' });
    }

    const updatedComment = await prisma.comment.update({
      where: { CommentID: commentID },
      data: { content },
    });

    return res.status(200).json({ success: true, updatedComment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to update comment' });
  }
};

const deleteComment = async (req, res) => {
  try {
    const { commentID } = req.params;

    const existingComment = await prisma.comment.findUnique({
      where: { CommentID: commentID },
    });

    if (!existingComment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    if (existingComment.UserID !== req.user.UserID) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this comment' });
    }

    await prisma.comment.delete({
      where: { CommentID: commentID },
    });

    await prisma.post.update({
      where: { PostID: existingComment.PostID },
      data: { commentCount: { decrement: 1 } },
    });

    return res.status(200).json({ success: true, message: 'Comment deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to delete comment' });
  }
};


const toggleLikePost = async (req, res) => {
  try {
    const { postID } = req.params;
    const { action } = req.body; // "like" or "unlike"

    const post = await prisma.post.findUnique({
      where: { PostID: postID },
    });

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (action === 'like') {
      const updatedPost = await prisma.post.update({
        where: { PostID: postID },
        data: { likeCount: { increment: 1 } },
      });
      return res.status(200).json({ success: true, post: updatedPost });
    } else if (action === 'unlike') {
      if (post.likeCount === 0) {
        return res.status(400).json({ success: false, message: 'Like count cannot be less than zero' });
      }
      const updatedPost = await prisma.post.update({
        where: { PostID: postID },
        data: { likeCount: { decrement: 1 } },
      });
      return res.status(200).json({ success: true, post: updatedPost });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid action' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to toggle like/unlike' });
  }
};



module.exports = {
  upload,
  createPost,
  updatePost,
  deletePost,
  getRecommendedPosts,
  createComment,
  deleteComment,
  updateComment,
  toggleLikePost,
  saveOrUnsavePost,
  markPostViewedHandler,
  getSavedPosts
};
