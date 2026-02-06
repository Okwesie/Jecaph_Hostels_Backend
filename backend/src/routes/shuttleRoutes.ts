import { Router } from 'express';
import * as shuttleController from '../controllers/shuttleController';
import { authenticate } from '../middleware/auth';
import { validate } from '../utils/validators';
import { body } from 'express-validator';

const router = Router();

router.use(authenticate);

router.get('/routes', shuttleController.getRoutes);

router.post(
  '/book',
  validate([
    body('routeId').notEmpty().withMessage('Route ID is required'),
    body('date').isISO8601().withMessage('Valid date is required'),
    body('seats').optional().isInt({ min: 1 }).withMessage('Seats must be at least 1'),
  ]),
  shuttleController.bookShuttle
);

router.get('/bookings', shuttleController.getBookings);
router.delete('/bookings/:id', shuttleController.cancelBooking);

export default router;

