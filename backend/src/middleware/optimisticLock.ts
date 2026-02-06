import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/database';
import { AppError } from '../utils/errors';

export const checkVersion = (tableName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { version } = req.body;
      const resourceId = req.params.id;

      if (version === undefined) {
        throw new AppError(
          'VERSION_REQUIRED',
          'Version number is required for updates',
          400,
          { field: 'version' }
        );
      }

      // Fetch current version from database
      const { data, error } = await supabase
        .from(tableName)
        .select('version, hostel_id')
        .eq('id', resourceId)
        .single();

      if (error || !data) {
        throw new AppError(
          'RESOURCE_NOT_FOUND',
          `${tableName} not found`,
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

      // Check version match
      if (data.version !== version) {
        throw new AppError(
          'VERSION_CONFLICT',
          'This record has been modified by another user',
          409,
          {
            current_version: data.version,
            your_version: version,
            message: 'Please refresh and try again'
          }
        );
      }

      // Store current version in request for update query
      req.body._currentVersion = version;

      next();
    } catch (error) {
      next(error);
    }
  };
};
