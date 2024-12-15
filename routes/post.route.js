const express = require("express");
const {
  upload,
  createPost,
  updatePost,
  deletePost,
  getRecommendedPosts,
  createComment,
  updateComment,
  deleteComment,
  toggleLikePost,
  saveOrUnsavePost,
  markPostViewedHandler,
  getSavedPosts
} = require("../controllers/post.controller");
const authenticate = require("../middleware/authMiddleware.js");

const router = express.Router();

router.post("/create", authenticate, upload.single("media"), createPost);
router.put("/update/:postID", authenticate, upload.single("media"), updatePost);
router.delete("/delete/:postID", authenticate, deletePost);
router.get("/getposts", authenticate, getRecommendedPosts);
router.post("/savepost", authenticate, saveOrUnsavePost);
router.post("/createcomment", authenticate, createComment);
router.put("/updatecomment/:commentID", authenticate, updateComment);
router.delete("/deletecomment/:commentID", authenticate, deleteComment);
router.post("/like-unlike/:postID", authenticate, toggleLikePost);
router.post("/view", authenticate, markPostViewedHandler);
router.get("/getsavedposts", authenticate, getSavedPosts);



module.exports = router;
