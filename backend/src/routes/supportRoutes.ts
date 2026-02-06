import { Router } from 'express';
import * as supportController from '../controllers/supportController';
import { authenticate, requireAdmin } from '../middleware/auth';
import { validate } from '../utils/validators';
import { body } from 'express-validator';
import { uploadSingle } from '../middleware/upload';

const router = Router();

router.use(authenticate);

router.post(
  '/tickets',
  uploadSingle('attachment'),
  validate([
    body('category').isIn(['technical', 'billing', 'facility', 'other']).withMessage('Invalid category'),
    body('priority').isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
    body('subject').trim().isLength({ min: 5, max: 100 }).withMessage('Subject must be between 5 and 100 characters'),
    body('description').trim().isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters'),
  ]),
  supportController.createTicket
);

router.get('/tickets', supportController.getTickets);
router.get('/tickets/:id', supportController.getTicketById);
router.post(
  '/tickets/:id/message',
  validate([
    body('message').trim().notEmpty().withMessage('Message is required'),
  ]),
  supportController.addMessage
);
router.put('/tickets/:id/close', requireAdmin, supportController.closeTicket);

export default router;

