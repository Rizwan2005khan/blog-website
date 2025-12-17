// src/services/comments.js
import { commentsAPI } from './api/comments.api.js';

const commentService = {
  getPostComments: commentsAPI.getPostComments,
  createComment: commentsAPI.createComment,
  updateComment: commentsAPI.updateComment,
  deleteComment: commentsAPI.deleteComment,
  replyToComment: commentsAPI.replyToComment,
  toggleCommentLike: commentsAPI.toggleCommentLike,
  getCommentsForModeration: commentsAPI.getCommentsForModeration,
  approveComment: commentsAPI.approveComment,
  rejectComment: commentsAPI.rejectComment,
  getCommentStats: commentsAPI.getCommentStats
};

export default commentService;