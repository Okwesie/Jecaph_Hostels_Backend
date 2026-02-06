import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';
import { comparePassword, hashPassword, validatePasswordStrength } from '../utils/password';
import { uploadSingle } from '../middleware/upload';
import path from 'path';
import fs from 'fs';

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        profilePicture: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    return sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
};

export const updateMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { firstName, lastName, phone, emergencyContact, program } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(firstName && { firstName: firstName.trim() }),
        ...(lastName && { lastName: lastName.trim() }),
        ...(phone && { phone: phone.trim() }),
        ...(emergencyContact && { emergencyContact: emergencyContact.trim() }),
        ...(program && { program: program.trim() }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        updatedAt: true,
      },
    });

    return sendSuccess(res, user, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      return sendError(res, 'Current password is incorrect', 401);
    }

    // Validate new password
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return sendError(res, 'Password validation failed', 400,
        passwordValidation.errors.map(err => ({ field: 'newPassword', message: err }))
      );
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return sendSuccess(res, null, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

export const uploadProfilePicture = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    if (!req.file) {
      return sendError(res, 'No file uploaded', 400);
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    // Get current user to delete old profile picture
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { profilePicture: true },
    });

    // Delete old profile picture if exists
    if (user?.profilePicture) {
      const oldFilePath = path.join(process.cwd(), user.profilePicture);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    // Update user profile picture
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { profilePicture: fileUrl },
    });

    return sendSuccess(res, { profilePicture: fileUrl }, 'Profile picture uploaded');
  } catch (error) {
    next(error);
  }
};

// Apply upload middleware
export const uploadProfilePictureHandler = [
  uploadSingle('file'),
  uploadProfilePicture,
];

