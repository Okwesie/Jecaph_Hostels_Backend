import { Router } from 'express';
import * as roomController from '../controllers/roomController';
import { authenticate, requireAdmin } from '../middleware/auth';
import { validate } from '../utils/validators';
import { body } from 'express-validator';

const router = Router();

// Public routes
router.get('/', roomController.getRooms);
router.get('/:id', roomController.getRoomById);

// Admin routes
router.post(
  '/',
  authenticate,
  requireAdmin,
  validate([
    body('roomNumber').notEmpty().withMessage('Room number is required'),
    body('type').isIn(['single', 'shared', 'suite', 'dormitory']).withMessage('Invalid room type'),
    body('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
    body('pricePerMonth').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  ]),
  roomController.createRoom
);

router.put(
  '/:id',
  authenticate,
  requireAdmin,
  roomController.updateRoom
);

router.delete('/:id', authenticate, requireAdmin, roomController.deleteRoom);

export default router;

