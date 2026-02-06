import { Router } from 'express';
import * as paymentController from '../controllers/paymentController';
import { authenticate } from '../middleware/auth';
import { validate } from '../utils/validators';
import { body } from 'express-validator';

const router = Router();

router.post(
  '/initialize',
  authenticate,
  validate([
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    body('type').isIn(['room_booking', 'other_fees']).withMessage('Invalid payment type'),
  ]),
  paymentController.initializePaymentHandler
);

router.post('/verify', paymentController.verifyPaymentHandler);
router.get('/history', authenticate, paymentController.getPaymentHistory);
router.get('/balance', authenticate, paymentController.getBalance);

// Paystack webhook - NO AUTHENTICATION (verified by signature)
router.post('/webhook', paymentController.paystackWebhookHandler);

export default router;

