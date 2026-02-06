import { Router } from 'express';
import * as userController from '../controllers/userController';
import { authenticate } from '../middleware/auth';
import { validate, firstNameValidation, lastNameValidation, phoneValidation } from '../utils/validators';
import { body } from 'express-validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get current user
router.get('/me', userController.getMe);

// Update profile
router.put(
  '/me',
  validate([
    firstNameValidation.optional(),
    lastNameValidation.optional(),
    phoneValidation,
    body('emergencyContact').optional().trim(),
    body('program').optional().trim().isLength({ max: 100 }),
  ]),
  userController.updateMe
);

// Change password
router.put(
  '/me/password',
  validate([
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
  ]),
  userController.changePassword
);

// Upload profile picture
router.post('/upload-profile-picture', userController.uploadProfilePictureHandler);

export default router;

