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
        parsedTags = JSON.parse(tags); // Attempt to parse the string into JSON
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

    // Delete the post
    await prisma.post.delete({
      where: { PostID: postID },
    });

    return res.status(200).json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to delete post' });
  }
};


const getRecommendedPosts = async (req, res) => {
  try {
    const userId = req.user.UserID; 
    
    const user = await prisma.user.findUnique({
      where: { UserID: userId },
      select: { interests: true }, 
    });

    if (!user || !user.interests || user.interests.length === 0) {
      return res.status(200).json({ success: true, posts: [] }); 
    }

    const userTags = user.interests; 
    let query = `SELECT * FROM posts WHERE tags::jsonb ?| array[${userTags.map((tag) => `'${tag.toLowerCase()}'`).join(",")}] ORDER BY "dateCreated" DESC LIMIT 10;`

    const recommendedPosts = await prisma.$queryRawUnsafe(query);

    res.status(200).json({ success: true, posts: recommendedPosts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to get recommended posts', details: error.message });
  }
};



// comments logic

const createComment = async (req, res) => {
  try {
    const { PostID, content } = req.body;

    // Check if the post exists
    const existingPost = await prisma.post.findUnique({
      where: { PostID },
    });

    if (!existingPost) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Create the comment
    const comment = await prisma.comment.create({
      data: {
        PostID,
        UserID: req.user.UserID, // logged-in user's ID
        content,
      },
    });

    // Increment comment count on the post
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

    // Fetch the comment to ensure the user owns it
    const existingComment = await prisma.comment.findUnique({
      where: { CommentID: commentID },
    });

    if (!existingComment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    if (existingComment.UserID !== req.user.UserID) {
      return res.status(403).json({ success: false, message: 'Unauthorized to edit this comment' });
    }

    // Update the comment
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

    // Fetch the comment to ensure the user owns it
    const existingComment = await prisma.comment.findUnique({
      where: { CommentID: commentID },
    });

    if (!existingComment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    if (existingComment.UserID !== req.user.UserID) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this comment' });
    }

    // Delete the comment
    await prisma.comment.delete({
      where: { CommentID: commentID },
    });

    // Decrement comment count on the post
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

    // Check if the post exists
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
  toggleLikePost
};
