import express from 'express';
import {
  createComment,
  getPostComments,
  updateComment,
  deleteComment,
  likeComment
} from '../controllers/commentController.js';

import { body, param } from 'express-validator';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();


router.get(
  '/post/:postId',
  param('postId').isMongoId().withMessage('Invalid post ID'),
  getPostComments
);


router.post(
  '/',
  authenticate,
  [
    body('post')
      .isMongoId()
      .withMessage('Valid post ID is required'),
    body('content')
      .trim()
      .notEmpty()
      .withMessage('Comment content is required')
      .isLength({ min: 2 })
      .withMessage('Comment must be at least 2 characters')
  ],
  createComment
);


router.put(
  '/:id',
  authenticate,
  [
    param('id').isMongoId().withMessage('Invalid comment ID'),
    body('content')
      .trim()
      .notEmpty()
      .withMessage('Comment content is required')
  ],
  updateComment
);


router.delete(
  '/:id',
  authenticate,
  param('id').isMongoId().withMessage('Invalid comment ID'),
  deleteComment
);


router.put(
  '/:id/like',
  authenticate,
  param('id').isMongoId().withMessage('Invalid comment ID'),
  likeComment
);

export default router;
