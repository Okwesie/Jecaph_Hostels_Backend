import { Router } from 'express';
import * as adminController from '../controllers/adminController';
import { authenticate, requireAdmin, requireSuperAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

router.get('/statistics', adminController.getStatistics);
router.get('/analytics', adminController.getAnalytics);
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', requireSuperAdmin, adminController.deleteUser);
router.get('/settings', adminController.getSettings);
router.put('/settings', requireSuperAdmin, adminController.updateSettings);

export default router;

