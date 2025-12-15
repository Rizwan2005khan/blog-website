import Comment from '../models/Comment.js';
import Post from '../models/Post.js';
import { validationResult } from 'express-validator';


//  Create a comment (guest or authenticated)
//  POST /api/comments
//  Public / Private

export const createComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { post, content, parent } = req.body;

    // Check post exists
    const postExists = await Post.findById(post);
    if (!postExists) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Author data (guest or logged in user)
    const author = req.user
      ? {
          name: req.user.username || `${req.user.firstName} ${req.user.lastName}`,
          email: req.user.email
        }
      : {
          name: req.body.name,
          email: req.body.email,
          website: req.body.website || '',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        };

    const comment = await Comment.create({
      post,
      content,
      parent: parent || null,
      author,
      status: 'pending' // can auto-approve if you want
    });

    res.status(201).json({
      success: true,
      message: 'Comment submitted successfully',
      data: comment
    });

  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create comment'
    });
  }
};


//  Get approved comments for a post (tree)
//  GET /api/comments/post/:postId
//  Public
 
export const getPostComments = async (req, res) => {
  try {
    const { postId } = req.params;

    const comments = await Comment.getCommentTree(postId, 'approved');

    res.json({
      success: true,
      count: comments.length,
      data: comments
    });

  } catch (error) {
    console.error('Get post comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comments'
    });
  }
};


//  Update a comment
//  PUT /api/comments/:id
//  Private (author only)
 
export const updateComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Only logged-in users who own the email can edit
    if (!req.user || comment.author.email !== req.user.email) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this comment'
      });
    }

    comment.content = req.body.content;
    comment.isEdited = true;
    comment.editedAt = new Date();
    comment.editedBy = req.user.id;

    await comment.save();

    res.json({
      success: true,
      message: 'Comment updated successfully',
      data: comment
    });

  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update comment'
    });
  }
};


//  Delete a comment
//  DELETE /api/comments/:id
//  Private (author or admin)
export const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    const isOwner = req.user && comment.author.email === req.user.email;
    const isAdmin = req.user && req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment'
      });
    }

    await comment.deleteOne();

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete comment'
    });
  }
};


//  Like / Unlike a comment
//  PUT /api/comments/:id/like
//  Private
export const likeComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    await comment.toggleLike(req.user.id);

    res.json({
      success: true,
      likes: comment.likes.length,
      dislikes: comment.dislikes.length
    });

  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to like comment'
    });
  }
};


//  Dislike / Undislike a comment
//  PUT /api/comments/:id/dislike
//  Private
export const dislikeComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    await comment.toggleDislike(req.user.id);

    res.json({
      success: true,
      likes: comment.likes.length,
      dislikes: comment.dislikes.length
    });

  } catch (error) {
    console.error('Dislike comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to dislike comment'
    });
  }
};
