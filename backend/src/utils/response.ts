import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
  errorId?: string;
}

export const sendSuccess = <T>(
  res: Response,
  data?: T,
  message?: string,
  statusCode: number = 200
): Response => {
  const response: ApiResponse<T> = {
    success: true,
  };

  if (message) response.message = message;
  if (data) response.data = data;

  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 500,
  errors?: Array<{ field: string; message: string }>,
  errorId?: string
): Response => {
  const response: ApiResponse = {
    success: false,
    message,
  };

  if (errors) response.errors = errors;
  if (errorId) response.errorId = errorId;

  return res.status(statusCode).json(response);
};

