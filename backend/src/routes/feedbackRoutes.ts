import { Router } from 'express';
import * as feedbackController from '../controllers/feedbackController';
import { authenticate, requireAdmin } from '../middleware/auth';
import { validate } from '../utils/validators';
import { body } from 'express-validator';

const router = Router();

router.post(
  '/submit',
  authenticate,
  validate([
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('category').isIn(['room_quality', 'staff_service', 'amenities', 'food', 'cleanliness', 'other']).withMessage('Invalid category'),
    body('title').trim().isLength({ min: 5, max: 100 }).withMessage('Title must be between 5 and 100 characters'),
    body('feedback').trim().isLength({ min: 10, max: 1000 }).withMessage('Feedback must be between 10 and 1000 characters'),
  ]),
  feedbackController.submitFeedback
);

router.get('/my-feedback', authenticate, feedbackController.getMyFeedback);
router.get('/', authenticate, requireAdmin, feedbackController.getAllFeedback);
router.put('/:id/respond', authenticate, requireAdmin, feedbackController.respondToFeedback);

export default router;

