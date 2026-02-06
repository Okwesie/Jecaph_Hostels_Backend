import { body, ValidationChain, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { sendError } from './response';

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const formattedErrors = errors.array().map((error) => ({
      field: error.type === 'field' ? error.path : 'unknown',
      message: error.msg,
    }));

    return sendError(res, 'Validation failed', 400, formattedErrors);
  };
};

// Common validation rules
export const emailValidation = body('email')
  .isEmail()
  .withMessage('Please provide a valid email address')
  .normalizeEmail();

export const passwordValidation = body('password')
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters long')
  .matches(/[A-Z]/)
  .withMessage('Password must contain at least one uppercase letter')
  .matches(/[a-z]/)
  .withMessage('Password must contain at least one lowercase letter')
  .matches(/[0-9]/)
  .withMessage('Password must contain at least one number')
  .matches(/[!@#$%^&*(),.?":{}|<>]/)
  .withMessage('Password must contain at least one special character');

export const firstNameValidation = body('firstName')
  .trim()
  .isLength({ min: 2, max: 50 })
  .withMessage('First name must be between 2 and 50 characters');

export const lastNameValidation = body('lastName')
  .trim()
  .isLength({ min: 2, max: 50 })
  .withMessage('Last name must be between 2 and 50 characters');

export const phoneValidation = body('phone')
  .optional()
  .trim()
  .matches(/^\+?[1-9]\d{1,14}$/)
  .withMessage('Please provide a valid phone number');

