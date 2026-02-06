import { Router } from 'express';
import * as bookingController from '../controllers/bookingController';
import { authenticate, requireAdmin } from '../middleware/auth';
import { validate } from '../utils/validators';
import { body } from 'express-validator';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  validate([
    body('roomId').notEmpty().withMessage('Room ID is required'),
    body('checkInDate').isISO8601().withMessage('Valid check-in date is required'),
    body('checkOutDate').isISO8601().withMessage('Valid check-out date is required'),
  ]),
  bookingController.createBooking
);

router.get('/', bookingController.getBookings);
router.get('/:id', bookingController.getBookingById);

router.put(
  '/:id',
  requireAdmin,
  validate([
    body('status').isIn(['pending', 'approved', 'rejected', 'active', 'completed', 'cancelled']).withMessage('Invalid status'),
  ]),
  bookingController.updateBookingStatus
);

router.delete('/:id', bookingController.cancelBooking);

export default router;

