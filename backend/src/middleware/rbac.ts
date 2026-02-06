import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

export enum Permission {
  // Bookings
  BOOKINGS_CREATE = 'bookings:create',
  BOOKINGS_READ_OWN = 'bookings:read:own',
  BOOKINGS_READ_ALL = 'bookings:read:all',
  BOOKINGS_UPDATE = 'bookings:update',
  BOOKINGS_APPROVE = 'bookings:approve',
  BOOKINGS_DELETE = 'bookings:delete',
  
  // Rooms
  ROOMS_READ = 'rooms:read',
  ROOMS_CREATE = 'rooms:create',
  ROOMS_UPDATE = 'rooms:update',
  ROOMS_DELETE = 'rooms:delete',
  
  // Payments
  PAYMENTS_CREATE = 'payments:create',
  PAYMENTS_READ_OWN = 'payments:read:own',
  PAYMENTS_READ_ALL = 'payments:read:all',
  PAYMENTS_REFUND = 'payments:refund',
  
  // Maintenance
  MAINTENANCE_CREATE = 'maintenance:create',
  MAINTENANCE_READ_OWN = 'maintenance:read:own',
  MAINTENANCE_READ_ALL = 'maintenance:read:all',
  MAINTENANCE_UPDATE = 'maintenance:update',
  MAINTENANCE_ASSIGN = 'maintenance:assign',
  
  // Users
  USERS_READ_OWN = 'users:read:own',
  USERS_UPDATE_OWN = 'users:update:own',
  USERS_READ_ALL = 'users:read:all',
  USERS_UPDATE_ANY = 'users:update:any',
  USERS_DELETE = 'users:delete',
  
  // Reports
  REPORTS_VIEW = 'reports:view',
  ANALYTICS_VIEW = 'analytics:view',
  
  // Settings
  SETTINGS_READ = 'settings:read',
  SETTINGS_UPDATE = 'settings:update',
}

const rolePermissions: Record<string, Permission[]> = {
  student: [
    Permission.BOOKINGS_CREATE,
    Permission.BOOKINGS_READ_OWN,
    Permission.ROOMS_READ,
    Permission.PAYMENTS_CREATE,
    Permission.PAYMENTS_READ_OWN,
    Permission.MAINTENANCE_CREATE,
    Permission.MAINTENANCE_READ_OWN,
    Permission.USERS_READ_OWN,
    Permission.USERS_UPDATE_OWN,
  ],
  staff: [
    // All student permissions plus:
    Permission.MAINTENANCE_READ_ALL,
    Permission.MAINTENANCE_UPDATE,
  ],
  manager: [
    // All staff permissions plus:
    Permission.BOOKINGS_READ_ALL,
    Permission.BOOKINGS_UPDATE,
    Permission.BOOKINGS_APPROVE,
    Permission.ROOMS_CREATE,
    Permission.ROOMS_UPDATE,
    Permission.PAYMENTS_READ_ALL,
    Permission.MAINTENANCE_ASSIGN,
    Permission.USERS_READ_ALL,
    Permission.REPORTS_VIEW,
    Permission.ANALYTICS_VIEW,
    Permission.SETTINGS_READ,
  ],
  admin: [
    // All manager permissions plus:
    Permission.BOOKINGS_DELETE,
    Permission.ROOMS_DELETE,
    Permission.PAYMENTS_REFUND,
    Permission.USERS_UPDATE_ANY,
    Permission.SETTINGS_UPDATE,
  ],
  super_admin: [
    // All permissions
    ...Object.values(Permission),
  ],
};

export const checkPermission = (...requiredPermissions: Permission[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(
          'UNAUTHORIZED',
          'Authentication required',
          401
        );
      }

      const userRole = req.user.role;
      const userPermissions = rolePermissions[userRole] || [];

      // Check if user has ALL required permissions
      const hasPermission = requiredPermissions.every(permission =>
        userPermissions.includes(permission)
      );

      if (!hasPermission) {
        throw new AppError(
          'INSUFFICIENT_PERMISSIONS',
          'You do not have permission to perform this action',
          403,
          {
            required_permissions: requiredPermissions,
            your_role: userRole,
          }
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Check resource ownership
export const checkOwnership = (resourceType: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const resourceId = req.params.id;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      // Admins, managers, super_admins can access any resource in their hostel
      if (['admin', 'manager', 'super_admin'].includes(userRole)) {
        return next();
      }

      // Import here to avoid circular dependency
      const { supabase } = await import('../config/database');

      // Check ownership based on resource type
      const { data, error } = await supabase
        .from(resourceType)
        .select('user_id, hostel_id')
        .eq('id', resourceId)
        .single();

      if (error || !data) {
        throw new AppError(
          'RESOURCE_NOT_FOUND',
          `${resourceType} not found`,
          404
        );
      }

      // Verify hostel isolation
      if (data.hostel_id !== req.hostelId) {
        throw new AppError(
          'FORBIDDEN',
          'Access denied',
          403
        );
      }

      // Verify ownership
      if (data.user_id !== userId) {
        throw new AppError(
          'FORBIDDEN',
          `You can only access your own ${resourceType}`,
          403
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
