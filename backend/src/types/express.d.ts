import { Express } from 'express-serve-static-core';

declare global {
  namespace Express {
    interface Request {
      hostelId?: string;
      campusId?: string;
      campus?: {
        id: string;
        name: string;
        status: string;
      };
      user?: {
        id: string;
        email: string;
        role: string;
        campusId?: string;
        hostelId?: string;
      };
    }
  }
}
