import { Router } from 'express';
import * as maintenanceController from '../controllers/maintenanceController';
import { authenticate, requireAdmin } from '../middleware/auth';
import { validate } from '../utils/validators';
import { body } from 'express-validator';
import { uploadSingle } from '../middleware/upload';

const router = Router();

router.use(authenticate);

router.post(
  '/submit',
  uploadSingle('attachment'),
  validate([
    body('title').trim().isLength({ min: 5, max: 100 }).withMessage('Title must be between 5 and 100 characters'),
    body('category').isIn(['plumbing', 'electrical', 'furniture', 'cleaning', 'other']).withMessage('Invalid category'),
    body('priority').isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
    body('description').trim().isLength({ min: 10, max: 500 }).withMessage('Description must be between 10 and 500 characters'),
  ]),
  maintenanceController.submitRequest
);

router.get('/requests', maintenanceController.getRequests);

router.put(
  '/requests/:id',
  requireAdmin,
  validate([
    body('status').optional().isIn(['new', 'in_progress', 'completed', 'cancelled']).withMessage('Invalid status'),
  ]),
  maintenanceController.updateRequest
);

export default router;

