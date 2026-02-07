import { Router } from 'express';
import * as authController from '../controllers/authController';
import { validate, emailValidation, passwordValidation, firstNameValidation, lastNameValidation } from '../utils/validators';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth';

const router = Router();

// Register - flexible field names handled in controller
router.post(
  '/register',
  validate([
    emailValidation,
    passwordValidation,
  ]),
  authController.register
);

// Login
router.post(
  '/login',
  validate([emailValidation, body('password').notEmpty().withMessage('Password is required')]),
  authController.login
);

// Verify OTP
router.post(
  '/verify-otp',
  validate([
    emailValidation,
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits').isNumeric(),
  ]),
  authController.verifyOTP
);

// Resend OTP
router.post(
  '/resend-otp',
  validate([emailValidation]),
  authController.resendOTP
);

// Admin Login
router.post(
  '/admin-login',
  validate([emailValidation, body('password').notEmpty().withMessage('Password is required')]),
  authController.adminLogin
);

// Logout
router.post('/logout', authenticate, authController.logout);

// Refresh Token
router.post(
  '/refresh-token',
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
  authController.refreshToken
);

// Forgot Password
router.post(
  '/forgot-password',
  validate([emailValidation]),
  authController.forgotPassword
);

// Reset Password
router.post(
  '/reset-password',
  validate([
    body('token').notEmpty().withMessage('Reset token is required'),
    passwordValidation.custom((value) => {
      if (!value) {
        throw new Error('New password is required');
      }
      return true;
    }).withMessage('New password is required'),
  ]),
  authController.resetPassword
);

export default router;

